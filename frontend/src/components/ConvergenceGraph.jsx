import React, { useRef, useEffect } from 'react';
import { TrendingDown, Cpu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const costData = [
  { h: 20, nodes: '2.500', dtMax: '666 s', steps: '130', cost: '0.12x' },
  { h: 10, nodes: '10.000', dtMax: '333 s', steps: '260', cost: '1.0x (base)' },
  { h: 5, nodes: '40.000', dtMax: '166 s', steps: '520', cost: '8.0x' },
  { h: 2.5, nodes: '160.000', dtMax: '83 s', steps: '1.040', cost: '64.0x' },
  { h: 1, nodes: '1.000.000', dtMax: '33 s', steps: '2.600', cost: '1.000x' },
];

export default function ConvergenceGraph({ nodeHistory, timestamps, gridH = 10 }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodeHistory || nodeHistory.length < 2) return;

    const css = getComputedStyle(document.documentElement);
    const rgb = (name) => css.getPropertyValue(name).trim().split(/\s+/).join(',');
    const red = `rgb(${rgb('--red')})`;
    const accent = `rgb(${rgb('--accent')})`;
    const gridColor = `rgba(${rgb('--ink')},0.10)`;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const minT = Math.min(...nodeHistory);
    const maxT = Math.max(...nodeHistory);
    const range = maxT - minT || 1e-4;
    const pad = 16;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;
    const px = (idx) => pad + (idx / (nodeHistory.length - 1)) * drawW;
    const py = (val) => pad + drawH - ((val - minT) / range) * drawH;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const y = pad + (drawH / 4) * k;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(width - pad, y);
      ctx.stroke();
    }

    // Área bajo la curva
    const fill = ctx.createLinearGradient(0, pad, 0, height - pad);
    fill.addColorStop(0, `rgba(${rgb('--red')},0.35)`);
    fill.addColorStop(1, `rgba(${rgb('--accent')},0)`);
    ctx.beginPath();
    nodeHistory.forEach((val, idx) => (idx === 0 ? ctx.moveTo(px(idx), py(val)) : ctx.lineTo(px(idx), py(val))));
    ctx.lineTo(px(nodeHistory.length - 1), height - pad);
    ctx.lineTo(px(0), height - pad);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // Curva
    const stroke = ctx.createLinearGradient(pad, 0, width - pad, 0);
    stroke.addColorStop(0, red);
    stroke.addColorStop(1, accent);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    nodeHistory.forEach((val, idx) => (idx === 0 ? ctx.moveTo(px(idx), py(val)) : ctx.lineTo(px(idx), py(val))));
    ctx.stroke();

    // Punto final
    const last = nodeHistory.length - 1;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = red;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(px(last), py(nodeHistory[last]), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [nodeHistory, timestamps, theme]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <TrendingDown className="h-4 w-4 text-brand" aria-hidden="true" />
            Temperatura del nodo
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-brand">
            {nodeHistory && nodeHistory.length
              ? `${nodeHistory[0].toFixed(1)} °C → ${nodeHistory[nodeHistory.length - 1].toFixed(1)} °C`
              : '—'}
          </span>
        </div>
        <div className="clay-well p-3">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="h-auto w-full"
            role="img"
            aria-label="Evolución de la temperatura del nodo seleccionado durante 24 horas"
          />
          <div className="mt-1 flex justify-between text-[11px] text-faint">
            <span>0 h</span>
            <span>12 h</span>
            <span>24 h</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Cpu className="h-4 w-4 text-brand" aria-hidden="true" />
            Costo vs. resolución O(1/h³)
          </span>
          <span className="text-xs text-mute">Dominio 1000×1000 km</span>
        </div>
        <div className="clay-well overflow-x-auto p-3">
          <table className="w-full text-left text-xs tabular-nums">
            <thead>
              <tr className="text-mute">
                <th className="py-1.5 font-medium">h</th>
                <th className="font-medium">Nodos</th>
                <th className="font-medium">Δt máx.</th>
                <th className="font-medium">Pasos</th>
                <th className="font-medium">Costo</th>
              </tr>
            </thead>
            <tbody>
              {costData.map((row) => (
                <tr key={row.h} className={row.h === gridH ? 'font-bold text-brand' : 'text-ink'}>
                  <td className="py-2">{row.h} km</td>
                  <td>{row.nodes}</td>
                  <td>{row.dtMax}</td>
                  <td>{row.steps}</td>
                  <td>{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-mute">
          Al reducir h a la mitad, los nodos se cuadruplican (1/h²) y los pasos exigidos por CFL se duplican (1/h): el costo se multiplica por 8.
        </p>
      </div>
    </div>
  );
}
