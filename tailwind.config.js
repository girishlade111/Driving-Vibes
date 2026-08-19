/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
      },
      animation: {
        'fadeIn': 'fadeIn 250ms ease-out both',
        'slideUp': 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      colors: {
        // Design token — no pure colors; keep it sophisticated
        glass: {
          white: 'rgba(255,255,255,0.10)',
          dark: 'rgba(10,10,12,0.48)',
        },
      },
      borderColor: {
        'white/8': 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
};
