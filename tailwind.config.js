/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',          // Azul claro sereno
        'primary-light': '#8ABAF3',  // Azul suave para fundo
        'primary-dark': '#2C3E50',   // Azul escuro para títulos
        secondary: '#7ED6A7',        // Verde calmante para sucesso
        warning: '#F6D365',          // Amarelo suave
        danger: '#E57373',           // Vermelho para erro
        background: '#E9F1FA',       // Azul claro de fundo
        'background-deep': '#D6E6F2',// Fundo mais forte para cartões
        'text-base': '#2F2F2F',      // Texto principal
        'text-muted': '#6E7B8B',     // Texto secundário
        'card-bg': '#F9FBFD',        // Cartões
        border: '#D9E3EC',           // Bordas suaves
        'accent-blue': '#5B8DEF',    // Destaque
        'overlay-blue': '#4A90E2aa', // Sobreposições
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        xl: '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
