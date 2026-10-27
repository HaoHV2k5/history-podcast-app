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
        'apple-dialog': '0 24px 60px -12px rgba(38, 37, 34, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.75) inset, 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        'sound-wave': {
          '0%': { height: '4px' },
          '50%': { height: '16px' },
          '100%': { height: '8px' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(184, 51, 69, 0.45))' },
          '50%': { opacity: '0.85', filter: 'drop-shadow(0 0 2px rgba(184, 51, 69, 0.15))' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-10%)', opacity: '0' },
          '30%': { opacity: '0.7' },
          '70%': { opacity: '0.7' },
          '100%': { transform: 'translateY(120%)', opacity: '0' },
        },
        'apple-spring-in': {
          '0%': {
            opacity: '0',
            transform: 'translate3d(-50%, -46%, 0) scale(0.92)',
            filter: 'blur(4px)',
          },
          '60%': {
            opacity: '1',
            transform: 'translate3d(-50%, -50.4%, 0) scale(1.008)',
            filter: 'blur(0px)',
          },
          '82%': {
            transform: 'translate3d(-50%, -49.85%, 0) scale(0.998)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate3d(-50%, -50%, 0) scale(1)',
          },
        },
        'apple-spring-out': {
          '0%': {
            opacity: '1',
            transform: 'translate3d(-50%, -50%, 0) scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate3d(-50%, -47%, 0) scale(0.95)',
          },
        },
        'apple-backdrop-in': {
          '0%': {
            opacity: '0',
            backdropFilter: 'blur(0px)',
          },
          '100%': {
            opacity: '1',
            backdropFilter: 'blur(16px)',
          },
        },
        'apple-backdrop-out': {
          '0%': {
            opacity: '1',
            backdropFilter: 'blur(16px)',
          },
          '100%': {
            opacity: '0',
            backdropFilter: 'blur(0px)',
          },
        },
      },
      animation: {
        'sound-wave': 'sound-wave 1.2s ease-in-out infinite alternate',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.25s ease-out forwards',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 2.2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'apple-spring-in': 'apple-spring-in 0.34s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'apple-spring-out': 'apple-spring-out 0.18s cubic-bezier(0.3, 0, 0.8, 0.15) forwards',
        'apple-backdrop-in': 'apple-backdrop-in 0.28s ease-out forwards',
        'apple-backdrop-out': 'apple-backdrop-out 0.18s ease-in forwards',
      },
    },
  },
  plugins: [],
}
