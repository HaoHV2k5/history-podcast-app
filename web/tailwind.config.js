/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F6',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#EFEAE3',
        },
        ink: {
          DEFAULT: '#262522',
          muted: '#696660',
        },
        muted: '#696660',
        border: {
          DEFAULT: '#E0DDD7',
          line: '#E0DDD7',
        },
        accent: {
          DEFAULT: '#B83345',
          hover: '#9F2939',
          soft: '#F7E8EB',
        },
        status: {
          success: {
            text: '#246B4C',
            bg: '#ECF3EE',
          },
          pending: {
            text: '#825916',
            bg: '#F9F0DF',
          },
          error: {
            text: '#A02B36',
            bg: '#F9E9E9',
          },
          processing: {
            text: '#365A78',
            bg: '#EAF0F5',
          },
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
        wordmark: ['"Cormorant Garamond"', '"Noto Serif"', 'serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(38, 37, 34, 0.04)',
        card: '0 1px 3px 0 rgba(38, 37, 34, 0.06), 0 1px 2px -1px rgba(38, 37, 34, 0.04)',
        'card-hover': '0 4px 16px -2px rgba(38, 37, 34, 0.08), 0 2px 6px -1px rgba(38, 37, 34, 0.04)',
        ambient: '0 12px 32px -4px rgba(38, 37, 34, 0.06)',
        'glow-accent': '0 0 20px -3px rgba(184, 51, 69, 0.18)',
        modal: '0 8px 30px rgba(38, 37, 34, 0.12)',
      },
      keyframes: {
        'sound-wave': {
          '0%': { height: '4px' },
          '50%': { height: '16px' },
          '100%': { height: '8px' },
        },
      },
      animation: {
        'sound-wave': 'sound-wave 1.2s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}
