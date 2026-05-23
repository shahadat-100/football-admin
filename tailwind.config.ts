import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f0d', // Deep pitch black
        foreground: '#f5f5f5', // Bright white text
        card: '#112318', // Card background
        'card-foreground': '#f5f5f5',
        popover: '#112318',
        'popover-foreground': '#f5f5f5',
        primary: '#e8ff00', // Electric yellow
        'primary-foreground': '#0a0f0d',
        secondary: '#0d1f17', // Dark forest green
        'secondary-foreground': '#f5f5f5',
        muted: '#1e3d2b', // Muted green
        'muted-foreground': '#6b8c75', // Faded green-grey
        accent: '#00c853', // Green accent
        'accent-foreground': '#ffffff',
        destructive: '#ff3333', // Red destructive
        'destructive-foreground': '#ffffff',
        border: '#1e3d2b', // Thin dark green borders
        input: '#112318',
        ring: '#e8ff00', // Electric yellow for focus rings
      },
      fontFamily: {
        sans: ['"Inter"', '"DM Sans"', 'sans-serif'], // Clean readable body
        heading: ['"Bebas Neue"', '"Barlow Condensed"', 'sans-serif'], // Stadium scoreboard feel
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'electric': '4px 4px 0px 0px #e8ff00', // Glowing offset shadow
        'electric-hover': '6px 6px 0px 0px #e8ff00',
        'live': '0 0 12px rgba(0, 200, 83, 0.3)', // Subtle green glow for active states
        DEFAULT: '4px 4px 0px 0px #e8ff00',
        sm: '2px 2px 0px 0px #e8ff00',
        md: '4px 4px 0px 0px #e8ff00',
        lg: '6px 6px 0px 0px #e8ff00',
        xl: '8px 8px 0px 0px #e8ff00',
        '2xl': '0 0 12px rgba(0, 200, 83, 0.3)',
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
        DEFAULT: '1px', // Thin borders normally
        '2': '2px', // For active/focused elements
        '3': '3px',
        '4': '4px',
      },
      letterSpacing: {
        scoreboard: '0.15em',
        wide: '0.1em',
      },
      screens: {
        // Sidebar-aware breakpoints
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
