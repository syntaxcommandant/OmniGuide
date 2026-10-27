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
          bg: '#F8FAFC',          // Soft off-white / light cool gray
          surface: '#FFFFFF',     // Pure white cards
          surfaceMuted: '#F1F5F9',// Subtle gray card / secondary surface
          border: '#E2E8F0',      // Subtle cool gray border
          borderDark: '#CBD5E1',  // Emphasized border
          navy: '#0F172A',        // Deep navy brand
          navyLight: '#1E293B',   // Navy surface
          teal: '#0D9488',        // Sophisticated teal
          tealHover: '#0F766E',   // Darker teal hover
          tealLight: '#14B8A6',   // Bright teal accent
          tealSubtle: '#F0FDFA',  // Soft teal tint
          text: '#0F172A',        // Dark slate main text
          textMuted: '#475569',   // Slate secondary text
          textDim: '#64748B',     // Slate muted text
          critical: '#DC2626',    // Restrained red
          criticalBg: '#FEF2F2',
          criticalBorder: '#FECACA',
          warning: '#D97706',     // Amber
          warningBg: '#FFFBEB',
          warningBorder: '#FDE68A',
          success: '#059669',     // Green
          successBg: '#ECFDF5',
          successBorder: '#A7F3D0',
        },
        navy: {
          950: '#0A0F1D',
          900: '#0F172A',
          850: '#152138',
          800: '#1E293B',
          750: '#2A3950',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        'elevated': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
