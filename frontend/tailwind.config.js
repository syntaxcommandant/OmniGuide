/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          darkest: '#070B14',
          dark: '#0B0F19',
          surface: '#0F172A',
          card: '#131E35',
          border: '#1E293B',
          muted: '#334155',
          teal: '#14B8A6',
          tealLight: '#2DD4BF',
          tealDark: '#0D9488',
          cyan: '#06B6D4',
        },
        navy: {
          950: '#070B14',
          900: '#0B0F19',
          850: '#0E1729',
          800: '#131E35',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
