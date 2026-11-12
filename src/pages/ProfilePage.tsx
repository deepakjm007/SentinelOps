import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Lock, Bell, Palette, Clock, LogOut,
  Edit3, Save, X, Eye, EyeOff, Check, RefreshCw, Key, Monitor,
} from 'lucide-react';
import { useData } from '@/store/DataContext';
import { GlassCard, PageTransition, SectionHeader, Badge } from '@/components/ui';
import { formatTimestamp, timeAgo } from '@/utils/format';

export function ProfilePage() {
  const { data, updateUser, logout, resetDemoData } = useData();
  const { user } = data;
  const [editing, setEditing] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [form, setForm] = useState({ full_name: user.full_name, username: user.username, email: user.email, role: user.role });
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState('');
  const [passMessage, setPassMessage] = useState('');

  // Preferences (local state, persisted to localStorage)
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('sentinelops_prefs_v1');
      return stored ? JSON.parse(stored) : {
        theme: 'dark', emailNotifications: true, pushNotifications: true, criticalAlertsOnly: false,
        autoRefresh: true, compactMode: false, twoFactor: false, sessionTimeout: '30',
      };
    } catch {
      return { theme: 'dark', emailNotifications: true, pushNotifications: true, criticalAlertsOnly: false, autoRefresh: true, compactMode: false, twoFactor: false, sessionTimeout: '30' };
    }
  });

  const savePrefs = (newPrefs: typeof prefs) => {
    setPrefs(newPrefs);
    try { localStorage.setItem('sentinelops_prefs_v1', JSON.stringify(newPrefs)); } catch { /* ignore */ }
  };

  const handleSaveProfile = () => {
    updateUser(form);
    setEditing(false);
    setMessage('Profile updated successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = () => {
    setPassMessage('');
    if (!passForm.current || !passForm.new) { setPassMessage('All fields are required'); return; }
    if (passForm.new.length < 6) { setPassMessage('New password must be at least 6 characters'); return; }
    if (passForm.new !== passForm.confirm) { setPassMessage('Passwords do not match'); return; }
    setShowPassForm(false);
    setPassForm({ current: '', new: '', confirm: '' });
    setPassMessage('Password changed successfully');
    setTimeout(() => setPassMessage(''), 3000);
  };

  const avatarColors: Record<string, string> = {
    cyan: 'from-cyan-glow to-neon-blue',
    purple: 'from-cyber-purple to-magenta',
    green: 'from-success to-cyan-glow',
    orange: 'from-alert-orange to-critical',
  };

  return (
    <PageTransition>
      <SectionHeader
        title="Profile & Settings"
        subtitle="Manage your account, security, and preferences"
        icon={<User className="w-5 h-5" />}
      />

      {message && <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success flex items-center gap-2"><Check className="w-4 h-4" /> {message}</div>}
      {passMessage && !passMessage.includes('error') && <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success flex items-center gap-2"><Check className="w-4 h-4" /> {passMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Profile card */}
        <div className="space-y-4">
          <GlassCard className="p-5 text-center">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColors[user.avatar_color] || avatarColors.cyan} flex items-center justify-center text-3xl font-bold text-midnight mx-auto mb-4 glow-cyan`}>
              {user.full_name.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-white">{user.full_name}</h2>
            <p className="text-sm text-slate-400">@{user.username}</p>
            <div className="mt-2"><Badge color="#00E5FF">{user.role}</Badge></div>
            <div className="mt-4 pt-4 border-t border-neon-blue/10 space-y-2 text-xs text-left">
              <div className="flex items-center gap-2 text-slate-400"><Mail className="w-3.5 h-3.5" /> {user.email}</div>
              <div className="flex items-center gap-2 text-slate-400"><Clock className="w-3.5 h-3.5" /> Joined {formatTimestamp(user.created_at)}</div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="mt-4 w-full py-2 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors flex items-center justify-center gap-1.5">
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </GlassCard>

          {/* Session info */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Monitor className="w-4 h-4 text-cyan-glow" /> Session Information</h3>
            <div className="space-y-2 text-xs">
              <SessionRow label="Status" value="Active" color="#00E5A8" />
              <SessionRow label="Session Start" value={formatTimestamp(new Date(Date.now() - 3600000).toISOString())} />
              <SessionRow label="Last Activity" value="Just now" />
              <SessionRow label="IP Address" value="192.168.10.5" />
              <SessionRow label="Browser" value="Chrome / Linux" />
              <SessionRow label="Auth Method" value="Demo Access" />
            </div>
            <button onClick={logout}
              className="mt-4 w-full py-2 bg-critical/10 border border-critical/30 rounded-lg text-sm text-critical hover:bg-critical/20 transition-colors flex items-center justify-center gap-1.5">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </GlassCard>
        </div>

        {/* Right: Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Edit profile form */}
          {editing && (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Edit3 className="w-4 h-4 text-cyan-glow" /> Edit Profile</h3>
                <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Full Name">
                  <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
                </FormField>
                <FormField label="Username">
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
                </FormField>
                <FormField label="Email">
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
                </FormField>
                <FormField label="Role">
                  <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/40" />
                </FormField>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditing(false)} className="flex-1 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSaveProfile} className="flex-1 py-2 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors flex items-center justify-center gap-1.5">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </GlassCard>
          )}

          {/* Change password */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-glow" /> Change Password</h3>
              {!showPassForm && <button onClick={() => setShowPassForm(true)} className="text-xs text-cyan-glow hover:underline">Change →</button>}
            </div>
            {passMessage && passMessage.includes('error') && <div className="mb-3 p-2 bg-critical/10 border border-critical/20 rounded text-xs text-critical">{passMessage}</div>}
            {showPassForm ? (
              <div className="space-y-3">
                <FormField label="Current Password">
                  <PasswordInput value={passForm.current} onChange={v => setPassForm({ ...passForm, current: v })} show={showPass} toggle={() => setShowPass(!showPass)} />
                </FormField>
                <FormField label="New Password">
                  <PasswordInput value={passForm.new} onChange={v => setPassForm({ ...passForm, new: v })} show={showPass} toggle={() => setShowPass(!showPass)} />
                </FormField>
                <FormField label="Confirm New Password">
                  <PasswordInput value={passForm.confirm} onChange={v => setPassForm({ ...passForm, confirm: v })} show={showPass} toggle={() => setShowPass(!showPass)} />
                </FormField>
                <div className="flex gap-2">
                  <button onClick={() => { setShowPassForm(false); setPassForm({ current: '', new: '', confirm: '' }); }} className="flex-1 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleChangePassword} className="flex-1 py-2 bg-cyan-glow/10 border border-cyan-glow/30 rounded-lg text-sm text-cyan-glow hover:bg-cyan-glow/20 transition-colors">Update Password</button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Your password was last changed 30 days ago. We recommend updating it regularly.</p>
            )}
          </GlassCard>

          {/* Notification preferences */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-cyan-glow" /> Notification Preferences</h3>
            <div className="space-y-3">
              <ToggleRow label="Email Notifications" desc="Receive security alerts via email" value={prefs.emailNotifications}
                onChange={v => savePrefs({ ...prefs, emailNotifications: v })} />
              <ToggleRow label="Push Notifications" desc="Real-time browser notifications" value={prefs.pushNotifications}
                onChange={v => savePrefs({ ...prefs, pushNotifications: v })} />
              <ToggleRow label="Critical Alerts Only" desc="Only notify for critical-severity threats" value={prefs.criticalAlertsOnly}
                onChange={v => savePrefs({ ...prefs, criticalAlertsOnly: v })} />
              <ToggleRow label="Auto-Refresh Dashboard" desc="Automatically refresh dashboard data" value={prefs.autoRefresh}
                onChange={v => savePrefs({ ...prefs, autoRefresh: v })} />
            </div>
          </GlassCard>

          {/* Theme & display */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-cyan-glow" /> Theme & Display</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Theme</label>
                <div className="flex gap-2">
                  {[
                    { id: 'dark', label: 'Dark (Default)', colors: ['#05070D', '#00E5FF'] },
                    { id: 'midnight', label: 'Midnight Blue', colors: ['#080D1A', '#287BFF'] },
                    { id: 'cyber', label: 'Cyber Purple', colors: ['#111827', '#8B5CF6'] },
                  ].map(t => (
                    <button key={t.id} onClick={() => savePrefs({ ...prefs, theme: t.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${prefs.theme === t.id ? 'border-cyan-glow/40 bg-cyan-glow/5' : 'border-neon-blue/15 hover:border-neon-blue/30'}`}>
                      <div className="flex gap-1">
                        {t.colors.map(c => <div key={c} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />)}
                      </div>
                      <span className="text-xs text-slate-300">{t.label}</span>
                      {prefs.theme === t.id && <Check className="w-3 h-3 text-cyan-glow" />}
                    </button>
                  ))}
                </div>
              </div>
              <ToggleRow label="Compact Mode" desc="Reduce spacing for denser information display" value={prefs.compactMode}
                onChange={v => savePrefs({ ...prefs, compactMode: v })} />
            </div>
          </GlassCard>

          {/* Security preferences */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-glow" /> Security Preferences</h3>
            <div className="space-y-3">
              <ToggleRow label="Two-Factor Authentication" desc="Require additional verification on login (simulated)" value={prefs.twoFactor}
                onChange={v => savePrefs({ ...prefs, twoFactor: v })} />
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Session Timeout</label>
                <select value={prefs.sessionTimeout} onChange={e => savePrefs({ ...prefs, sessionTimeout: e.target.value })}
                  className="px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:border-cyan-glow/40">
                  <option value="15" className="bg-deep-navy">15 minutes</option>
                  <option value="30" className="bg-deep-navy">30 minutes</option>
                  <option value="60" className="bg-deep-navy">1 hour</option>
                  <option value="240" className="bg-deep-navy">4 hours</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Demo data management */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-cyan-glow" /> Demo Data Management</h3>
            <p className="text-xs text-slate-400 mb-3">Reset all simulated security data to its initial state. This will regenerate all logs, endpoints, alerts, and detection results.</p>
            <button onClick={resetDemoData}
              className="px-4 py-2 bg-alert-orange/10 border border-alert-orange/30 rounded-lg text-sm text-alert-orange hover:bg-alert-orange/20 transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Reset Demo Data
            </button>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-slate-400 mb-1.5 block">{label}</label>{children}</div>;
}

function PasswordInput({ value, onChange, show, toggle }: { value: string; onChange: (v: string) => void; show: boolean; toggle: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-deep-navy/60 border border-neon-blue/15 rounded-lg focus-within:border-cyan-glow/40 transition-colors">
      <Key className="w-4 h-4 text-slate-500" />
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="••••••••" />
      <button onClick={toggle} className="text-slate-500 hover:text-white">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-white">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-cyan-glow/40' : 'bg-slate-700/50'}`}>
        <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white" animate={{ left: value ? '22px' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}

function SessionRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between px-2 py-1.5 bg-deep-navy/30 rounded">
      <span className="text-slate-500">{label}</span>
      <span style={{ color: color || '#e2e8f0' }}>{value}</span>
    </div>
  );
}
