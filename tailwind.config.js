/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        primary: "#ff5e00",
        secondary: "#FFC107",
        background: "#0a0a0a",
        surface: "#1a1a1a",
        text: "#FFFFFF",
      },
      animation: {
        'fast-pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-reverse': 'spin-reverse 1s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      boxShadow: {
        'primary-glow': '0 0 50px rgba(255, 94, 0, 0.3)',
        'orange-glow': '0 10px 40px -10px rgba(255, 94, 0, 0.4)',
        'orange-intense': '0 20px 60px -15px rgba(255, 94, 0, 0.6)',
      },
      backdropBlur: {
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      }
    },
  },
  plugins: [],
}

