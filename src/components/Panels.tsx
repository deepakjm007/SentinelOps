import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, MonitorSmartphone, Bell, Cpu, BookOpen, ArrowRight } from 'lucide-react';
import { useData } from '@/store/DataContext';
import { severityLabel, formatTimestamp, categoryLabel, severityColor } from '@/utils/format';

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { logs: [], endpoints: [], alerts: [], rules: [], useCases: [] };
    const q = query.toLowerCase();
    return {
      logs: data.logs.filter(l =>
        l.message.toLowerCase().includes(q) || l.username.toLowerCase().includes(q) ||
        l.source_ip.includes(q) || l.hostname.toLowerCase().includes(q) ||
        String(l.event_id).includes(q)
      ).slice(0, 5),
      endpoints: data.endpoints.filter(e =>
        e.name.toLowerCase().includes(q) || e.ip_address.includes(q) || e.os_version.toLowerCase().includes(q)
      ).slice(0, 5),
      alerts: data.alerts.filter(a =>
        a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) ||
        a.endpoint.toLowerCase().includes(q) || a.source_ip.includes(q)
      ).slice(0, 5),
      rules: data.rules.filter(r =>
        r.name.toLowerCase().includes(q) || r.rule_id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      ).slice(0, 5),
      useCases: data.useCases.filter(uc =>
        uc.title.toLowerCase().includes(q) || uc.description.toLowerCase().includes(q) ||
        uc.use_case_id.toLowerCase().includes(q)
      ).slice(0, 5),
    };
  }, [query, data]);

  const totalResults = results.logs.length + results.endpoints.length + results.alerts.length + results.rules.length + results.useCases.length;

  const go = (path: string) => {
    navigate(path);
    setQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[61]"
          >
            <div className="glass-strong rounded-xl border border-neon-blue/20 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-neon-blue/10">
                <Search className="w-5 h-5 text-cyan-glow" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search logs, endpoints, alerts, rules, use cases..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                {query.trim() === '' ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Search across all modules: logs, endpoints, alerts, detection rules, and use cases.
                  </div>
                ) : totalResults === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No results found for "{query}"</div>
                ) : (
                  <div className="p-2">
                    {results.logs.length > 0 && (
                      <ResultGroup title="Logs" icon={<FileText className="w-4 h-4" />}>
                        {results.logs.map(l => (
                          <ResultRow key={l.id} onClick={() => go(`/monitoring/logs?id=${l.id}`)}>
                            <span className="text-xs text-slate-500 font-mono">{l.event_id}</span>
                            <span className="text-sm text-white truncate flex-1">{l.message.substring(0, 60)}</span>
                            <span className="text-xs" style={{ color: severityColor(l.severity) }}>{severityLabel(l.severity)}</span>
                          </ResultRow>
                        ))}
                      </ResultGroup>
                    )}
                    {results.endpoints.length > 0 && (
                      <ResultGroup title="Endpoints" icon={<MonitorSmartphone className="w-4 h-4" />}>
                        {results.endpoints.map(e => (
                          <ResultRow key={e.id} onClick={() => go(`/monitoring/endpoints?id=${e.id}`)}>
                            <span className="text-sm text-white flex-1">{e.name}</span>
                            <span className="text-xs text-slate-500">{e.ip_address}</span>
                          </ResultRow>
                        ))}
                      </ResultGroup>
                    )}
                    {results.alerts.length > 0 && (
                      <ResultGroup title="Alerts" icon={<Bell className="w-4 h-4" />}>
                        {results.alerts.map(a => (
                          <ResultRow key={a.id} onClick={() => go(`/monitoring/alerts?id=${a.id}`)}>
                            <span className="text-sm text-white truncate flex-1">{a.title}</span>
                            <span className="text-xs" style={{ color: severityColor(a.severity) }}>{severityLabel(a.severity)}</span>
                          </ResultRow>
                        ))}
                      </ResultGroup>
                    )}
                    {results.rules.length > 0 && (
                      <ResultGroup title="Detection Rules" icon={<Cpu className="w-4 h-4" />}>
                        {results.rules.map(r => (
                          <ResultRow key={r.id} onClick={() => go('/detection/rules')}>
                            <span className="text-xs text-slate-500 font-mono">{r.rule_id}</span>
                            <span className="text-sm text-white truncate flex-1">{r.name}</span>
                          </ResultRow>
                        ))}
                      </ResultGroup>
                    )}
                    {results.useCases.length > 0 && (
                      <ResultGroup title="Use Cases" icon={<BookOpen className="w-4 h-4" />}>
                        {results.useCases.map(uc => (
                          <ResultRow key={uc.id} onClick={() => go(`/detection/use-cases?id=${uc.id}`)}>
                            <span className="text-xs text-cyan-glow font-mono">{uc.use_case_id}</span>
                            <span className="text-sm text-white truncate flex-1">{uc.title}</span>
                          </ResultRow>
                        ))}
                      </ResultGroup>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ResultGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-glow/5 transition-colors text-left group"
    >
      {children}
      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-glow transition-colors" />
    </button>
  );
}

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, markNotificationRead, markAllNotificationsRead } = useData();
  const unreadCount = data.notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 right-4 w-full max-w-sm z-[61] glass-strong rounded-xl border border-neon-blue/20 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-neon-blue/10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-glow" />
                <span className="font-semibold text-white text-sm">Notifications</span>
                {unreadCount > 0 && <span className="px-1.5 py-0.5 text-xs rounded bg-critical/20 text-critical">{unreadCount} new</span>}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} className="text-xs text-cyan-glow hover:underline">Mark all read</button>
                )}
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
              {data.notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>
              ) : (
                data.notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full flex items-start gap-3 p-3 border-b border-neon-blue/5 text-left hover:bg-white/5 transition-colors ${!n.read ? 'bg-cyan-glow/5' : ''}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: severityColor(n.severity), boxShadow: `0 0 6px ${severityColor(n.severity)}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{n.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-slate-600 mt-1">{formatTimestamp(n.timestamp)}</div>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-cyan-glow flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
