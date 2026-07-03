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
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c0d7ff',
          300: '#90b7ff',
          400: '#6091ff',
          500: '#2874f0', // Flipkart Blue
          600: '#1a5bcf',
          700: '#1446a7',
          800: '#113a87',
          900: '#10316e',
        },
        secondary: '#ff9f00', // Flipkart Orange
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
