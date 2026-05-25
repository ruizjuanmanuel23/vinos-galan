/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde botella
        botella: {
          50:  '#f0f7f1',
          100: '#dceede',
          200: '#bbdcc0',
          300: '#8dc197',
          400: '#5ea16d',
          500: '#3f854f',
          600: '#2f6a3d',
          700: '#275433',
          800: '#22432b',
          900: '#1d3825',
          950: '#0d1f13'
        },
        // Dorado / mostaza
        dorado: {
          50:  '#fdf9ed',
          100: '#fbf0c7',
          200: '#f7e08a',
          300: '#f3cc4d',
          400: '#efb826',
          500: '#dca015',
          600: '#bd7c10',
          700: '#965910',
          800: '#7d4715',
          900: '#6a3b17',
          950: '#3e1f08'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
}
