/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f9f5',
          100: '#c0f0e4',
          200: '#7eebd1',
          300: '#2AD4AE',
          400: '#1fb697',
          500: '#1fb697',
          600: '#1aa38a',
          700: '#001E5D',
          800: '#00133d',
          900: '#000a26',
        },
        navy: {
          50:  '#e6ebf7',
          100: '#b3c0e6',
          200: '#7f95d5',
          300: '#4c6ac4',
          400: '#1940b3',
          500: '#002DA4',
          600: '#001E5D',
          700: '#00133d',
          800: '#000a26',
          900: '#000514',
        },
        mint: {
          50:  '#e6f9f5',
          100: '#c0f0e4',
          200: '#7eebd1',
          300: '#2AD4AE',
          400: '#1fb697',
          500: '#1aa38a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
