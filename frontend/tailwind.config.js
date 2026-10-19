/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        civix: {
          primary: '#15803D',
          deep: '#14532D',
          forest: '#052E1B',
          emerald: '#10B981',
          mint: '#D1FAE5',
          soft: '#F0FDF4',
          neutral: '#FAFCFA',
          surface: '#FFFFFF',
          text: '#17251D',
          muted: '#647067',
          border: '#E2EAE4',
          // status
          danger: '#DC2626',
          warning: '#D97706',
          success: '#16A34A',
          // backwards compatibility fallbacks
          navy: '#052E1B',
          blue: '#14532D',
          orange: '#15803D',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
