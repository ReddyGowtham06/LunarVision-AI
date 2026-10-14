/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#06080c', // deepest background
          900: '#0b0e14', // main canvas
          850: '#10141d', // panels
          800: '#161c27', // panel hover / elevated
          750: '#1c2433', // borders / divider
          700: '#263145',
        },
        lunar: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        observatory: {
          blue: '#0284c7',
          cyan: '#38bdf8',
          teal: '#2dd4bf',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(38, 49, 69, 0.7)',
        'panel-hover': '0 8px 24px -2px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 189, 248, 0.3)',
        'slider-handle': '0 0 12px 2px rgba(56, 189, 248, 0.4), 0 2px 6px rgba(0,0,0,0.8)',
      }
    },
  },
  plugins: [],
}
