import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Monitor, Server, AlertTriangle, CheckCircle, XCircle,
  LogIn, LogOut, Activity, RefreshCw, Clock, TrendingUp, Shield,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useData } from '@/store/DataContext';
import { GlassCard, StatCard, PageTransition, SectionHeader } from '@/components/ui';
import {
  severityColor, severityLabel, osLabel, osColor, formatTimestamp, timeAgo, categoryLabel, categoryColor,
} from '@/utils/format';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { data, resetDemoData } = useData();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(7);

  const stats = useMemo(() => {
    const totalLogs = data.logs.length;
    const winLogs = data.logs.filter(l => l.operating_system === 'windows').length;
    const linLogs = data.logs.filter(l => l.operating_system === 'linux' || l.operating_system === 'kali').length;
    const totalEndpoints = data.endpoints.length;
    const onlineEndpoints = data.endpoints.filter(e => e.status === 'online').length;
    const failedLogins = data.logs.filter(l => l.event_outcome === 'failure').length;
    const successLogins = data.logs.filter(l => l.event_outcome === 'success').length;
    const activeAlerts = data.alerts.filter(a => a.status === 'new' || a.status === 'active').length;
    const criticalAlerts = data.alerts.filter(a => a.severity === 'critical').length;
    const resolvedAlerts = data.alerts.filter(a => a.status === 'resolved').length;
    return { totalLogs, winLogs, linLogs, totalEndpoints, onlineEndpoints, failedLogins, successLogins, activeAlerts, criticalAlerts, resolvedAlerts };
  }, [data]);

  const eventsOverTime = useMemo(() => {
    const days: Record<string, { date: string; windows: number; linux: number; total: number }> = {};
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      days[key] = { date: label, windows: 0, linux: 0, total: 0 };
    }
    for (const log of data.logs) {
      const key = log.timestamp.slice(0, 10);
      if (days[key]) {
        if (log.operating_system === 'windows') days[key].windows++;
        else days[key].linux++;
        days[key].total++;
      }
    }
    return Object.values(days);
  }, [data.logs, timeRange]);

  const loginData = useMemo(() => [
    { name: 'Successful', value: stats.successLogins, color: '#00E5A8' },
    { name: 'Failed', value: stats.failedLogins, color: '#FF3B5C' },
  ], [stats]);

  const severityData = useMemo(() => (['critical', 'high', 'medium', 'low'] as const).map(s => ({
    name: severityLabel(s), value: data.logs.filter(l => l.severity === s).length, color: severityColor(s),
  })), [data.logs]);

  const topSourceIPs = useMemo(() => {
    const ipCounts: Record<string, number> = {};
    for (const log of data.logs) {
      ipCounts[log.source_ip] = (ipCounts[log.source_ip] || 0) + 1;
    }
    return Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([ip, count]) => ({ ip, count }));
  }, [data.logs]);

  const endpointDist = useMemo(() => [
    { name: 'Windows', value: data.endpoints.filter(e => e.operating_system === 'windows').length, color: '#287BFF' },
    { name: 'Linux', value: data.endpoints.filter(e => e.operating_system === 'linux').length, color: '#00E5A8' },
    { name: 'Kali', value: data.endpoints.filter(e => e.operating_system === 'kali').length, color: '#8B5CF6' },
  ], [data.endpoints]);

  const threatTimeline = useMemo(() => {
    const hours: Record<string, number> = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const key = d.toISOString().slice(0, 13);
      hours[key] = 0;
    }
    for (const log of data.logs) {
      if (log.severity === 'critical' || log.severity === 'high') {
        const key = log.timestamp.slice(0, 13);
        if (key in hours) hours[key]++;
      }
    }
    return Object.entries(hours).map(([k, v]) => ({
      time: new Date(k + ':00:00Z').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      threats: v,
    }));
  }, [data.logs]);

  const recentEvents = data.logs.slice(0, 8);
  const recentAlerts = [...data.alerts].sort((a, b) => new Date(b.detection_timestamp).getTime() - new Date(a.detection_timestamp).getTime()).slice(0, 5);
  const endpointHealth = {
    online: data.endpoints.filter(e => e.status === 'online').length,
    offline: data.endpoints.filter(e => e.status === 'offline').length,
    inactive: data.endpoints.filter(e => e.status === 'inactive').length,
  };

  return (
    <PageTransition>
      <SectionHeader
        title="SOC Command Center"
        subtitle="Real-time security monitoring dashboard"
        icon={<Shield className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={e => setTimeRange(Number(e.target.value))}
              className="px-3 py-1.5 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/50 cursor-pointer"
            >
              <option value={1} className="bg-deep-navy">Last 24h</option>
              <option value={7} className="bg-deep-navy">Last 7 days</option>
              <option value={30} className="bg-deep-navy">Last 30 days</option>
            </select>
            <button
              onClick={resetDemoData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-slate-300 hover:text-cyan-glow hover:border-cyan-glow/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Total Logs" value={stats.totalLogs} color="#00E5FF" delay={0} />
        <StatCard icon={<Monitor className="w-5 h-5" />} label="Windows Logs" value={stats.winLogs} color="#287BFF" delay={0.05} />
        <StatCard icon={<Server className="w-5 h-5" />} label="Linux Logs" value={stats.linLogs} color="#00E5A8" delay={0.1} />
        <StatCard icon={<Server className="w-5 h-5" />} label="Total Endpoints" value={stats.totalEndpoints} color="#8B5CF6" delay={0.15} />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Online Endpoints" value={stats.onlineEndpoints} color="#00E5A8" delay={0.2} />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Failed Logins" value={stats.failedLogins} color="#FF3B5C" delay={0.25} />
        <StatCard icon={<LogIn className="w-5 h-5" />} label="Successful Logins" value={stats.successLogins} color="#00E5A8" delay={0.3} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Active Alerts" value={stats.activeAlerts} color="#FF8A24" delay={0.35} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Critical Alerts" value={stats.criticalAlerts} color="#FF3B5C" delay={0.4} />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Resolved Alerts" value={stats.resolvedAlerts} color="#00E5A8" delay={0.45} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <GlassCard className="lg:col-span-2 p-5">
          <ChartHeader title="Security Events Overview" subtitle={`Log activity over last ${timeRange} day${timeRange > 1 ? 's' : ''}`} icon={<TrendingUp className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={eventsOverTime}>
              <defs>
                <linearGradient id="gradWin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#287BFF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#287BFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5A8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00E5A8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,123,255,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="windows" name="Windows" stroke="#287BFF" strokeWidth={2} fill="url(#gradWin)" />
              <Area type="monotone" dataKey="linux" name="Linux" stroke="#00E5A8" strokeWidth={2} fill="url(#gradLin)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <ChartHeader title="Login Attempts" subtitle="Success vs Failure" icon={<LogIn className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={loginData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4}>
                {loginData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <GlassCard className="p-5">
          <ChartHeader title="Threat Severity Distribution" subtitle="Log severity breakdown" icon={<AlertTriangle className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,123,255,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} width={70} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(40,123,255,0.05)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {severityData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <ChartHeader title="Top Source IPs" subtitle="Most active source addresses" icon={<Activity className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSourceIPs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,123,255,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} />
              <YAxis type="category" dataKey="ip" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} width={100} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(40,123,255,0.05)' }} />
              <Bar dataKey="count" fill="#287BFF" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <ChartHeader title="Endpoint Distribution" subtitle="By operating system" icon={<Server className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={endpointDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                {endpointDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <GlassCard className="lg:col-span-2 p-5">
          <ChartHeader title="Threat Activity Timeline" subtitle="Critical & high-severity events (last 24h)" icon={<AlertTriangle className="w-4 h-4" />} />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={threatTimeline}>
              <defs>
                <linearGradient id="gradThreat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF3B5C" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FF3B5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,123,255,0.08)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} interval={3} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(40,123,255,0.1)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="threats" name="Threats" stroke="#FF3B5C" strokeWidth={2} fill="url(#gradThreat)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <ChartHeader title="Endpoint Health" subtitle="Connection status" icon={<Server className="w-4 h-4" />} />
          <div className="space-y-3 mt-4">
            <HealthBar label="Online" count={endpointHealth.online} total={data.endpoints.length} color="#00E5A8" />
            <HealthBar label="Inactive" count={endpointHealth.inactive} total={data.endpoints.length} color="#FF8A24" />
            <HealthBar label="Offline" count={endpointHealth.offline} total={data.endpoints.length} color="#FF3B5C" />
          </div>
          <div className="mt-6 pt-4 border-t border-neon-blue/10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Last updated: {timeAgo(data.lastUpdated)}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent events & alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <ChartHeader title="Recent Security Events" subtitle="Latest log entries" icon={<FileText className="w-4 h-4" />}
            action={<button onClick={() => navigate('/monitoring/logs')} className="text-xs text-cyan-glow hover:underline">View all →</button>} />
          <div className="space-y-1 mt-3">
            {recentEvents.map(l => (
              <div key={l.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/monitoring/logs?id=${l.id}`)}>
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: severityColor(l.severity) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{l.message.substring(0, 50)}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span style={{ color: osColor(l.operating_system) }}>{l.hostname}</span>
                    <span>·</span>
                    <span>{l.source_ip}</span>
                    <span>·</span>
                    <span>{timeAgo(l.timestamp)}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded" style={{ color: severityColor(l.severity), backgroundColor: `${severityColor(l.severity)}15` }}>
                  {severityLabel(l.severity)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <ChartHeader title="Recent Alerts" subtitle="Latest security alerts" icon={<AlertTriangle className="w-4 h-4" />}
            action={<button onClick={() => navigate('/monitoring/alerts')} className="text-xs text-cyan-glow hover:underline">View all →</button>} />
          <div className="space-y-1 mt-3">
            {recentAlerts.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate(`/monitoring/alerts?id=${a.id}`)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${severityColor(a.severity)}15`, color: severityColor(a.severity) }}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{a.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{a.endpoint}</span>
                    <span>·</span>
                    <span>{a.source_ip}</span>
                    <span>·</span>
                    <span>{timeAgo(a.detection_timestamp)}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ color: severityColor(a.severity), backgroundColor: `${severityColor(a.severity)}15` }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

const tooltipStyle = {
  backgroundColor: '#080D1A',
  border: '1px solid rgba(40,123,255,0.2)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#e2e8f0',
};

function ChartHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-cyan-glow">{icon}</span>}
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function HealthBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">{count}</span>
      </div>
      <div className="h-2 bg-deep-navy/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
