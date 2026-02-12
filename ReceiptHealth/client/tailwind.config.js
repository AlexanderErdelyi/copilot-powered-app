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
        primary: {
          50: '#f5f7ff',
          100: '#ebefff',
          200: '#d6deff',
          300: '#b8c5ff',
          400: '#97a3ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#36419d',
          900: '#2a3482',
        },
        secondary: {
          500: '#764ba2',
          600: '#6a3f92',
          700: '#5e3482',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
