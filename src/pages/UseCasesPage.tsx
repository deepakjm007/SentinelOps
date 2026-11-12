import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, X, Target, Cpu, FileText, AlertTriangle,
  CheckCircle, ArrowRight, Clock, ListChecks, Lightbulb, FlaskConical, Eye, Shield,
} from 'lucide-react';
import { useData } from '@/store/DataContext';
import { GlassCard, PageTransition, SectionHeader, Badge, EmptyState } from '@/components/ui';
import {
  severityColor, severityLabel, formatTimestamp, timeAgo, categoryColor, categoryLabel, osColor,
} from '@/utils/format';
import type { UseCase } from '@/types';

export function UseCasesPage() {
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UseCase | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const uc = data.useCases.find(u => u.id === id || u.use_case_id === id);
      if (uc) setSelected(uc);
    }
  }, [searchParams, data.useCases]);

  const filtered = useMemo(() => {
    if (!search) return data.useCases;
    const q = search.toLowerCase();
    return data.useCases.filter(uc =>
      uc.title.toLowerCase().includes(q) || uc.description.toLowerCase().includes(q) ||
      uc.use_case_id.toLowerCase().includes(q)
    );
  }, [data.useCases, search]);

  const relatedRule = (ruleId: string) => data.rules.find(r => r.id === ruleId);
  const relatedAlerts = (alertIds: string[]) => data.alerts.filter(a => alertIds.includes(a.alert_id) || alertIds.includes(a.id));
  const evidenceLogs = (logIds: string[]) => data.logs.filter(l => logIds.includes(l.id));

  return (
    <PageTransition>
      <SectionHeader
        title="Use Cases"
        subtitle="Cybersecurity detection scenarios — simulated demonstrations"
        icon={<BookOpen className="w-5 h-5" />}
        action={<Badge color="#FF8A24">DEMO — Simulated Evidence</Badge>}
      />

      {/* Search */}
      <GlassCard className="p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search use cases..."
            className="w-full pl-10 pr-4 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/50" />
        </div>
      </GlassCard>

      {/* Use case cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((uc, i) => {
          const rule = relatedRule(uc.related_rule_id);
          const alerts = relatedAlerts(uc.related_alert_ids);
          const logs = evidenceLogs(uc.evidence_log_ids);
          const colors = ['#FF3B5C', '#FF8A24', '#00E5A8', '#287BFF', '#8B5CF6'];
          const accent = colors[i % colors.length];
          return (
            <motion.div key={uc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => { setSelected(uc); setSearchParams({ id: uc.id }); }} className="cursor-pointer">
              <GlassCard className="p-5 h-full hover:border-cyan-glow/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-midnight" style={{ backgroundColor: accent }}>
                      {uc.use_case_id.replace('UC', '')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{uc.title}</h3>
                      <p className="text-xs text-slate-500 font-mono">{uc.use_case_id}</p>
                    </div>
                  </div>
                  {uc.status === 'implemented' ? (
                    <Badge color="#00E5A8"><CheckCircle className="w-3 h-3" /> Implemented</Badge>
                  ) : uc.status === 'partial' ? (
                    <Badge color="#FF8A24">Partial</Badge>
                  ) : (
                    <Badge color="#287BFF">Planned</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed line-clamp-2">{uc.description}</p>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {rule && <Badge color={severityColor(rule.severity)}>{rule.name}</Badge>}
                  <Badge color="#FF3B5C"><AlertTriangle className="w-3 h-3" /> {alerts.length} Alerts</Badge>
                  <Badge color="#00E5FF"><FileText className="w-3 h-3" /> {logs.length} Evidence Logs</Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neon-blue/10">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Target className="w-3 h-3" /> {uc.objective.substring(0, 50)}...</span>
                  <span className="text-xs text-cyan-glow flex items-center gap-1">View Details <ArrowRight className="w-3 h-3" /></span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Detail panel */}
      <UseCaseDetail uc={selected} onClose={() => { setSelected(null); setSearchParams({}); }}
        rule={selected ? (relatedRule(selected.related_rule_id) ?? null) : null}
        alerts={selected ? relatedAlerts(selected.related_alert_ids) : []}
        logs={selected ? evidenceLogs(selected.evidence_log_ids) : []} />
    </PageTransition>
  );
}

function UseCaseDetail({ uc, onClose, rule, alerts, logs }: {
  uc: UseCase | null; onClose: () => void;
  rule: ReturnType<typeof useData>['data']['rules'][0] | null;
  alerts: ReturnType<typeof useData>['data']['alerts'];
  logs: ReturnType<typeof useData>['data']['logs'];
}) {
  if (!uc) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="glass-strong rounded-xl border border-neon-blue/20 max-w-3xl w-full max-h-[88vh] overflow-y-auto scrollbar-thin"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-neon-blue/10 sticky top-0 bg-deep-navy/95 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-glow to-neon-blue text-midnight font-bold">
                {uc.use_case_id.replace('UC', '')}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{uc.title}</h3>
                <p className="text-xs text-slate-500 font-mono">{uc.use_case_id} · Simulated Demonstration</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5 space-y-5">
            {/* Status banner */}
            <div className={`p-3 rounded-lg border flex items-center gap-2 ${uc.status === 'implemented' ? 'bg-success/10 border-success/30' : 'bg-alert-orange/10 border-alert-orange/30'}`}>
              {uc.status === 'implemented' ? <CheckCircle className="w-4 h-4 text-success" /> : <FlaskConical className="w-4 h-4 text-alert-orange" />}
              <span className="text-sm" style={{ color: uc.status === 'implemented' ? '#00E5A8' : '#FF8A24' }}>
                {uc.status === 'implemented' ? 'Implementation Complete — Detection logic verified with simulated data' : 'Partial Implementation'}
              </span>
            </div>

            {/* Objective & Description */}
            <Section icon={<Target className="w-4 h-4" />} title="Objective">
              <p className="text-sm text-slate-300">{uc.objective}</p>
            </Section>

            <Section icon={<BookOpen className="w-4 h-4" />} title="Description">
              <p className="text-sm text-slate-300">{uc.description}</p>
            </Section>

            {/* Detection Logic */}
            <Section icon={<Cpu className="w-4 h-4" />} title="Detection Logic">
              <div className="p-3 bg-deep-navy/60 rounded-lg border border-neon-blue/10">
                <p className="text-sm text-slate-300">{uc.detection_logic}</p>
                {rule && (
                  <div className="mt-2 pt-2 border-t border-neon-blue/10 flex items-center gap-2">
                    <ShieldIcon /> <span className="text-xs text-cyan-glow font-mono">{rule.rule_id}</span>
                    <span className="text-xs text-slate-400">— {rule.name}</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Event Sources */}
            <Section icon={<FileText className="w-4 h-4" />} title="Required Event Sources">
              <div className="flex flex-wrap gap-2">
                {uc.event_sources.map(s => <Badge key={s} color="#287BFF">{s}</Badge>)}
              </div>
            </Section>

            {/* Steps to Reproduce */}
            <Section icon={<ListChecks className="w-4 h-4" />} title="Steps to Reproduce">
              <ol className="space-y-2">
                {uc.steps_to_reproduce.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-cyan-glow/10 text-cyan-glow text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-slate-300">{step}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section icon={<Lightbulb className="w-4 h-4" />} title="Expected Result">
                <div className="p-3 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
                  <p className="text-sm text-slate-300">{uc.expected_result}</p>
                </div>
              </Section>
              <Section icon={<CheckCircle className="w-4 h-4" />} title="Actual Simulated Result">
                <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                  <p className="text-sm text-slate-300">{uc.actual_result}</p>
                </div>
              </Section>
            </div>

            {/* Related Alerts */}
            <Section icon={<AlertTriangle className="w-4 h-4" />} title={`Related Alerts (${alerts.length})`}>
              {alerts.length === 0 ? <p className="text-xs text-slate-600">No alerts generated.</p> : (
                <div className="space-y-1">
                  {alerts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-deep-navy/30 rounded-lg">
                      <AlertTriangle className="w-3 h-3" style={{ color: severityColor(a.severity) }} />
                      <span className="text-xs text-white flex-1 truncate">{a.title}</span>
                      <Badge color={severityColor(a.severity)}>{severityLabel(a.severity)}</Badge>
                      <span className="text-xs text-slate-500">{timeAgo(a.detection_timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Evidence Logs Timeline */}
            <Section icon={<Clock className="w-4 h-4" />} title={`Evidence Logs — Correlation Timeline (${logs.length})`}>
              <div className="relative pl-6 space-y-2">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-neon-blue/20" />
                {logs.slice(0, 15).map((l, i) => (
                  <div key={l.id} className="relative">
                    <div className="absolute -left-3.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: severityColor(l.severity), borderColor: `${severityColor(l.severity)}40` }} />
                    <div className="p-2.5 bg-deep-navy/30 rounded-lg border border-neon-blue/5">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="font-mono text-cyan-glow">Event {l.event_id}</span>
                        <span style={{ color: osColor(l.operating_system) }}>{l.hostname}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-500 font-mono">{l.source_ip}</span>
                        <span className="ml-auto text-slate-500">{formatTimestamp(l.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-300">{l.message}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge color={severityColor(l.severity)}>{severityLabel(l.severity)}</Badge>
                        <Badge color={categoryColor(l.event_category)}>{categoryLabel(l.event_category)}</Badge>
                        <Badge color={l.event_outcome === 'success' ? '#00E5A8' : '#FF3B5C'}>{l.event_outcome}</Badge>
                        <span className="ml-auto text-[10px] text-yellow-400/60">SIMULATED</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2 text-cyan-glow">{icon} {title}</h4>
      {children}
    </div>
  );
}
function ShieldIcon() { return <Shield className="w-3 h-3 text-cyan-glow" />; }
