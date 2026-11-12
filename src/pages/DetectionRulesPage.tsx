import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Plus, Search, X, Power, Edit3, Activity, AlertTriangle,
  FileText, Clock, Shield, Zap, Eye, EyeOff, Save, History,
} from 'lucide-react';
import { useData } from '@/store/DataContext';
import { GlassCard, PageTransition, SectionHeader, Badge, EmptyState } from '@/components/ui';
import {
  severityColor, severityLabel, severityBgClass, formatTimestamp, timeAgo, categoryLabel,
} from '@/utils/format';
import type { DetectionRule, Severity } from '@/types';

const SEVERITY_OPTIONS: Severity[] = ['critical', 'high', 'medium', 'low'];

export function DetectionRulesPage() {
  const { data, toggleRule, updateRule } = useData();
  const [search, setSearch] = useState('');
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(null);
  const [viewingRule, setViewingRule] = useState<DetectionRule | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return data.rules;
    const q = search.toLowerCase();
    return data.rules.filter(r =>
      r.name.toLowerCase().includes(q) || r.rule_id.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }, [data.rules, search]);

  const ruleAlerts = (ruleId: string) => data.alerts.filter(a => a.detection_rule_id === ruleId);
  const ruleLogs = (rule: DetectionRule) => data.logs.filter(l => rule.event_ids.includes(l.event_id)).slice(0, 10);

  return (
    <PageTransition>
      <SectionHeader
        title="Detection Rules"
        subtitle="Simulated detection engine — evaluates centralized logs in real-time"
        icon={<Cpu className="w-5 h-5" />}
        action={
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors">
            <Plus className="w-4 h-4" /> New Rule
          </button>
        }
      />

      {/* Status banner */}
      <div className="flex items-center gap-3 p-3 mb-4 bg-deep-navy/60 border border-neon-blue/15 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
          </span>
          <span className="text-sm text-success font-medium">Detection Engine Active</span>
        </div>
        <span className="text-xs text-slate-500">·</span>
        <span className="text-xs text-slate-400">{data.rules.filter(r => r.enabled).length} of {data.rules.length} rules enabled</span>
        <span className="text-xs text-slate-500">·</span>
        <span className="text-xs text-slate-400">{data.alerts.length} alerts generated</span>

      </div>

      {/* Search */}
      <GlassCard className="p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search detection rules..."
            className="w-full pl-10 pr-4 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/50" />
        </div>
      </GlassCard>

      {/* Rules grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((rule, i) => {
          const alerts = ruleAlerts(rule.id);
          const logs = ruleLogs(rule);
          return (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className={`p-5 h-full ${!rule.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${severityColor(rule.severity)}15`, color: severityColor(rule.severity) }}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{rule.rule_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.implemented ? (
                      <Badge color="#00E5A8"><CheckIcon /> Implemented</Badge>
                    ) : (
                      <Badge color="#FF8A24">Planned</Badge>
                    )}
                    <button onClick={() => toggleRule(rule.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${rule.enabled ? 'bg-success/10 text-success' : 'bg-slate-700/30 text-slate-500'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{rule.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded">
                    <span className="text-slate-500">Severity</span>
                    <span style={{ color: severityColor(rule.severity) }}>{severityLabel(rule.severity)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded">
                    <span className="text-slate-500">Threshold</span>
                    <span className="text-white">{rule.threshold}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded">
                    <span className="text-slate-500">Window</span>
                    <span className="text-white">{rule.time_window_minutes}m</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded">
                    <span className="text-slate-500">Event IDs</span>
                    <span className="text-cyan-glow font-mono">{rule.event_ids.join(', ')}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded">
                    <span className="text-slate-500">MITRE</span>
                    <span className="text-cyber-purple font-mono">{rule.mitre_attack}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded">
                    <span className="text-slate-500">Executions</span>
                    <span className="text-white">{rule.execution_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge color="#FF3B5C"><AlertTriangle className="w-3 h-3" /> {alerts.length} Alerts</Badge>
                  <Badge color="#00E5FF"><FileText className="w-3 h-3" /> {logs.length}+ Logs</Badge>
                  {rule.category.map(c => <Badge key={c} color="#8B5CF6">{categoryLabel(c)}</Badge>)}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-neon-blue/10">
                  <button onClick={() => setViewingRule(rule)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-slate-300 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all">
                    <Eye className="w-3 h-3" /> Details
                  </button>
                  <button onClick={() => setEditingRule(rule)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-slate-300 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(rule.last_executed)}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* View modal */}
      <RuleDetailModal rule={viewingRule} onClose={() => setViewingRule(null)}
        alerts={viewingRule ? ruleAlerts(viewingRule.id) : []}
        logs={viewingRule ? ruleLogs(viewingRule) : []} />

      {/* Edit modal */}
      {editingRule && (
        <RuleEditModal rule={editingRule} onClose={() => setEditingRule(null)}
          onSave={(updates) => { updateRule(editingRule.id, updates); setEditingRule(null); }} />
      )}

      {/* Create modal */}
      {showCreate && (
        <RuleCreateModal onClose={() => setShowCreate(false)}
          onSave={(rule) => { updateRule(rule.id, rule); setShowCreate(false); }} />
      )}
    </PageTransition>
  );
}

function CheckIcon() { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }

function RuleDetailModal({ rule, onClose, alerts, logs }: {
  rule: DetectionRule | null; onClose: () => void;
  alerts: ReturnType<typeof useData>['data']['alerts'];
  logs: ReturnType<typeof useData>['data']['logs'];
}) {
  if (!rule) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="glass-strong rounded-xl border border-neon-blue/20 max-w-2xl w-full max-h-[85vh] overflow-y-auto scrollbar-thin"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-neon-blue/10 sticky top-0 bg-deep-navy/95 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${severityColor(rule.severity)}15`, color: severityColor(rule.severity) }}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{rule.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{rule.rule_id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5 space-y-4">
            <div className="p-3 bg-deep-navy/60 rounded-lg border border-neon-blue/10">
              <div className="text-xs text-slate-500 mb-1">Description</div>
              <p className="text-sm text-white">{rule.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <KV k="Severity" v={severityLabel(rule.severity)} color={severityColor(rule.severity)} />
              <KV k="Threshold" v={`${rule.threshold} events`} />
              <KV k="Time Window" v={`${rule.time_window_minutes} min`} />
              <KV k="Event IDs" v={rule.event_ids.join(', ')} color="#00E5FF" />
              <KV k="MITRE Attack" v={rule.mitre_attack} color="#8B5CF6" />
              <KV k="MITRE Tactic" v={rule.mitre_tactic} />
              <KV k="Enabled" v={rule.enabled ? 'Yes' : 'No'} color={rule.enabled ? '#00E5A8' : '#FF3B5C'} />
              <KV k="Implemented" v={rule.implemented ? 'Yes' : 'No'} color={rule.implemented ? '#00E5A8' : '#FF8A24'} />
              <KV k="Executions" v={String(rule.execution_count)} />
              <KV k="Last Executed" v={formatTimestamp(rule.last_executed)} />
            </div>

            {/* Execution history */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><History className="w-4 h-4 text-cyan-glow" /> Execution History</h4>
              <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-deep-navy/30 rounded-lg text-xs">
                    <Zap className="w-3 h-3 text-success" />
                    <span className="text-slate-300">Rule executed against {i === 0 ? `${rule.event_ids.length} event type(s)` : 'log stream'}</span>
                    <span className="text-slate-500 ml-auto">{timeAgo(new Date(Date.now() - (i + 1) * 600000).toISOString())}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated alerts */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-critical" /> Generated Alerts ({alerts.length})</h4>
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-600">No alerts generated by this rule.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {alerts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-deep-navy/30 rounded-lg">
                      <AlertTriangle className="w-3 h-3" style={{ color: severityColor(a.severity) }} />
                      <span className="text-xs text-white flex-1 truncate">{a.title}</span>
                      <span className="text-xs" style={{ color: severityColor(a.severity) }}>{severityLabel(a.severity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related logs */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-glow" /> Related Logs Sample</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                {logs.map(l => (
                  <div key={l.id} className="flex items-center gap-3 px-3 py-1.5 bg-deep-navy/30 rounded-lg">
                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: severityColor(l.severity) }} />
                    <span className="text-xs font-mono text-cyan-glow">{l.event_id}</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{l.message.substring(0, 60)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RuleEditModal({ rule, onClose, onSave }: {
  rule: DetectionRule; onClose: () => void; onSave: (updates: Partial<DetectionRule>) => void;
}) {
  const [name, setName] = useState(rule.name);
  const [description, setDescription] = useState(rule.description);
  const [severity, setSeverity] = useState<Severity>(rule.severity);
  const [threshold, setThreshold] = useState(rule.threshold);
  const [timeWindow, setTimeWindow] = useState(rule.time_window_minutes);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="glass-strong rounded-xl border border-neon-blue/20 max-w-md w-full"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-neon-blue/10">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Edit3 className="w-4 h-4 text-cyan-glow" /> Edit Rule</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <FormField label="Rule Name">
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
            </FormField>
            <FormField label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40 resize-none" />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Severity">
                <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/40">
                  {SEVERITY_OPTIONS.map(s => <option key={s} value={s} className="bg-deep-navy">{severityLabel(s)}</option>)}
                </select>
              </FormField>
              <FormField label="Threshold">
                <input type="number" value={threshold} min={1} onChange={e => setThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
              </FormField>
              <FormField label="Window (min)">
                <input type="number" value={timeWindow} min={1} onChange={e => setTimeWindow(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
              </FormField>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => onSave({ name, description, severity, threshold, time_window_minutes: timeWindow })}
                className="flex-1 py-2 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors flex items-center justify-center gap-1.5">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RuleCreateModal({ onClose, onSave }: {
  onClose: () => void; onSave: (rule: DetectionRule) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [threshold, setThreshold] = useState(5);
  const [timeWindow, setTimeWindow] = useState(5);
  const [eventId, setEventId] = useState(4625);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim() || !description.trim()) { setError('Name and description are required'); return; }
    const id = `DR-${String(Date.now()).slice(-3)}`;
    onSave({
      id, rule_id: `CUSTOM-${id}`, name, description,
      event_ids: [eventId], category: ['windows_security'], severity,
      threshold, time_window_minutes: timeWindow, enabled: true, implemented: false,
      mitre_attack: 'T0000', mitre_tactic: 'Custom',
      last_executed: new Date().toISOString(), execution_count: 0,
    });
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="glass-strong rounded-xl border border-neon-blue/20 max-w-md w-full"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-neon-blue/10">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-glow" /> Create Detection Rule</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <FormField label="Rule Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Custom Failed Login Rule"
                className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/40" />
            </FormField>
            <FormField label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe what this rule detects..."
                className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/40 resize-none" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Severity">
                <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/40">
                  {SEVERITY_OPTIONS.map(s => <option key={s} value={s} className="bg-deep-navy">{severityLabel(s)}</option>)}
                </select>
              </FormField>
              <FormField label="Event ID">
                <input type="number" value={eventId} onChange={e => setEventId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
              </FormField>
              <FormField label="Threshold">
                <input type="number" value={threshold} min={1} onChange={e => setThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
              </FormField>
              <FormField label="Window (min)">
                <input type="number" value={timeWindow} min={1} onChange={e => setTimeWindow(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
              </FormField>
            </div>
            {error && <div className="text-xs text-critical bg-critical/10 border border-critical/20 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Create
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-400 mb-1.5 block">{label}</label>{children}</div>;
}
function KV({ k, v, color }: { k: string; v: string; color?: string }) {
  return <div className="flex justify-between px-2 py-1.5 bg-deep-navy/40 rounded"><span className="text-slate-500">{k}</span><span className="text-right" style={{ color: color || '#e2e8f0' }}>{v}</span></div>;
}
