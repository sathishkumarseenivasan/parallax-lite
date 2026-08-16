import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
        },
        emerald: {
          50:  '#ECFDF5',
          200: '#A7F3D0',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
        },
        rose: {
          50:  '#FFF1F2',
          200: '#FECDD3',
          600: '#E11D48',
          700: '#BE123C',
        },
        amber: {
          50:  '#FFFBEB',
          200: '#FDE68A',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
        },
        gray: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'var(--font-geist-mono)', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '10': ['10px', { lineHeight: '14px' }],
        '11': ['11px', { lineHeight: '16px' }],
        '12': ['12px', { lineHeight: '18px' }],
        '13': ['13px', { lineHeight: '20px' }],
      },
      spacing: {
        sidebar: '220px',
        topbar:  '48px',
      },
      borderRadius: {
        DEFAULT: '5px',
        sm: '3px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        'dropdown': '0 4px 12px -2px rgba(0,0,0,0.1), 0 1px 4px -1px rgba(0,0,0,0.06)',
        'sheet':    '-4px 0 24px -4px rgba(0,0,0,0.1)',
        'tooltip':  '0 2px 8px -1px rgba(0,0,0,0.18)',
      },
      animation: {
        'fade-in':    'fadeIn 0.15s ease-out forwards',
        'slide-in':   'slideIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
