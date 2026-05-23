import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f0e6c8', // Aged cream background
        foreground: '#1a1f3c', // Deep navy
        card: '#fdf6e3', // Warm card white
        'card-foreground': '#1a1f3c',
        popover: '#fdf6e3',
        'popover-foreground': '#1a1f3c',
        primary: '#c8102e', // Classic football red
        'primary-foreground': '#ffffff',
        secondary: '#d4a017', // Gold accent
        'secondary-foreground': '#1a1f3c',
        muted: '#c4b49a', // Muted tan
        'muted-foreground': '#1a1f3c',
        accent: '#d4a017', // Gold accent
        'accent-foreground': '#1a1f3c',
        destructive: '#c8102e',
        'destructive-foreground': '#ffffff',
        border: '#1a1f3c', // Deep navy borders
        input: '#fdf6e3',
        ring: '#c8102e',
      },
      fontFamily: {
        sans: ['"Bebas Neue"', '"Oswald"', 'sans-serif'], // Headings
        mono: ['"Space Mono"', '"Courier Prime"', 'monospace'], // Body / Stats
        serif: ['"Courier New"', 'Courier', 'serif'],
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
        '2xl': '12px 12px 0px 0px #1a1f3c',
        none: 'none',
      },
      borderRadius: {
        DEFAULT: '2px', // Sharp corners for sticker cutout feel
        sm: '0px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      borderWidth: {
        DEFAULT: '2px', // Thick borders
        '3': '3px',
        '4': '4px',
      },
      letterSpacing: {
        wide: '0.1em',
        stamp: '0.25em',
        'retro-wide': '0.1em',
        'retro-wider': '0.15em',
        'retro-widest': '0.25em',
      }
    },
  },
  plugins: [],
}

export default config
