import React from 'react';

/** Escala térmica compartida por los visores 3D y 2D. */
export default function ThermalLegend({ minVal, maxVal }) {
  return (
    <div className="flex items-center gap-3 px-2 pb-1 text-xs text-mute">
      <span className="shrink-0 font-semibold tabular-nums text-ink">{minVal.toFixed(0)} °C</span>
      <div
        className="h-3 flex-1 rounded-full"
        style={{
          background:
            'linear-gradient(to right, rgb(20,50,220), rgb(50,170,180), rgb(200,230,30), rgb(245,140,10), rgb(255,40,30))',
          boxShadow: 'var(--well-shadow)',
        }}
        role="img"
        aria-label={`Escala de temperatura de ${minVal.toFixed(0)} a ${maxVal.toFixed(0)} grados`}
      />
      <span className="shrink-0 font-semibold tabular-nums text-ink">{maxVal.toFixed(0)} °C</span>
    </div>
  );
}
