import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// Crear contexto de tema
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  useEffect(() => {
    // Obtener tema guardado o usar preferencia del sistema
    const savedTheme = localStorage.getItem('clima-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme) => {
    const html = document.documentElement;
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
    
    localStorage.setItem('clima-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

// Componente botón de cambio de tema
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="clay-button-secondary fixed top-4 right-4 z-50 p-2 rounded-clay-xs"
      title={`Cambiar a modo ${theme === 'dark' ? 'claro (Universidad)' : 'oscuro'}`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-amber-400" />
      ) : (
        <Moon size={20} className="llanos-red-text" />
      )}
    </button>
  );
};
