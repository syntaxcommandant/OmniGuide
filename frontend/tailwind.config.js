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
          bg: '#081426',         // Primary background
          surface: '#0D1B2E',    // Secondary background
          card: '#112238',       // Card background
          elevated: '#162A42',   // Elevated surfaces
          teal: '#20C9B7',       // Primary accent
          tealLight: '#34E0CE',
          tealDark: '#129D8E',
          cyan: '#38BDF8',       // Secondary accent
          textPrimary: '#F4F7FB',
          textSecondary: '#A7B5C8',
          success: '#34D399',
          warning: '#FBBF24',
          critical: '#FB7185',
        },
        navy: {
          950: '#081426',
          900: '#0D1B2E',
          850: '#112238',
          800: '#162A42',
          750: '#1C3452',
          700: '#233E60',
          600: '#345277',
          500: '#48668E',
        },
        teal: {
          400: '#20C9B7',
          500: '#17B2A1',
          600: '#109687',
        },
        cyan: {
          400: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-teal': '0 0 25px -5px rgba(32, 201, 183, 0.25)',
        'subtle': '0 4px 20px -2px rgba(8, 20, 38, 0.5)',
      }
    },
  },
  plugins: [],
}
