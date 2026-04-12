import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        foreground: '#e2e8f0',
        card: '#111827',
        'card-foreground': '#f8fafc',
        popover: '#0d1117',
        'popover-foreground': '#f8fafc',
        primary: '#6366f1',
        'primary-foreground': '#ffffff',
        secondary: '#1f2937',
        'secondary-foreground': '#e2e8f0',
        muted: '#1a1a2e',
        'muted-foreground': '#94a3b8',
        accent: '#2e1065',
        'accent-foreground': '#c4b5fd',
        destructive: '#7f1d1d',
        'destructive-foreground': '#fca5a5',
        border: '#1f2937',
        input: '#2a2a3e',
        ring: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

export default config
