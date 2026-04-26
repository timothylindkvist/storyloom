/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'story-dark': '#0a0a12',
        'story-gold': '#f0c060',
        'story-gold-dim': '#c49a40',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'ui': ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}