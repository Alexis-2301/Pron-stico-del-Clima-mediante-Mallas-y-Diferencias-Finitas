import React from 'react';

export default function Inspector({ matrix, selectedNode, alpha = 5000, u = 5, v = 0, dx = 10000, dt = 600 }) {
  if (!matrix || !matrix.length || !selectedNode) return null;

  const ny = matrix.length;
  const nx = matrix[0].length;
  const { i, j } = selectedNode;

  const isBoundary = i === 0 || i === ny - 1 || j === 0 || j === nx - 1;

  const valC = matrix[i][j];
  const valN = i < ny - 1 ? matrix[i + 1][j] : valC;
  const valS = i > 0 ? matrix[i - 1][j] : valC;
  const valE = j < nx - 1 ? matrix[i][j + 1] : valC;
  const valW = j > 0 ? matrix[i][j - 1] : valC;

  const avgNeighbors = (valN + valS + valE + valW) / 4.0;

  const r = (alpha * dt) / (dx * dx);
  const cx = (u * dt) / dx;
  const cy = (v * dt) / dx;

  const diffTerm = r * (valN + valS + valE + valW - 4.0 * valC);
  const advX = u > 0 ? -cx * (valC - valW) : -cx * (valE - valC);
  const advY = v > 0 ? -cy * (valC - valS) : -cy * (valN - valC);
  const nextVal = valC + diffTerm + advX + advY;

  const clean = (x) => (Math.abs(x) < 0.0005 ? 0 : x); // evita mostrar «-0.000»
  const sign = (x) => (clean(x) >= 0 ? '+' : '');
  const tone = (x) => (clean(x) > 0 ? 'text-emerald-600 dark:text-emerald-400' : clean(x) < 0 ? 'text-brand' : 'text-mute');

  const Neighbor = ({ label, value }) => (
    <div className="clay-well px-2 py-2.5">
      <span className="block text-xs text-mute">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums text-ink">{value.toFixed(2)} °C</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="text-xs text-mute">
        Coordenada [{i}, {j}] {isBoundary && '· nodo de borde'}
      </p>

      {/* Stencil de 5 puntos */}
      <div className="mx-auto grid max-w-[320px] grid-cols-3 gap-2.5 text-center">
        <div />
        <Neighbor label="Norte (i+1)" value={valN} />
        <div />
        <Neighbor label="Oeste (j−1)" value={valW} />
        <div className="clay-active rounded-clay-sm px-2 py-2.5">
          <span className="block text-xs text-white/85">Centro (i, j)</span>
          <span className="font-display text-lg font-bold tabular-nums">{valC.toFixed(2)} °C</span>
        </div>
        <Neighbor label="Este (j+1)" value={valE} />
        <div />
        <Neighbor label="Sur (i−1)" value={valS} />
        <div />
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-mute">
          <dt>Promedio de vecinos</dt>
          <dd className="font-mono font-semibold tabular-nums text-ink">{avgNeighbors.toFixed(2)} °C</dd>
        </div>
        <div className="flex justify-between text-mute">
          <dt>Difusión térmica</dt>
          <dd className={`font-mono font-semibold tabular-nums ${tone(diffTerm)}`}>
            {sign(diffTerm)}
            {clean(diffTerm).toFixed(3)} °C
          </dd>
        </div>
        <div className="flex justify-between text-mute">
          <dt>Advección por viento</dt>
          <dd className={`font-mono font-semibold tabular-nums ${tone(advX + advY)}`}>
            {sign(advX + advY)}
            {clean(advX + advY).toFixed(3)} °C
          </dd>
        </div>
        <div className="clay-well flex items-center justify-between px-4 py-3">
          <dt className="font-semibold text-ink">T en el siguiente paso</dt>
          <dd className="font-display text-xl font-bold tabular-nums text-brand">{nextVal.toFixed(2)} °C</dd>
        </div>
      </dl>
    </div>
  );
}
