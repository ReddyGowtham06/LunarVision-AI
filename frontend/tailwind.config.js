/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60% Primary - Lunar Obsidian
        obsidian: {
          950: '#070A0E', // Deepest background
          900: '#0B0F14', // Lunar Obsidian (Primary foundation)
          850: '#10161E', // Canvas & elevated surface
          800: '#161D27', // Card surface
          750: '#1D2531', // Subtle divider
          700: '#252F3E',
        },
        // 30% Secondary - Moonstone Slate
        moonstone: {
          50: '#F4F6F8',
          100: '#E5E9EE',
          200: '#C7D0DA',
          300: '#9BA3AF', // Muted silver text
          400: '#4D5B6C',
          500: '#303944', // Moonstone Slate (Secondary surface)
          600: '#262E37', // Panel borders
          700: '#1C2229', // Inset panels
          800: '#15191F',
          900: '#0E1115',
        },
        // 10% Accent - Eclipse Gold
        eclipse: {
          50: '#FAF7EE',
          100: '#F4EED8',
          200: '#E9DCB2',
          300: '#E2C889', // Hover gold
          400: '#DCBF7A',
          500: '#D6B66F', // Eclipse Gold (Primary Accent)
          600: '#C2A056', // Pressed / active gold
          700: '#9F803C',
          800: '#755D28',
          900: '#483917',
        },
        // Legacy aliases to preserve compatibility
        lunar: {
          50: '#F4F6F8',
          100: '#E5E9EE',
          200: '#C7D0DA',
          300: '#9BA3AF',
          400: '#9BA3AF',
          500: '#64748B',
          600: '#475569',
          700: '#303944',
          800: '#1E242B',
          900: '#0B0F14',
        },
        observatory: {
          blue: '#303944',
          cyan: '#D6B66F',
          teal: '#2DD4BF',
          amber: '#D6B66F',
          emerald: '#10B981',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(48, 57, 68, 0.6)',
        'panel-hover': '0 8px 24px -2px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(214, 182, 111, 0.35)',
        'slider-handle': '0 0 10px 1px rgba(214, 182, 111, 0.5), 0 2px 6px rgba(0,0,0,0.8)',
        'eclipse': '0 0 20px -2px rgba(214, 182, 111, 0.35)',
      }
    },
  },
  plugins: [],
}