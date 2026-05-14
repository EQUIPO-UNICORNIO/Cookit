/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#edfff2',
          100: '#d1ffdb',
          200: '#a7feba',
          300: '#6afe92',
          400: '#26f564',
          500: '#00de48',
          600: '#006e2f',
          700: '#005826',
          800: '#00461f',
          900: '#003a1a',
        },
        secondary: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc271',
          400: '#ff9f39',
          500: '#ff8212',
          600: '#9d4300',
          700: '#7a3500',
          800: '#612b00',
          900: '#4e2400',
        },
        tertiary: {
          50: '#ffffe0',
          100: '#ffffb8',
          200: '#ffee8a',
          300: '#ffde54',
          400: '#ffcc2e',
          500: '#ffad0d',
          600: '#735c00',
          700: '#5c4800',
          800: '#493a00',
          900: '#3d3000',
        },
      },
      boxShadow: {
        'neo': '3px 3px 0px 0px rgba(0,0,0,0.15)',
        'neo-primary': '3px 3px 0px 0px rgba(0,110,47,0.3)',
        'neo-secondary': '3px 3px 0px 0px rgba(157,67,0,0.3)',
        'card': '4px 4px 0px 0px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
