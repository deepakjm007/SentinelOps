import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, ScrollText, MonitorSmartphone, Bell, Shield,
  Search, BookOpen, FileBarChart, User, ChevronDown, ChevronRight,
  Menu, X, Activity, Cpu, LogOut, Settings, Radio,
} from 'lucide-react';
import { useData } from '@/store/DataContext';
import { timeAgo } from '@/utils/format';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation();
  const { data, logout } = useData();
  const [securityOpen, setSecurityOpen] = useState(location.pathname.includes('/monitoring/'));
  const [detectionOpen, setDetectionOpen] = useState(location.pathname.includes('/detection/'));

  const navItem = (to: string, icon: React.ReactNode, label: string, badge?: number) => (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
          isActive
            ? 'bg-cyan-glow/10 text-cyan-glow border-l-2 border-cyan-glow'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
        }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium flex-1">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-critical/20 text-critical">{badge}</span>
      )}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-deep-navy border border-neon-blue/20 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {label}
        </span>
      )}
    </NavLink>
  );

  const subItem = (to: string, label: string, badge?: number) => (
    <NavLink
      to={to}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
          isActive ? 'text-cyan-glow bg-cyan-glow/5' : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-50" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 text-xs rounded bg-critical/15 text-critical">{badge}</span>
      )}
    </NavLink>
  );

  const activeAlerts = data.alerts.filter(a => a.status === 'new' || a.status === 'active').length;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col glass-strong border-r border-neon-blue/15">
          {/* Logo */}
          <div className={`flex items-center gap-3 p-4 border-b border-neon-blue/10 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-glow to-neon-blue flex items-center justify-center flex-shrink-0 glow-cyan">
              <Shield className="w-5 h-5 text-midnight" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div>
                <div className="text-white font-bold text-sm tracking-wide">SentinelOps</div>
                <div className="text-[10px] text-cyan-glow/60 font-mono">SOC · SIEM Platform</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-1">
            {navItem('/dashboard', <LayoutDashboard className="w-5 h-5" />, 'Dashboard')}

            {/* Security Monitoring */}
            <div>
              <button
                onClick={() => { setSecurityOpen(!securityOpen); if (collapsed) setCollapsed(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-white/5 ${
                  location.pathname.includes('/monitoring') ? 'text-cyan-glow' : ''
                }`}
              >
                <Activity className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium flex-1 text-left">Security Monitoring</span>}
                {!collapsed && (securityOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </button>
              <AnimatePresence>
                {securityOpen && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 space-y-0.5"
                  >
                    {subItem('/monitoring/logs', 'Log Explorer', data.logs.length)}
                    {subItem('/monitoring/endpoints', 'Endpoints', data.endpoints.length)}
                    {subItem('/monitoring/alerts', 'Alerts', activeAlerts)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Detection */}
            <div>
              <button
                onClick={() => { setDetectionOpen(!detectionOpen); if (collapsed) setCollapsed(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-white/5 ${
                  location.pathname.includes('/detection') ? 'text-cyan-glow' : ''
                }`}
              >
                <Cpu className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium flex-1 text-left">Detection</span>}
                {!collapsed && (detectionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </button>
              <AnimatePresence>
                {detectionOpen && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 space-y-0.5"
                  >
                    {subItem('/detection/rules', 'Detection Rules', data.rules.length)}
                    {subItem('/detection/use-cases', 'Use Cases', data.useCases.length)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navItem('/reports', <FileBarChart className="w-5 h-5" />, 'Reports')}
            {navItem('/profile', <User className="w-5 h-5" />, 'Profile')}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-neon-blue/10">
            {!collapsed ? (
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.location.hash = '#/profile'}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-glow to-cyber-purple flex items-center justify-center text-midnight font-bold text-sm flex-shrink-0">
                  {data.user.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{data.user.full_name}</div>
                  <div className="text-xs text-slate-500 truncate">{data.user.role}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-500 hover:text-critical transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-glow to-cyber-purple flex items-center justify-center text-midnight font-bold text-sm">
                  {data.user.full_name.charAt(0)}
                </div>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center py-2 border-t border-neon-blue/10 text-slate-500 hover:text-cyan-glow transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
          </button>
        </div>
      </aside>
    </>
  );
}

interface TopbarProps {
  setMobileOpen: (v: boolean) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}

export function Topbar({ setMobileOpen, onOpenSearch, onOpenNotifications }: TopbarProps) {
  const { data } = useData();
  const unreadCount = data.notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-neon-blue/10">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Radio className="w-4 h-4 text-success animate-pulse" />
            <span className="text-success font-medium">Live Simulation</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs">Last updated: {timeAgo(data.lastUpdated)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-slate-400 hover:text-white hover:border-cyan-glow/30 transition-all min-w-[180px]"
          >
            <Search className="w-4 h-4" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-white/5 rounded text-slate-500">⌘K</kbd>
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 flex items-center justify-center bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-critical text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}


