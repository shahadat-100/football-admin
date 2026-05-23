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
        card: '#fffcf2',
        'card-foreground': '#2b2b2b',
        popover: '#fffcf2',
        'popover-foreground': '#2b2b2b',
        primary: '#e05a3d', // Vintage red-orange
        'primary-foreground': '#ffffff',
        secondary: '#4a7c59', // Retro green
        'secondary-foreground': '#ffffff',
        muted: '#d4cbb3',
        'muted-foreground': '#665f4b',
        accent: '#f4a261', // Vintage orange
        'accent-foreground': '#2b2b2b',
        destructive: '#c1121f',
        'destructive-foreground': '#ffffff',
        border: '#2b2b2b', // Hard borders
        input: '#fffcf2',
        ring: '#e05a3d',
      },
      fontFamily: {
        sans: ['"Space Mono"', 'monospace'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px rgba(43, 43, 43, 1)',
        'retro-hover': '6px 6px 0px 0px rgba(43, 43, 43, 1)',
        'retro-active': '2px 2px 0px 0px rgba(43, 43, 43, 1)',
      }
    },
  },
  plugins: [],
}

export default config
