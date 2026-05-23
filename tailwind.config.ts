import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f0e6c8',       // Aged Panini cream
        foreground: '#1a1f3c',       // Deep navy
        card: '#fdf6e3',             // Warm off-white
        'card-foreground': '#1a1f3c',
        popover: '#fdf6e3',
        'popover-foreground': '#1a1f3c',
        primary: '#c8102e',          // Classic football red
        'primary-foreground': '#ffffff',
        secondary: '#1a1f3c',        // Deep navy
        'secondary-foreground': '#f0e6c8',
        muted: '#d9cdb0',            // Worn tan
        'muted-foreground': '#5a5340',
        accent: '#d4a017',           // Vintage gold
        'accent-foreground': '#1a1f3c',
        destructive: '#8b0000',      // Dark red
        'destructive-foreground': '#ffffff',
        border: '#1a1f3c',           // Hard navy borders
        input: '#fdf6e3',
        ring: '#c8102e',
      },
      fontFamily: {
        sans: ['"Courier Prime"', 'monospace'],
        heading: ['"Oswald"', '"Bebas Neue"', 'sans-serif'],
        mono: ['"Courier Prime"', 'monospace'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #1a1f3c',
        'retro-hover': '6px 6px 0px 0px #1a1f3c',
        'retro-active': '2px 2px 0px 0px #1a1f3c',
        DEFAULT: '4px 4px 0px 0px #1a1f3c',
        sm: '2px 2px 0px 0px #1a1f3c',
        md: '4px 4px 0px 0px #1a1f3c',
        lg: '6px 6px 0px 0px #1a1f3c',
        xl: '8px 8px 0px 0px #1a1f3c',
        none: 'none',
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      borderWidth: {
        DEFAULT: '2px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },
      letterSpacing: {
        scoreboard: '0.15em',
        stamp: '0.25em',
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