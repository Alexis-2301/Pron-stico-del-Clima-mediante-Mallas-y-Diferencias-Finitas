import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Componente Collapsible (Retraíble)
 * Permite contraer/expandir secciones para optimizar espacio
 * 
 * @param {string} title - Título del panel
 * @param {React.ReactNode} children - Contenido del panel
 * @param {boolean} defaultOpen - Abierto por defecto (true/false)
 * @param {string} icon - Icono a mostrar (componente React)
 * @param {string} className - Clases CSS adicionales
 */
export const Collapsible = ({
  title,
  children,
  defaultOpen = true,
  icon: Icon = null,
  className = '',
  onToggle = null,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <div className={`clay-panel ${className}`}>
      {/* Header retraíble */}
      <button
        onClick={handleToggle}
        className="collapsible-header w-full"
      >
        <div className="collapsible-title">
          {Icon && <Icon size={20} />}
          <span>{title}</span>
        </div>
        <div className={`collapsible-toggle ${isOpen ? 'open' : ''}`}>
          <ChevronDown size={20} />
        </div>
      </button>

      {/* Contenido colapsable */}
      <div
        className={`collapsible-content ${!isOpen ? 'collapsed' : ''}`}
        style={{
          maxHeight: isOpen ? '1000px' : '0',
        }}
      >
        <div className="pt-4 border-t border-llanos-red border-opacity-20">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente CollapsibleGroup
 * Agrupa múltiples paneles collapsibles con estados independientes
 */
export const CollapsibleGroup = ({ children, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
};

export default Collapsible;
