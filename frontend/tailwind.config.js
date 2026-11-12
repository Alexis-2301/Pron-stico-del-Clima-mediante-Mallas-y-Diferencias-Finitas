/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Universidad de los Llanos - Colores Corporativos
        'llanos-red': '#DC143C',      // Rojo oficial
        'llanos-dark': '#1a1a1a',     // Negro oficial
        'llanos-light': '#F5F5F5',    // Blanco oficial
        'llanos-accent': '#FF6B35',   // Rojo anaranjado
        'llanos-dark-alt': '#2d2d2d', // Negro secundario
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        // Claymorfismo - sombras suaves y profundas
        'clay-sm': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'clay-md': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'clay-lg': '0 12px 32px rgba(0, 0, 0, 0.15)',
        'clay-xl': '0 16px 48px rgba(0, 0, 0, 0.18)',
        // Glassmorfismo - sombras más sutiles
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'glass-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
