/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
        },
      },
      keyframes: {
        'bell-shake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%':       { transform: 'rotate(12deg)' },
          '20%':       { transform: 'rotate(-10deg)' },
          '30%':       { transform: 'rotate(10deg)' },
          '40%':       { transform: 'rotate(-8deg)' },
          '50%':       { transform: 'rotate(6deg)' },
          '60%':       { transform: 'rotate(-4deg)' },
          '70%':       { transform: 'rotate(2deg)' },
          '80%':       { transform: 'rotate(-2deg)' },
          '90%':       { transform: 'rotate(1deg)' },
        },
      },
      animation: {
        'bell-shake': 'bell-shake 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
