/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#263840', // Fondo del hero izquierdo y acento primario
          700: '#3D5A66',
          500: '#5C7E8F', // Boton principal Entrar y acento activo
          300: '#8CA7B3',
          100: '#C4D3D9'
        },
        ice: {
          500: '#D4DDE2',
          300: '#E4EAED',
          100: '#F3F6F7'  // Fondo suave del formulario
        },
        customGray: {
          900: '#4A4A4A',
          700: '#6E6E6E',
          500: '#A2A2A2',
          300: '#C7C7C7',
          100: '#E8E8E8'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      }
    }
  },
  plugins: []
};
