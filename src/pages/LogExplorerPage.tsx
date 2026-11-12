import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Download, ChevronDown, ChevronUp, Copy, X,
  FileText, Terminal, Hash, Clock, Cpu, Globe, User,
} from 'lucide-react';
import { useData } from '@/store/DataContext';
import { GlassCard, PageTransition, SectionHeader, Badge, EmptyState } from '@/components/ui';
import {
  severityColor, severityLabel, severityBgClass, osLabel, osColor,
  categoryLabel, categoryColor, formatTimestamp, exportToCsv, downloadJson,
} from '@/utils/format';
import type { SecurityLog, EventCategory, OS, Severity, EventOutcome } from '@/types';

const PAGE_SIZE = 15;

export function LogExplorerPage() {
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<'timestamp' | 'event_id' | 'hostname' | 'severity'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Open log from URL param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const log = data.logs.find(l => l.id === id);
      if (log) setSelectedLog(log);
    }
  }, [searchParams, data.logs]);

  const filtered = useMemo(() => {
    let logs = [...data.logs];
    // KQL-inspired search
    if (query.trim()) {
      const q = query.trim();
      // Check for field:value patterns
      const fieldMatch = q.match(/^(\w+(?:\.\w+)*)\s*:\s*(.+)$/);
      if (fieldMatch) {
        const [, field, value] = fieldMatch;
        const v = value.trim().toLowerCase();
        logs = logs.filter(l => {
          const fieldMap: Record<string, unknown> = {
            'event.code': String(l.event_id),
            'event.outcome': l.event_outcome,
            'source.ip': l.source_ip,
            'host.os.type': l.operating_system,
            'user.name': l.username,
            'host.name': l.hostname,
            'process.name': l.process_name,
            'event.category': l.event_category,
            'message': l.message,
          };
          const val = String(fieldMap[field] ?? '').toLowerCase();
          return val.includes(v);
        });
      } else {
        const lower = q.toLowerCase();
        logs = logs.filter(l =>
          l.message.toLowerCase().includes(lower) ||
          l.username.toLowerCase().includes(lower) ||
          l.source_ip.includes(lower) ||
          l.hostname.toLowerCase().includes(lower) ||
          String(l.event_id).includes(lower) ||
          l.process_name.toLowerCase().includes(lower)
        );
      }
    }
    if (osFilter !== 'all') logs = logs.filter(l => l.operating_system === osFilter);
    if (catFilter !== 'all') logs = logs.filter(l => l.event_category === catFilter);
    if (sevFilter !== 'all') logs = logs.filter(l => l.severity === sevFilter);
    if (outcomeFilter !== 'all') logs = logs.filter(l => l.event_outcome === outcomeFilter);

    // Sort
    logs.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'timestamp') cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      else if (sortField === 'event_id') cmp = a.event_id - b.event_id;
      else if (sortField === 'hostname') cmp = a.hostname.localeCompare(b.hostname);
      else if (sortField === 'severity') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        cmp = order[a.severity] - order[b.severity];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return logs;
  }, [data.logs, query, osFilter, catFilter, sevFilter, outcomeFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageLogs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleExportCsv = () => {
    exportToCsv(`sentinelops-logs-${Date.now()}.csv`,
      ['Timestamp', 'Hostname', 'OS', 'Event ID', 'Username', 'Source IP', 'Category', 'Severity', 'Outcome', 'Message'],
      filtered.map(l => [formatTimestamp(l.timestamp), l.hostname, osLabel(l.operating_system), l.event_id, l.username, l.source_ip, categoryLabel(l.event_category), severityLabel(l.severity), l.event_outcome, l.message])
    );
  };

  const categories: EventCategory[] = ['windows_security', 'windows_system', 'windows_application', 'linux_auth', 'linux_system', 'linux_ssh', 'linux_audit', 'file_integrity', 'kali_activity'];

  return (
    <PageTransition>
      <SectionHeader
        title="Log Explorer"
        subtitle="SIEM-style log investigation — Kibana Discover inspired"
        icon={<Terminal className="w-5 h-5" />}
        action={
          <button onClick={handleExportCsv} className="flex items-center gap-1.5 px-3 py-1.5 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-slate-300 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        }
      />

      {/* KQL Search bar */}
      <GlassCard className="p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-glow" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search logs — try: event.code:4625  ·  source.ip:203.0.113.10  ·  host.os.type:linux  ·  event.outcome:failure"
            className="w-full pl-10 pr-4 py-2.5 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-glow/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-400">{filtered.length} logs</span>
          {query && (
            <>
              <span className="text-xs text-slate-600">·</span>
              <button onClick={() => setQuery('')} className="text-xs text-cyan-glow hover:underline">Clear search</button>
            </>
          )}
          {/* Quick queries */}
          <div className="flex flex-wrap gap-1 ml-auto">
            {['event.code:4625', 'event.code:4624', 'host.os.type:linux', 'event.outcome:failure'].map(q => (
              <button key={q} onClick={() => { setQuery(q); setPage(0); }}
                className="px-2 py-0.5 text-[11px] font-mono bg-deep-navy/60 border border-neon-blue/15 rounded text-slate-400 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-neon-blue/10">
                <FilterSelect label="Operating System" value={osFilter} onChange={v => { setOsFilter(v); setPage(0); }}
                  options={[{ value: 'all', label: 'All OS' }, { value: 'windows', label: 'Windows' }, { value: 'linux', label: 'Linux' }, { value: 'kali', label: 'Kali Linux' }]} />
                <FilterSelect label="Category" value={catFilter} onChange={v => { setCatFilter(v); setPage(0); }}
                  options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: categoryLabel(c) }))]} />
                <FilterSelect label="Severity" value={sevFilter} onChange={v => { setSevFilter(v); setPage(0); }}
                  options={[{ value: 'all', label: 'All Severities' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
                <FilterSelect label="Outcome" value={outcomeFilter} onChange={v => { setOutcomeFilter(v); setPage(0); }}
                  options={[{ value: 'all', label: 'All Outcomes' }, { value: 'success', label: 'Success' }, { value: 'failure', label: 'Failure' }, { value: 'unknown', label: 'Unknown' }]} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Logs table */}
      <GlassCard className="overflow-hidden">
        {pageLogs.length === 0 ? (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No logs found" message="Try adjusting your search query or filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neon-blue/10 text-xs text-slate-400">
                  <Th label="Timestamp" field="timestamp" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <Th label="Hostname" field="hostname" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-2 text-left">OS</th>
                  <Th label="Event ID" field="event_id" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Source IP</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <Th label="Severity" field="severity" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {pageLogs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => { setSelectedLog(log); setSearchParams({ id: log.id }); }}
                    className="border-b border-neon-blue/5 hover:bg-cyan-glow/5 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs text-slate-400 font-mono whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-3 py-2.5 text-white whitespace-nowrap">{log.hostname}</td>
                    <td className="px-3 py-2.5"><span style={{ color: osColor(log.operating_system) }} className="text-xs">{osLabel(log.operating_system)}</span></td>
                    <td className="px-3 py-2.5 font-mono text-cyan-glow text-xs">{log.event_id}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-xs">{log.username}</td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{log.source_ip}</td>
                    <td className="px-3 py-2.5"><span style={{ color: categoryColor(log.event_category) }} className="text-xs">{categoryLabel(log.event_category)}</span></td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs border ${severityBgClass(log.severity)}`}>{severityLabel(log.severity)}</span></td>
                    <td className="px-3 py-2.5 text-slate-300 text-xs max-w-md truncate">{log.message}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neon-blue/10">
            <span className="text-xs text-slate-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-3 py-1 text-xs rounded border border-neon-blue/15 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">Prev</button>
              <span className="px-3 py-1 text-xs text-slate-400">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs rounded border border-neon-blue/15 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Detail panel */}
      <LogDetailPanel log={selectedLog} onClose={() => { setSelectedLog(null); setSearchParams({}); }} />
    </PageTransition>
  );
}

function Th({ label, field, sortField, sortDir, onSort }: {
  label: string; field: 'timestamp' | 'event_id' | 'hostname' | 'severity';
  sortField: string; sortDir: 'asc' | 'desc'; onSort: (f: typeof field) => void;
}) {
  return (
    <th className="px-3 py-2 text-left cursor-pointer hover:text-cyan-glow transition-colors" onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {sortField === field && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-1.5 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40 cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value} className="bg-deep-navy">{o.label}</option>)}
      </select>
    </div>
  );
}

function LogDetailPanel({ log, onClose }: { log: SecurityLog | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!log) return null;

  const fullJson = JSON.stringify(log, null, 2);
  const copyJson = () => {
    navigator.clipboard.writeText(fullJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="glass-strong rounded-xl border border-neon-blue/20 max-w-3xl w-full max-h-[85vh] overflow-y-auto scrollbar-thin"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-neon-blue/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${severityColor(log.severity)}15`, color: severityColor(log.severity) }}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Log Investigation — {log.id}</h3>
                <p className="text-xs text-slate-500">{formatTimestamp(log.timestamp)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5 space-y-4">
            {/* Message */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Event Message</div>
              <div className="p-3 bg-deep-navy/60 rounded-lg text-sm text-white border border-neon-blue/10">{log.message}</div>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <DetailField icon={<Hash className="w-3.5 h-3.5" />} label="Event ID" value={String(log.event_id)} color="#00E5FF" />
              <DetailField icon={<Globe className="w-3.5 h-3.5" />} label="Source IP" value={log.source_ip} color="#287BFF" />
              <DetailField icon={<Globe className="w-3.5 h-3.5" />} label="Destination IP" value={log.destination_ip} color="#8B5CF6" />
              <DetailField icon={<Cpu className="w-3.5 h-3.5" />} label="Hostname" value={log.hostname} color="#00E5A8" />
              <DetailField icon={<User className="w-3.5 h-3.5" />} label="Username" value={log.username} color="#FF8A24" />
              <DetailField icon={<Cpu className="w-3.5 h-3.5" />} label="Process" value={log.process_name} color="#E879F9" />
              <DetailField icon={<Clock className="w-3.5 h-3.5" />} label="Timestamp" value={formatTimestamp(log.timestamp)} color="#287BFF" />
              <DetailField icon={<Terminal className="w-3.5 h-3.5" />} label="Log Source" value={log.log_source} color="#00E5FF" />
              <DetailField icon={<Cpu className="w-3.5 h-3.5" />} label="Agent" value={log.agent_type} color="#00E5A8" />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge color={osColor(log.operating_system)}>{osLabel(log.operating_system)}</Badge>
              <Badge color={categoryColor(log.event_category)}>{categoryLabel(log.event_category)}</Badge>
              <Badge color={severityColor(log.severity)}>{severityLabel(log.severity)}</Badge>
              <Badge color={log.event_outcome === 'success' ? '#00E5A8' : '#FF3B5C'}>{log.event_outcome}</Badge>
              {log.file_path && <Badge color="#FF8A24">{log.file_path}</Badge>}
            </div>

            {/* JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-slate-500">Complete JSON (ECS)</div>
                <button onClick={copyJson} className="flex items-center gap-1 text-xs text-cyan-glow hover:underline">
                  <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-3 bg-midnight rounded-lg text-xs font-mono text-cyan-glow/80 overflow-x-auto scrollbar-thin border border-neon-blue/10 max-h-60">
                {fullJson}
              </pre>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailField({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1" style={{ color }}>{icon} {label}</div>
      <div className="text-sm text-white font-mono break-all">{value}</div>
    </div>
  );
}
