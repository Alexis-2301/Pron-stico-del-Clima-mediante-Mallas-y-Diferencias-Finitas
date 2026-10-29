import React, { useRef, useEffect } from 'react';
import { TrendingDown, Cpu, Calculator } from 'lucide-react';

export default function ConvergenceGraph({ nodeHistory, timestamps, gridH = 10 }) {
  const sparklineRef = useRef(null);

  // Dibujar evolución del nodo
  useEffect(() => {
    const canvas = sparklineRef.current;
    if (!canvas || !nodeHistory || nodeHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const minT = Math.min(...nodeHistory);
    const maxT = Math.max(...nodeHistory);
    const range = maxT - minT || 1e-4;

    const pad = 12;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;

    // Cuadrícula de fondo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const y = pad + (drawH / 4) * k;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(width - pad, y);
      ctx.stroke();
    }

    // Curva temporal
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    nodeHistory.forEach((val, idx) => {
      const x = pad + (idx / (nodeHistory.length - 1)) * drawW;
      const y = pad + drawH - ((val - minT) / range) * drawH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Punto final
    const lastX = pad + drawW;
    const lastY = pad + drawH - ((nodeHistory[nodeHistory.length - 1] - minT) / range) * drawH;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [nodeHistory]);

  const costData = [
    { h: 20, nodes: '2.500', dtMax: '666 s', steps: '130', cost: '0.12x' },
    { h: 10, nodes: '10.000', dtMax: '333 s', steps: '260', cost: '1.0x (Base)' },
    { h: 5, nodes: '40.000', dtMax: '166 s', steps: '520', cost: '8.0x' },
    { h: 2.5, nodes: '160.000', dtMax: '83 s', steps: '1.040', cost: '64.0x' },
    { h: 1, nodes: '1.000.000', dtMax: '33 s', steps: '2.600', cost: '1.000.0x' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Evolución temporal del nodo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-xs uppercase tracking-wider">
              Evolución del Nodo en 24 Horas
            </h3>
          </div>
          <span className="font-mono text-[11px] text-amber-400">
            {nodeHistory && nodeHistory.length
              ? `${nodeHistory[0].toFixed(1)} °C → ${nodeHistory[nodeHistory.length - 1].toFixed(1)} °C`
              : '—'}
          </span>
        </div>

        <div className="mt-3">
          <canvas
            ref={sparklineRef}
            width={400}
            height={130}
            className="w-full h-[130px] rounded bg-slate-950/60 border border-slate-800"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>0 h (Inicio)</span>
            <span>12 h</span>
            <span>24 h (Pronóstico final)</span>
          </div>
        </div>
      </div>

      {/* Costo según resolución h */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-sky-400" />
            <h3 className="font-semibold text-slate-100 text-xs uppercase tracking-wider">
              Costo Computacional vs Resolución (O(1/h³))
            </h3>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Dominio 1000×1000 km</span>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1">h</th>
                <th>Nodos</th>
                <th>Δt máx.</th>
                <th>Pasos</th>
                <th>Costo</th>
              </tr>
            </thead>
            <tbody>
              {costData.map((row) => (
                <tr
                  key={row.h}
                  className={`border-b border-slate-800/50 ${
                    row.h === gridH ? 'text-amber-400 font-bold bg-amber-950/20' : 'text-slate-300'
                  }`}
                >
                  <td className="py-1.5">{row.h} km</td>
                  <td>{row.nodes}</td>
                  <td>{row.dtMax}</td>
                  <td>{row.steps}</td>
                  <td>{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          Al reducir h a la mitad, los nodos se cuadruplican (1/h²) y los pasos requeridos por CFL se duplican (1/h), multiplicando el costo por 8.
        </p>
      </div>
    </div>
  );
}
