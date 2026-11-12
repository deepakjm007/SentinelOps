import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';

export function GlassCard({ children, className = '', glow }: { children: ReactNode; className?: string; glow?: 'cyan' | 'red' | 'orange' | 'purple' | 'green' }) {
  const glowClass = glow ? `glow-${glow}` : '';
  return (
    <div className={`glass rounded-xl ${glowClass} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color, className = '' }: { children: ReactNode; color: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}
      style={{ color, backgroundColor: `${color}15`, borderColor: `${color}40` }}
    >
      {children}
    </span>
  );
}

export function AnimatedCounter({ value, duration = 1.2, className = '' }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = { current: 0 };
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      controls.current = Math.floor(value * eased);
      setDisplay(controls.current);
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(value);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function CyberBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-midnight via-deep-navy to-midnight" />
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      {/* Animated radial glows */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)' }}
        animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
        animate={{ x: [0, -60, 0], y: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,59,92,0.04) 0%, transparent 70%)' }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)' }}
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function StatCard({ icon, label, value, color, delay = 0, suffix = '' }: {
  icon: ReactNode; label: string; value: number; color: string; delay?: number; suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <GlassCard className="p-4 h-full" >
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        </div>
        <div className="text-2xl font-bold text-white">
          <AnimatedCounter value={value} />
          {suffix && <span className="text-base text-slate-400 ml-1">{suffix}</span>}
        </div>
        <div className="text-xs text-slate-400 mt-1">{label}</div>
      </GlassCard>
    </motion.div>
  );
}

export function SectionHeader({ title, subtitle, icon, action }: {
  title: string; subtitle?: string; icon?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20 flex items-center justify-center text-cyan-glow">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, onClear }: {
  value: string; onChange: (v: string) => void; placeholder: string; onClear?: () => void;
}) {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-glow/50 transition-colors"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      {value && onClear && (
        <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function Select({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; label?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-slate-400">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 bg-deep-navy/60 border border-neon-blue/20 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-glow/50 transition-colors cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-deep-navy text-white">{o.label}</option>)}
      </select>
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-deep-navy/60 border border-neon-blue/10 flex items-center justify-center text-slate-500 mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md">{message}</p>
    </div>
  );
}

export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-cyan-glow/20 border-t-cyan-glow"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
