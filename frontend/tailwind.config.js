/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Universidad de los Llanos - Colores Corporativos
        'llanos-red': '#DC143C',       // Rojo oficial
        'llanos-red-deep': '#A60F2D',  // Rojo profundo (sombras y degradados)
        'llanos-dark': '#1a1a1a',      // Negro oficial
        'llanos-light': '#F5F5F5',     // Blanco oficial
        'llanos-accent': '#FF6B35',    // Rojo anaranjado
        'llanos-dark-alt': '#2d2d2d',  // Negro secundario

        // Tokens semánticos: cambian solos entre modo claro y oscuro (ver index.css)
        paper: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        well: 'rgb(var(--well) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        clay: '28px',
        'clay-sm': '20px',
        'clay-xs': '12px',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        'clay-sm': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'clay-md': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'clay-lg': '0 12px 32px rgba(0, 0, 0, 0.15)',
        'clay-xl': '0 16px 48px rgba(0, 0, 0, 0.18)',
        'glass-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'glass-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      animation: {
        'spin-slow': 'spin 28s linear infinite',
        'bounce-subtle': 'bounce-subtle 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
