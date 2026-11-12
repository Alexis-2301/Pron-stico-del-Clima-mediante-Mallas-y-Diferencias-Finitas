import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeContext = createContext();

const readInitialTheme = () => {
  if (typeof document === 'undefined') return 'light';
  // El script de index.html ya dejó la clase puesta antes del primer pintado
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.classList.contains('light')) return 'light';
  const saved = localStorage.getItem('clima-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (newTheme) => {
  const html = document.documentElement;
  html.classList.toggle('dark', newTheme === 'dark');
  html.classList.toggle('light', newTheme !== 'dark');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', newTheme === 'dark' ? '#141414' : '#F5F5F5');
  try {
    localStorage.setItem('clima-theme', newTheme);
  } catch {
    /* almacenamiento no disponible: el tema solo dura la sesión */
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readInitialTheme); // 'dark' | 'light'

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

// Botón de cambio de tema (se ubica en la cabecera)
export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-soft h-10 w-10 !p-0 ${className}`}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? <Sun size={18} className="text-llanos-accent" /> : <Moon size={18} className="text-brand" />}
    </button>
  );
};
