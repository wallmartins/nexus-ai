import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-canvas': 'var(--color-bg-canvas)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'surface-1': 'var(--color-surface-1)',
        'surface-2': 'var(--color-surface-2)',
        'surface-3': 'var(--color-surface-3)',
        'brand-lime': 'var(--color-brand-lime)',
        'brand-lime-hover': 'var(--color-brand-lime-hover)',
        'brand-purple': 'var(--color-brand-purple)',
        'brand-purple-light': 'var(--color-brand-purple-light)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-default': 'var(--color-border-default)',
        'border-strong': 'var(--color-border-strong)',
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-danger': 'var(--color-status-danger)',
        'status-info': 'var(--color-status-info)',
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        float: '0 24px 48px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        'glow-lime': '0 0 40px rgba(197,245,71,0.35)',
        'glow-purple': '0 0 60px rgba(139,92,246,0.45)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2,0,0,1)',
        emphasized: 'cubic-bezier(0.05,0.7,0.1,1)',
        decelerate: 'cubic-bezier(0,0,0,1)',
      },
      transitionDuration: {
        instant: '80ms',
        fast: '150ms',
        base: '220ms',
        slow: '380ms',
        deliberate: '640ms',
      },
    },
  },
  plugins: [],
};

export default config;
