/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A90E2',
          light: '#7BB3F0',
          dark: '#2C5AA0'
        },
        secondary: {
          DEFAULT: '#7ED6A7',
          light: '#A8E6CA',
          dark: '#5BC084'
        },
        warning: {
          DEFAULT: '#F6D365',
          light: '#F9E79F',
          dark: '#F4D03F'
        },
        danger: {
          DEFAULT: '#E57373',
          light: '#EF9A9A',
          dark: '#E53E3E'
        },
        success: {
          DEFAULT: '#7ED6A7',
          light: '#A8E6CA',
          dark: '#5BC084'
        },
        
        background: {
          DEFAULT: '#F8FAFC',
          deep: '#F1F5F9'
        },
        'primary-light': '#E3F2FD',
        'accent-blue': '#64B5F6',
        
        'text-base': '#1A202C',
        'text-muted': '#718096',
        
        border: '#E2E8F0',
        'card-bg': '#FFFFFF',
        
        'overlay-blue': 'rgba(74, 144, 226, 0.9)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}