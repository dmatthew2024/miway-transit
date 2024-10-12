/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Ensure Tailwind scans your files for classes
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'miway-blue': '#646cff',
        'miway-hover-blue': '#535bf2',
      },
    },
  },
  plugins: [],
}
