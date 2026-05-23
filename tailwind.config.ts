import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff', // Stark white
        foreground: '#000000', // Pure black
        card: '#f9f9f9', // Very light grey
        'card-foreground': '#000000',
        popover: '#ffffff',
        'popover-foreground': '#000000',
        primary: '#e3000f', // Bold Swiss Red
        'primary-foreground': '#ffffff',
        secondary: '#f2f2f2', // Light gray
        'secondary-foreground': '#000000',
        muted: '#f2f2f2',
        'muted-foreground': '#737373', // Mid gray
        accent: '#000000', // Black accents
        'accent-foreground': '#ffffff',
        destructive: '#e3000f',
        'destructive-foreground': '#ffffff',
        border: '#e5e5e5', // Soft gray borders
        input: '#ffffff',
        ring: '#000000',
      },
      fontFamily: {
        sans: ['Inter', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
