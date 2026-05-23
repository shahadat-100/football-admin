import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f0d',
        foreground: '#f0ede6',
        card: '#112318',
        'card-foreground': '#f0ede6',
        popover: '#112318',
        'popover-foreground': '#f0ede6',
        primary: '#f0ede6',         // Off-white primary
        'primary-foreground': '#0a0f0d',
        secondary: '#0d1f17',
        'secondary-foreground': '#f0ede6',
        muted: '#1e3d2b',
        'muted-foreground': '#6b8c75',
        accent: '#00c853',
        'accent-foreground': '#0a0f0d',
        destructive: '#ff3333',
        'destructive-foreground': '#ffffff',
        border: '#1e3d2b',
        input: '#112318',
        ring: '#f0ede6',            // Off-white focus rings
      },
      fontFamily: {
        sans: ['"Inter"', '"DM Sans"', 'sans-serif'],
        heading: ['"Bebas Neue"', '"Barlow Condensed"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'electric': '4px 4px 0px 0px #f0ede6',
        'electric-hover': '6px 6px 0px 0px #f0ede6',
        'live': '0 0 12px rgba(0, 200, 83, 0.3)',
        DEFAULT: '4px 4px 0px 0px #f0ede6',
        sm: '2px 2px 0px 0px #f0ede6',
        md: '4px 4px 0px 0px #f0ede6',
        lg: '6px 6px 0px 0px #f0ede6',
        xl: '8px 8px 0px 0px #f0ede6',
        '2xl': '0 0 12px rgba(0, 200, 83, 0.3)',
        none: 'none',
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '0px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },
      letterSpacing: {
        scoreboard: '0.15em',
        wide: '0.1em',
      },
      screens: {
        'sidebar-sm': '640px',
        'sidebar-md': '768px',
        'sidebar-lg': '1024px',
        'sidebar-xl': '1280px',
      }
    },
  },
  plugins: [],
}

export default config