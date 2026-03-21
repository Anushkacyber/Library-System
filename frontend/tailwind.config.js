/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'jakarta': ['"Plus Jakarta Sans"', 'sans-serif'],
        'dm': ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
