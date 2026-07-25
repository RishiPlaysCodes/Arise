/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sl-dark': '#0a0a0f',
        'sl-darker': '#050508',
        'sl-purple': '#7c3aed',
        'sl-purple-dark': '#5b21b6',
        'sl-purple-light': '#a78bfa',
        'sl-blue': '#3b82f6',
        'sl-blue-glow': '#60a5fa',
        'sl-red': '#ef4444',
        'sl-gold': '#f59e0b',
        'sl-green': '#10b981',
        'sl-cyan': '#06b6d4',
        'sl-panel': '#1a1a2e',
        'sl-panel-light': '#25253a',
        'sl-border': '#2d2d4a',
      },
      fontFamily: {
        'game': ['Orbitron', 'monospace'],
        'body': ['Inter', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #7c3aed, 0 0 10px #7c3aed' },
          '100%': { boxShadow: '0 0 20px #7c3aed, 0 0 40px #7c3aed' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      boxShadow: {
        'sl': '0 0 15px rgba(124, 58, 237, 0.3)',
        'sl-lg': '0 0 30px rgba(124, 58, 237, 0.4)',
      }
    },
  },
  plugins: [],
}
