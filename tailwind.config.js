/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          base: '#0e0e0e',
          surface: '#1a1a1a',
          elevated: '#262626',
          border: '#333333',
        },
        gold: {
          DEFAULT: '#fbbf24',
          dim: '#f59e0b',
          glow: 'rgba(251, 191, 36, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: [],
}
