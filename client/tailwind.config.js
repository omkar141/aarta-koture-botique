/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aarta Kouture Brand Colors (from logo)
        brand: {
          pink: '#ec4899',      // Primary - Pink (from watercolor)
          gold: '#D4AF37',      // Secondary - Gold (border)
          rose: '#fb7185',      // Accent - Rose
        },
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',  // Main brand color - Pink
          600: '#db2777',
          700: '#be185d',
          800: '#9f1239',
          900: '#831843'
        },
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#D4AF37',  // Gold
          600: '#BF9D30',
          700: '#A68929',
          800: '#8D7422',
          900: '#74601B'
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#C71585',  // Deep Rose
          600: '#B01276',
          700: '#990F67',
          800: '#820C58',
          900: '#6B0949'
        },
        danger: '#EF4444',
        warning: '#F59E0B',
        light: '#F3F4F6',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'sans': ['Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
