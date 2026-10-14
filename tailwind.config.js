/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",               // Used by Web (Vite)
    "./App.{js,jsx,ts,tsx}",      // Used by Mobile (Expo)
    "./src/**/*.{js,ts,jsx,tsx}"  // Used by both (Your components)
  ],
  theme: { extend: {} },
  plugins: [],
}