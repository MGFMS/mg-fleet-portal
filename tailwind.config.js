/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Matches mg-fms so both apps look like one product.
        // red-700 #b91c1c is the dominant brand color; -dark for active states,
        // -light for hover accents.
        brand: {
          DEFAULT: '#b91c1c', // red-700
          dark: '#991b1b',    // red-800
          light: '#dc2626',   // red-600
        },
        sidebar: {
          DEFAULT: '#212529',
          hover: '#2c3136',
          active: '#b91c1c',
          text: '#adb5bd',
          heading: '#6c757d',
        },
      },
    },
  },
  plugins: [],
}
