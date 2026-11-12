/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#05070D',
        'deep-navy': '#080D1A',
        charcoal: '#111827',
        'dark-blue': '#101B32',
        cyan: { glow: '#00E5FF' },
        'neon-blue': '#287BFF',
        'cyber-purple': '#8B5CF6',
        magenta: '#E879F9',
        alert: { orange: '#FF8A24' },
        critical: '#FF3B5C',
        success: '#00E5A8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'float-particle': 'floatParticle 8s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%, 100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        scanLine: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        floatParticle: { '0%, 100%': { transform: 'translate(0, 0)' }, '50%': { transform: 'translate(20px, -30px)' } },
        radarSweep: { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
};
