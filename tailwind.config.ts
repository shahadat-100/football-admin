import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f4ecd8', // Vintage paper
        foreground: '#2b2b2b', // Charcoal
        card: '#fffcf2', // Lighter aged paper
        'card-foreground': '#2b2b2b',
        popover: '#fffcf2',
        'popover-foreground': '#2b2b2b',
        primary: '#e05a3d', // Vintage red-orange
        'primary-foreground': '#ffffff',
        secondary: '#6b8e73', // Muted green
        'secondary-foreground': '#ffffff',
        muted: '#d4cbb3', // Darker aged paper
        'muted-foreground': '#665f4b',
        accent: '#d99748', // Muted amber
        'accent-foreground': '#2b2b2b',
        destructive: '#c1121f',
        'destructive-foreground': '#ffffff',
        border: '#2b2b2b', // Hard dark borders everywhere
        input: '#fffcf2',
        ring: '#e05a3d',
      },
      fontFamily: {
        sans: ['"Space Mono"', 'monospace'], // No modern sans-serifs
        mono: ['"Space Mono"', 'monospace'],
        serif: ['"Courier New"', 'Courier', 'serif'], // Typewriter feel
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #2b2b2b',
        'retro-hover': '6px 6px 0px 0px #2b2b2b',
        'retro-active': '2px 2px 0px 0px #2b2b2b',
        DEFAULT: '4px 4px 0px 0px #2b2b2b',
        sm: '2px 2px 0px 0px #2b2b2b',
        md: '4px 4px 0px 0px #2b2b2b',
        lg: '6px 6px 0px 0px #2b2b2b',
        xl: '8px 8px 0px 0px #2b2b2b',
        '2xl': '12px 12px 0px 0px #2b2b2b',
        none: 'none',
      },
      borderRadius: {
        DEFAULT: '2px', // Sharp corners
        sm: '0px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      borderWidth: {
        DEFAULT: '2px', // Thick hard borders
        '3': '3px',
      },
      letterSpacing: {
        'retro-wide': '0.1em',
        'retro-wider': '0.15em',
        'retro-widest': '0.25em',
      }
    },
  },
  plugins: [],
}

export default config
