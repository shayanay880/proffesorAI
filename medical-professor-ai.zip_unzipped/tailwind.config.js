/** @type {import('tailwindcss').Config} */
export default {
  // Configuration is now handled in index.css via @theme
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}