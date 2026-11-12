import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, User, Lock, Mail, UserPlus, Zap, ArrowRight } from 'lucide-react';
import { useData } from '@/store/DataContext';

export function AuthPage() {
  const { login, loginAsDemo, register } = useData();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      if (!form.username && !form.email) { setError('Enter username or email'); return; }
      if (!form.password) { setError('Enter password'); return; }
      login();
    } else {
      if (!form.full_name || !form.username || !form.email || !form.password) { setError('All fields are required'); return; }
      if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      register({ full_name: form.full_name, username: form.username, email: form.email });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-glow to-neon-blue flex items-center justify-center glow-cyan mb-4"
          >
            <Shield className="w-8 h-8 text-midnight" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient">SentinelOps</h1>
          <p className="text-sm text-slate-400 mt-1">SOC & SIEM Monitoring Platform</p>
        </div>

        <div className="glass-strong rounded-2xl border border-neon-blue/15 p-6 shadow-2xl">
          <div className="flex gap-1 p-1 bg-deep-navy/50 rounded-lg mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'login' ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'register' ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-slate-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field icon={<User className="w-4 h-4" />} label="Full Name">
                <input
                  type="text" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Smith"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </Field>
            )}
            <Field icon={<User className="w-4 h-4" />} label={mode === 'login' ? 'Username or Email' : 'Username'}>
              <input
                type="text" value={mode === 'login' ? form.email || form.username : form.username}
                onChange={e => setForm({ ...form, username: e.target.value, email: mode === 'login' ? e.target.value : form.email })}
                placeholder={mode === 'login' ? 'soc.analyst' : 'soc.analyst'}
                className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
              />
            </Field>
            {mode === 'register' && (
              <Field icon={<Mail className="w-4 h-4" />} label="Email">
                <input
                  type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="analyst@sentinelops.io"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </Field>
            )}
            <Field icon={<Lock className="w-4 h-4" />} label="Password">
              <div className="flex items-center">
                <input
                  type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            {mode === 'register' && (
              <Field icon={<Lock className="w-4 h-4" />} label="Confirm Password">
                <input
                  type={showPass ? 'text' : 'password'} value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </Field>
            )}

            {error && <div className="text-xs text-critical bg-critical/10 border border-critical/20 rounded-lg px-3 py-2">{error}</div>}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-glow to-neon-blue text-midnight font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {mode === 'login' ? <><Zap className="w-4 h-4" /> Sign In</> : <><UserPlus className="w-4 h-4" /> Create Account</>}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-neon-blue/10">
            <button
              onClick={loginAsDemo}
              className="w-full py-2.5 rounded-lg border border-cyan-glow/20 text-cyan-glow font-medium text-sm hover:bg-cyan-glow/5 transition-colors flex items-center justify-center gap-2"
            >
              Explore as Demo <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              Demo mode provides full access with simulated cybersecurity data — no credentials required.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-deep-navy/60 border border-neon-blue/15 rounded-lg focus-within:border-cyan-glow/40 transition-colors">
        <span className="text-slate-500">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-midnight via-deep-navy to-midnight" />
      <div className="absolute inset-0 grid-bg opacity-30" />
      {/* Animated network nodes */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 12}%`} y1={`${20 + (i % 3) * 25}%`}
            x2={`${60 + i * 5}%`} y2={`${50 + (i % 4) * 15}%`}
            stroke="url(#line-grad)" strokeWidth="1"
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <motion.circle
            key={i}
            cx={`${5 + i * 8}%`} cy={`${15 + (i % 5) * 18}%`} r="3"
            fill="#00E5FF"
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
      </svg>
      {/* Glows */}
      <motion.div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    </div>
  );
}
