/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#030712',
        surface: '#0f172a',
        neon: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          green: '#10b981'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shockwave': 'shockwave 0.6s ease-out forwards',
        'success-flash': 'successFlash 0.5s ease-out forwards',
        'particle-out': 'particleOut 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
        'elastic-slide': 'elasticSlide 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
        },
        shockwave: {
          '0%': { transform: 'scale(1)', opacity: '0.8', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
          '100%': { transform: 'scale(2.5)', opacity: '0', boxShadow: '0 0 0 30px rgba(59, 130, 246, 0)' },
        },
        successFlash: {
          '0%': { backgroundColor: 'rgba(255, 255, 255, 0)' },
          '50%': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          '100%': { backgroundColor: 'rgba(255, 255, 255, 0)' },
        },
        particleOut: {
           '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
           '100%': { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: '0' }
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%': { transform: 'scale(1.1)', opacity: '0.6' },
        },
        elasticSlide: {
          '0%': { transform: 'translateY(40px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: [],
}