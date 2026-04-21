/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d6efd',
          dark: '#0a58ca',
          light: '#258cfb',
        },
        sidebar: {
          DEFAULT: '#212529',
          hover: '#2c3136',
          active: '#0d6efd',
          text: '#adb5bd',
          heading: '#6c757d',
        },
      },
    },
  },
  plugins: [],
}
