import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MonitorSmartphone, Search, X, Cpu, Globe, Activity, Clock,
  Server, Shield, Wifi, WifiOff, AlertTriangle, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useData } from '@/store/DataContext';
import { GlassCard, PageTransition, SectionHeader, Badge, EmptyState } from '@/components/ui';
import {
  severityColor, severityLabel, osLabel, osColor, endpointStatusColor,
  formatTimestamp, timeAgo, categoryColor, categoryLabel,
} from '@/utils/format';
import type { Endpoint } from '@/types';

export function EndpointsPage() {
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [osFilter, setOsFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Endpoint | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const ep = data.endpoints.find(e => e.id === id);
      if (ep) setSelected(ep);
    }
  }, [searchParams, data.endpoints]);

  const filtered = useMemo(() => {
    return data.endpoints.filter(e => {
      if (search) {
        const q = search.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.ip_address.includes(q) && !e.os_version.toLowerCase().includes(q)) return false;
      }
      if (osFilter !== 'all' && e.operating_system !== osFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      return true;
    });
  }, [data.endpoints, search, osFilter, statusFilter]);

  const endpointLogs = useMemo(() => {
    if (!selected) return [];
    return data.logs.filter(l => l.hostname === selected.name).slice(0, 20);
  }, [selected, data.logs]);

  const endpointAlerts = useMemo(() => {
    if (!selected) return [];
    return data.alerts.filter(a => a.endpoint === selected.name);
  }, [selected, data.alerts]);

  const endpointTimeline = useMemo(() => {
    if (!selected) return [];
    const logs = data.logs.filter(l => l.hostname === selected.name);
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      hours[d.toISOString().slice(0, 13)] = 0;
    }
    for (const log of logs) {
      const key = log.timestamp.slice(0, 13);
      if (key in hours) hours[key]++;
    }
    return Object.entries(hours).map(([k, v]) => ({
      time: new Date(k + ':00:00Z').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      events: v,
    }));
  }, [selected, data.logs]);

  return (
    <PageTransition>
      <SectionHeader
        title="Endpoints"
        subtitle="Monitor and manage all connected endpoints"
        icon={<MonitorSmartphone className="w-5 h-5" />}
      />

      {/* Filters */}
      <GlassCard className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, IP, or OS version..."
              className="w-full pl-10 pr-4 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/50"
            />
          </div>
          <select value={osFilter} onChange={e => setOsFilter(e.target.value)}
            className="px-3 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/50">
            <option value="all" className="bg-deep-navy">All OS</option>
            <option value="windows" className="bg-deep-navy">Windows</option>
            <option value="linux" className="bg-deep-navy">Linux</option>
            <option value="kali" className="bg-deep-navy">Kali</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/50">
            <option value="all" className="bg-deep-navy">All Status</option>
            <option value="online" className="bg-deep-navy">Online</option>
            <option value="offline" className="bg-deep-navy">Offline</option>
            <option value="inactive" className="bg-deep-navy">Inactive</option>
          </select>
          <span className="text-xs text-slate-500">{filtered.length} endpoints</span>
        </div>
      </GlassCard>

      {/* Endpoint cards grid */}
      {filtered.length === 0 ? (
        <GlassCard><EmptyState icon={<Server className="w-8 h-8" />} title="No endpoints found" message="Try adjusting your search or filters." /></GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ep, i) => (
            <motion.div
              key={ep.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => { setSelected(ep); setSearchParams({ id: ep.id }); }}
              className="cursor-pointer"
            >
              <GlassCard className="p-4 h-full hover:border-cyan-glow/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${osColor(ep.operating_system)}15` }}>
                      <Server className="w-5 h-5" style={{ color: osColor(ep.operating_system) }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{ep.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{ep.ip_address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ep.status === 'online' ? <Wifi className="w-4 h-4 text-success" /> : <WifiOff className="w-4 h-4" style={{ color: endpointStatusColor(ep.status) }} />}
                    <span className="text-xs capitalize" style={{ color: endpointStatusColor(ep.status) }}>{ep.status}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">OS</span><span className="text-slate-300">{osLabel(ep.operating_system)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-300">{ep.endpoint_type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Agent</span><span className="text-slate-300">{ep.agent_type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Logs</span><span className="text-white font-medium">{ep.total_logs}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Last Log</span><span className="text-slate-300">{timeAgo(ep.last_log_received)}</span></div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neon-blue/10">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-500"><span>CPU</span><span>{ep.cpu_usage}%</span></div>
                      <div className="w-20 h-1.5 bg-deep-navy rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${ep.cpu_usage}%`, backgroundColor: ep.cpu_usage > 70 ? '#FF8A24' : '#00E5A8' }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-500"><span>MEM</span><span>{ep.memory_usage}%</span></div>
                      <div className="w-20 h-1.5 bg-deep-navy rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${ep.memory_usage}%`, backgroundColor: ep.memory_usage > 70 ? '#FF8A24' : '#287BFF' }} />
                      </div>
                    </div>
                  </div>
                  <Badge color={severityColor(ep.risk_level === 'none' ? 'low' : ep.risk_level)}>{ep.risk_level === 'none' ? 'No Risk' : severityLabel(ep.risk_level)}</Badge>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Endpoint detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => { setSelected(null); setSearchParams({}); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-strong rounded-xl border border-neon-blue/20 max-w-4xl w-full max-h-[85vh] overflow-y-auto scrollbar-thin"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-neon-blue/10 sticky top-0 bg-deep-navy/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${osColor(selected.operating_system)}15` }}>
                    <Server className="w-5 h-5" style={{ color: osColor(selected.operating_system) }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selected.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{selected.ip_address} · {selected.location}</p>
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setSearchParams({}); }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InfoCard label="OS" value={osLabel(selected.operating_system)} color={osColor(selected.operating_system)} icon={<Server className="w-4 h-4" />} />
                  <InfoCard label="Status" value={selected.status} color={endpointStatusColor(selected.status)} icon={selected.status === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} />
                  <InfoCard label="Risk Level" value={selected.risk_level === 'none' ? 'None' : severityLabel(selected.risk_level)} color={severityColor(selected.risk_level === 'none' ? 'low' : selected.risk_level)} icon={<Shield className="w-4 h-4" />} />
                  <InfoCard label="Total Logs" value={String(selected.total_logs)} color="#00E5FF" icon={<Activity className="w-4 h-4" />} />
                </div>

                {/* Agent info */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Cpu className="w-4 h-4 text-cyan-glow" /> Agent Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <KV k="Agent Type" v={selected.agent_type} />
                    <KV k="Agent Version" v={selected.agent_version} />
                    <KV k="OS Version" v={selected.os_version} />
                    <KV k="Endpoint Type" v={selected.endpoint_type} />
                    <KV k="Location" v={selected.location} />
                    <KV k="Last Log" v={formatTimestamp(selected.last_log_received)} />
                  </div>
                </div>

                {/* Activity timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-glow" /> Activity Timeline (24h)</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={endpointTimeline}>
                      <defs>
                        <linearGradient id="gradEp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,123,255,0.08)" />
                      <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} interval={4} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#080D1A', border: '1px solid rgba(40,123,255,0.2)', borderRadius: '8px', fontSize: 12, color: '#e2e8f0' }} />
                      <Area type="monotone" dataKey="events" name="Events" stroke="#00E5FF" strokeWidth={2} fill="url(#gradEp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Alerts */}
                {endpointAlerts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-critical" /> Endpoint Alerts ({endpointAlerts.length})</h4>
                    <div className="space-y-1">
                      {endpointAlerts.map(a => (
                        <div key={a.id} className="flex items-center gap-3 px-3 py-2 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
                          <AlertTriangle className="w-4 h-4" style={{ color: severityColor(a.severity) }} />
                          <span className="text-sm text-white flex-1 truncate">{a.title}</span>
                          <Badge color={severityColor(a.severity)}>{severityLabel(a.severity)}</Badge>
                          <span className="text-xs text-slate-500">{timeAgo(a.detection_timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent logs */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-glow" /> Recent Logs ({endpointLogs.length})</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                    {endpointLogs.map(l => (
                      <div key={l.id} className="flex items-center gap-3 px-3 py-1.5 bg-deep-navy/30 rounded-lg hover:bg-white/5 transition-colors">
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

function InfoCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 bg-deep-navy/40 rounded-lg border border-neon-blue/5">
      <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color }}>{icon} {label}</div>
      <div className="text-sm text-white font-medium capitalize">{value}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between px-2 py-1.5 bg-deep-navy/30 rounded">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-300 text-right">{v}</span>
    </div>
  );
}
