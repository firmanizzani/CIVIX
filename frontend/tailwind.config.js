/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lime: { 50: '#f1f9f5', 100: '#e2f4ea', 200: '#c4e8d6', 300: '#97d5b7', 400: '#61be94', 500: '#2ba776', 600: '#008358', 700: '#006d49', 800: '#07533e', 900: '#064333', 950: '#022c22' },
        civix: {
          primary: '#008358',
          deep: '#006D49',
          forest: '#07533E',
          emerald: '#42B689',
          mint: '#E2F4EA',
          soft: '#F1F9F5',
          neutral: '#F8FCFA',
          surface: '#FFFFFF',
          text: '#192C33',
          muted: '#5C6D70',
          border: '#D9EAE1',
          danger: '#DC2626',
          warning: '#D97706',
          success: '#008358',
          navy: '#07533E',
          blue: '#008358',
          orange: '#008358',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
