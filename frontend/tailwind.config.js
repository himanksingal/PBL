export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff6f0',
          100: '#ffe9da',
          200: '#ffd0b2',
          300: '#ffb584',
          400: '#ff8d45',
          500: '#e1682f',
          600: '#c7541f',
          700: '#a7441a',
          800: '#863918',
          900: '#6d2f16'
        },
        slateish: {
          50: '#f7f7f8',
          100: '#efeff1',
          200: '#e1e2e6',
          300: '#cfd1d8',
          400: '#a6a9b2',
          500: '#7b7f89',
          600: '#5a5f6a',
          700: '#434955',
          800: '#303643',
          900: '#1e2430'
        }
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.12)',
        soft: '0 4px 16px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: [],
}
