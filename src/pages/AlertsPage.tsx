import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, X, AlertTriangle, CheckCircle, Eye, FileText,
  Clock, Shield, MessageSquare, ArrowRight, Cpu,
} from 'lucide-react';
import { useData } from '@/store/DataContext';
import { GlassCard, PageTransition, SectionHeader, Badge, EmptyState } from '@/components/ui';
import {
  severityColor, severityLabel, severityBgClass, statusColor, statusLabel,
  formatTimestamp, timeAgo, osColor,
} from '@/utils/format';
import type { Alert } from '@/types';

export function AlertsPage() {
  const { data, updateAlert, addAlertNote } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Alert | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const alert = data.alerts.find(a => a.id === id || a.alert_id === id);
      if (alert) setSelected(alert);
    }
  }, [searchParams, data.alerts]);

  const filtered = useMemo(() => {
    return data.alerts.filter(a => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) &&
            !a.endpoint.toLowerCase().includes(q) && !a.source_ip.includes(q) && !a.username.toLowerCase().includes(q)) return false;
      }
      if (sevFilter !== 'all' && a.severity !== sevFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.detection_timestamp).getTime() - new Date(a.detection_timestamp).getTime());
  }, [data.alerts, search, sevFilter, statusFilter]);

  const selectedLogs = useMemo(() => {
    if (!selected) return [];
    return data.logs.filter(l => selected.related_log_ids.includes(l.id));
  }, [selected, data.logs]);

  const selectedRule = useMemo(() => {
    if (!selected) return null;
    return data.rules.find(r => r.id === selected.detection_rule_id);
  }, [selected, data.rules]);

  // Keep selected in sync with data updates
  useEffect(() => {
    if (selected) {
      const updated = data.alerts.find(a => a.id === selected.id);
      if (updated && updated !== selected) setSelected(updated);
    }
  }, [data.alerts, selected]);

  const handleAcknowledge = () => {
    if (!selected) return;
    updateAlert(selected.id, { status: 'acknowledged' });
  };
  const handleResolve = () => {
    if (!selected) return;
    updateAlert(selected.id, { status: 'resolved' });
  };
  const handleAddNote = () => {
    if (!selected || !noteText.trim()) return;
    addAlertNote(selected.id, noteText, 'soc.analyst');
    setNoteText('');
  };

  return (
    <PageTransition>
      <SectionHeader
        title="Security Alerts"
        subtitle="Detection engine alerts — investigate and respond"
        icon={<Bell className="w-5 h-5" />}
        action={
          <div className="flex gap-2">
            <Badge color="#FF3B5C">Critical: {data.alerts.filter(a => a.severity === 'critical').length}</Badge>
            <Badge color="#FF8A24">High: {data.alerts.filter(a => a.severity === 'high').length}</Badge>
          </div>
        }
      />

      {/* Filters */}
      <GlassCard className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search alerts..."
              className="w-full pl-10 pr-4 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/50" />
          </div>
          <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
            className="px-3 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/50">
            <option value="all" className="bg-deep-navy">All Severities</option>
            <option value="critical" className="bg-deep-navy">Critical</option>
            <option value="high" className="bg-deep-navy">High</option>
            <option value="medium" className="bg-deep-navy">Medium</option>
            <option value="low" className="bg-deep-navy">Low</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/50">
            <option value="all" className="bg-deep-navy">All Status</option>
            <option value="new" className="bg-deep-navy">New</option>
            <option value="active" className="bg-deep-navy">Active</option>
            <option value="acknowledged" className="bg-deep-navy">Acknowledged</option>
            <option value="resolved" className="bg-deep-navy">Resolved</option>
          </select>
          <span className="text-xs text-slate-500">{filtered.length} alerts</span>
        </div>
      </GlassCard>

      {/* Alerts table */}
      <GlassCard className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No alerts found" message="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neon-blue/10 text-xs text-slate-400">
                  <th className="px-3 py-2 text-left">Alert ID</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Severity</th>
                  <th className="px-3 py-2 text-left">Endpoint</th>
                  <th className="px-3 py-2 text-left">Source IP</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Detected</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    onClick={() => { setSelected(a); setSearchParams({ id: a.id }); }}
                    className="border-b border-neon-blue/5 hover:bg-cyan-glow/5 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-cyan-glow">{a.alert_id}</td>
                    <td className="px-3 py-2.5 text-white text-xs max-w-xs truncate">{a.title}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs border ${severityBgClass(a.severity)}`}>{severityLabel(a.severity)}</span></td>
                    <td className="px-3 py-2.5 text-slate-300 text-xs">{a.endpoint}</td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{a.source_ip}</td>
                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded text-xs capitalize" style={{ color: statusColor(a.status), backgroundColor: `${statusColor(a.status)}15` }}>{a.status}</span></td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{timeAgo(a.detection_timestamp)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Alert detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => { setSelected(null); setSearchParams({}); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-strong rounded-xl border border-neon-blue/20 max-w-3xl w-full max-h-[85vh] overflow-y-auto scrollbar-thin"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-neon-blue/10 sticky top-0 bg-deep-navy/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${severityColor(selected.severity)}15`, color: severityColor(selected.severity) }}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{selected.title}</h3>
                    <p className="text-xs text-slate-500 font-mono">{selected.alert_id} · {formatTimestamp(selected.detection_timestamp)}</p>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setSearchParams({}); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Description */}
                <div className="p-3 bg-deep-navy/60 rounded-lg border border-neon-blue/10">
                  <div className="text-xs text-slate-500 mb-1">Description</div>
                  <p className="text-sm text-white">{selected.description}</p>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <AlertField label="Severity" value={severityLabel(selected.severity)} color={severityColor(selected.severity)} />
                  <AlertField label="Status" value={statusLabel(selected.status)} color={statusColor(selected.status)} />
                  <AlertField label="Endpoint" value={selected.endpoint} color="#287BFF" />
                  <AlertField label="Source IP" value={selected.source_ip} color="#FF8A24" />
                  <AlertField label="Username" value={selected.username} color="#00E5A8" />
                  <AlertField label="Event IDs" value={selected.event_ids.join(', ')} color="#00E5FF" />
                </div>

                {/* Detection rule */}
                {selectedRule && (
                  <div className="p-3 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Cpu className="w-3 h-3" /> Detection Rule</div>
                    <div className="text-sm text-white">{selectedRule.name}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{selectedRule.rule_id}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {selected.status !== 'acknowledged' && selected.status !== 'resolved' && (
                    <button onClick={handleAcknowledge} className="flex items-center gap-1.5 px-3 py-2 bg-alert-orange/10 border border-alert-orange/30 rounded-lg text-sm text-alert-orange hover:bg-alert-orange/20 transition-colors">
                      <Eye className="w-4 h-4" /> Acknowledge
                    </button>
                  )}
                  {selected.status !== 'resolved' && (
                    <button onClick={handleResolve} className="flex items-center gap-1.5 px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-sm text-success hover:bg-success/20 transition-colors">
                      <CheckCircle className="w-4 h-4" /> Resolve
                    </button>
                  )}
                </div>

                {/* Investigation notes */}
                <div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Investigation Notes</div>
                  <div className="space-y-2 mb-2">
                    {selected.investigation_notes.length === 0 ? (
                      <p className="text-xs text-slate-600">No notes yet.</p>
                    ) : (
                      selected.investigation_notes.map((n, i) => (
                        <div key={i} className="p-2.5 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span className="text-cyan-glow">{n.author}</span>
                            <span>{formatTimestamp(n.timestamp)}</span>
                          </div>
                          <p className="text-sm text-slate-300">{n.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Add investigation note..."
                      className="flex-1 px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/40"
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    />
                    <button onClick={handleAddNote} className="px-3 py-2 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors">Add</button>
                  </div>
                </div>

                {/* Related logs */}
                <div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Related Evidence Logs ({selectedLogs.length})</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {selectedLogs.map(l => (
                      <div key={l.id} className="flex items-center gap-3 px-3 py-1.5 bg-deep-navy/30 rounded-lg">
                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: severityColor(l.severity) }} />
                        <span className="text-xs font-mono text-cyan-glow w-12">{l.event_id}</span>
                        <span className="text-xs text-slate-300 flex-1 truncate">{l.message.substring(0, 60)}</span>
                        <span className="text-xs text-slate-500">{timeAgo(l.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function AlertField({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
      <div className="text-xs mb-1" style={{ color }}>{label}</div>
      <div className="text-sm text-white font-mono">{value}</div>
    </div>
  );
}
