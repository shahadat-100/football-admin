import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#fafafa',
        foreground: '#111111',
        card: '#ffffff',
        'card-foreground': '#111111',
        popover: '#ffffff',
        'popover-foreground': '#111111',
        primary: '#c8102e',          // Classic football red
        'primary-foreground': '#ffffff',
        secondary: '#f5f5f5',
        'secondary-foreground': '#111111',
        muted: '#f3f4f6',
        'muted-foreground': '#6b7280',
        accent: '#c8102e',
        'accent-foreground': '#ffffff',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: '#e5e7eb',
        input: '#ffffff',
        ring: '#c8102e',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        heading: ['"Inter"', 'sans-serif'],
        mono: ['monospace'],
      },
      boxShadow: {
        DEFAULT: '0 1px 3px rgba(0,0,0,0.08)',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.05)',
        lg: '0 10px 15px rgba(0,0,0,0.05)',
        xl: '0 20px 25px rgba(0,0,0,0.05)',
        none: 'none',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
      },
      letterSpacing: {
        tight: '-0.02em',
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