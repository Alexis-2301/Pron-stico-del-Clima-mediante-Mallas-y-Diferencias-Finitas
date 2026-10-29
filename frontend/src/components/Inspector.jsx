import React from 'react';

export default function Inspector({
  matrix,
  selectedNode,
  alpha = 5000,
  u = 5,
  v = 0,
  dx = 10000,
  dt = 600,
}) {
  if (!matrix || !matrix.length || !selectedNode) return null;

  const ny = matrix.length;
  const nx = matrix[0].length;
  const { i, j } = selectedNode;

  // Asegurar límites seguros para cálculo
  const isBoundary = i === 0 || i === ny - 1 || j === 0 || j === nx - 1;

  const valC = matrix[i][j];
  const valN = i < ny - 1 ? matrix[i + 1][j] : valC;
  const valS = i > 0 ? matrix[i - 1][j] : valC;
  const valE = j < nx - 1 ? matrix[i][j + 1] : valC;
  const valW = j > 0 ? matrix[i][j - 1] : valC;

  const avgNeighbors = (valN + valS + valE + valW) / 4.0;

  // Números adimensionales
  const r = (alpha * dt) / (dx * dx);
  const cx = (u * dt) / dx;
  const cy = (v * dt) / dx;

  // Términos
  const diffTerm = r * (valN + valS + valE + valW - 4.0 * valC);
  const advX = u > 0 ? -cx * (valC - valW) : -cx * (valE - valC);
  const advY = v > 0 ? -cy * (valC - valS) : -cy * (valN - valC);
  const nextVal = valC + diffTerm + advX + advY;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="font-semibold text-amber-400">Inspector del Nodo</h3>
        <span className="font-mono text-xs text-slate-400">
          Coordenada: [{i}, {j}] {isBoundary && '(Borde)'}
        </span>
      </div>

      {/* Visualización del stencil 3x3 */}
      <div className="my-4 grid grid-cols-3 gap-2 text-center font-mono text-xs max-w-[280px] mx-auto">
        <div className="rounded p-2"></div>
        <div className="rounded-lg border border-sky-500/40 bg-sky-950/40 p-2">
          <span className="block text-[10px] text-sky-400 uppercase">Norte (i+1)</span>
          <span className="text-sm font-semibold text-slate-100">{valN.toFixed(2)} °C</span>
        </div>
        <div className="rounded p-2"></div>

        <div className="rounded-lg border border-sky-500/40 bg-sky-950/40 p-2">
          <span className="block text-[10px] text-sky-400 uppercase">Oeste (j-1)</span>
          <span className="text-sm font-semibold text-slate-100">{valW.toFixed(2)} °C</span>
        </div>
        <div className="rounded-lg border-2 border-amber-400 bg-amber-950/50 p-2 shadow-lg shadow-amber-500/10">
          <span className="block text-[10px] text-amber-400 uppercase font-bold">Centro (i, j)</span>
          <span className="text-base font-bold text-amber-300">{valC.toFixed(2)} °C</span>
        </div>
        <div className="rounded-lg border border-sky-500/40 bg-sky-950/40 p-2">
          <span className="block text-[10px] text-sky-400 uppercase">Este (j+1)</span>
          <span className="text-sm font-semibold text-slate-100">{valE.toFixed(2)} °C</span>
        </div>

        <div className="rounded p-2"></div>
        <div className="rounded-lg border border-sky-500/40 bg-sky-950/40 p-2">
          <span className="block text-[10px] text-sky-400 uppercase">Sur (i-1)</span>
          <span className="text-sm font-semibold text-slate-100">{valS.toFixed(2)} °C</span>
        </div>
        <div className="rounded p-2"></div>
      </div>

      {/* Desglose de la ecuación */}
      <div className="space-y-1.5 border-t border-slate-800 pt-3 text-xs font-mono">
        <div className="flex justify-between text-slate-300">
          <span>Promedio de vecinos:</span>
          <span className="font-semibold text-slate-100">{avgNeighbors.toFixed(2)} °C</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Difusión térmica:</span>
          <span className={diffTerm >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {diffTerm >= 0 ? '+' : ''}{diffTerm.toFixed(3)} °C
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Advección por viento:</span>
          <span className={(advX + advY) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {(advX + advY) >= 0 ? '+' : ''}{(advX + advY).toFixed(3)} °C
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-800/80 pt-1 text-sm font-bold text-amber-400">
          <span>T en siguiente paso:</span>
          <span>{nextVal.toFixed(2)} °C</span>
        </div>
      </div>
    </div>
  );
}
