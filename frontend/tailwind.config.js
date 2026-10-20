/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        civix: {
          primary: '#16A34A',
          deep: '#156637',
          forest: '#0D3823',
          emerald: '#22C55E',
          mint: '#DCFCE7',
          soft: '#F0FDF4',
          neutral: '#F8FAF8',
          surface: '#FFFFFF',
          text: '#1A2E22',
          muted: '#5C7263',
          border: '#D5E2D9',
          danger: '#DC2626',
          warning: '#D97706',
          success: '#16A34A',
          navy: '#0D3823',
          blue: '#156637',
          orange: '#16A34A',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
