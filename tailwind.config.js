/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      roboto: ['Roboto', 'sans-serif'],
    },
    extend: {
      colors: {
        'tree-green': '#0b9872',
        'tree-green-light': '#0cb08a',
      },
      width: {
        'fit': 'fit-content',
      }
    },
  },
  plugins: [],
};
