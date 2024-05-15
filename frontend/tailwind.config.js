/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    'node_modules/flowbite-react/lib/esm/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
      'custom-dark': 'rgb(27, 26, 26)'
    }},
  },
  plugins: [require('flowbite/plugin')],
}
