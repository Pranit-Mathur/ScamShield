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
        scam: {
          dark: '#07070A',
          card: '#101015',
          'card-hover': '#16161D',
          border: '#23232C',
          red: '#DC2626',
          'red-dark': '#991B1B',
          'red-light': '#EF4444',
          'red-glow': 'rgba(220, 38, 38, 0.18)',
          gray: '#9CA3AF',
          light: '#F9FAFB'
        },
        shield: {
          dark: '#07070A',
          card: '#101015',
          border: '#23232C',
          accent: '#DC2626',
          danger: '#DC2626',
          warning: '#F59E0B',
          success: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
