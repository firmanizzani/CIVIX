/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        civix: {
          primary: '#4D7C0F',
          deep: '#3F6212',
          forest: '#365314',
          emerald: '#A3E635',
          mint: '#ECFCCB',
          soft: '#F7FEE7',
          neutral: '#FAFEF2',
          surface: '#FFFFFF',
          text: '#1F2937',
          muted: '#6B7280',
          border: '#D9F99D',
          danger: '#DC2626',
          warning: '#D97706',
          success: '#65A30D',
          navy: '#365314',
          blue: '#4D7C0F',
          orange: '#65A30D',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
