import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Panel retraíble en claymorfismo.
 * Mantiene la misma API: title, children, defaultOpen, icon, className, onToggle.
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
  const panelId = useId();

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onToggle?.(next);
  };

  return (
    <section className={`clay ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-clay px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3 font-display text-lg font-semibold text-ink">
          {Icon && (
            <span className="icon-chip">
              <Icon size={18} />
            </span>
          )}
          {title}
        </span>
        <span className="icon-chip">
          <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <div id={panelId} className="collapsible" data-open={isOpen}>
        <div className="collapsible-inner">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </section>
  );
};

export const CollapsibleGroup = ({ children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>{children}</div>
);

export default Collapsible;
