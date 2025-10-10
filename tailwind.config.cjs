const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'charney-red': '#FF5959',
        'charney-black': '#000000',
        'charney-cream': '#F6F1EB',
        'charney-white': '#FFFFFF',
        'charney-gray': '#666666',
        'charney-light-gray': '#E5E5E5',
        'charney-charcoal': '#1A1A1A',
        'charney-slate': '#2A2A2A',
      },
      boxShadow: {
        charney: '0 4px 12px rgba(0, 0, 0, 0.1)',
        'charney-dark': '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      borderWidth: {
        6: '6px',
      },
      fontFamily: {
        brand: ['"Franklin Gothic"', "'Arial Narrow'", 'Arial', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
