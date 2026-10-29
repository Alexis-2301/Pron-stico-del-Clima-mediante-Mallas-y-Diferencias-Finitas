import React, { useRef, useEffect } from 'react';

/**
 * Paleta de colores térmica: Azul -> Cyan -> Amarillo -> Naranja -> Rojo
 */
function getThermalColor(value, minVal, maxVal) {
  if (isNaN(value)) return [128, 128, 128];
  const range = maxVal - minVal || 1e-6;
  const norm = Math.max(0, Math.min(1, (value - minVal) / range));

  // 5 stops
  if (norm < 0.25) {
    const f = norm / 0.25;
    return [Math.round(20 + 30 * f), Math.round(50 + 120 * f), Math.round(220 - 40 * f)];
  } else if (norm < 0.5) {
    const f = (norm - 0.25) / 0.25;
    return [Math.round(50 + 150 * f), Math.round(170 + 60 * f), Math.round(180 - 150 * f)];
  } else if (norm < 0.75) {
    const f = (norm - 0.5) / 0.25;
    return [Math.round(200 + 45 * f), Math.round(230 - 90 * f), Math.round(30 - 20 * f)];
  } else {
    const f = (norm - 0.75) / 0.25;
    return [Math.round(245 + 10 * f), Math.round(140 - 100 * f), Math.round(10 + 20 * f)];
  }
}

export default function Heatmap({
  matrix,
  selectedNode,
  onSelectNode,
  u = 5,
  v = 0,
  minVal = 15,
  maxVal = 35,
  showGrid = true,
  showWind = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || !matrix.length) return;

    const ctx = canvas.getContext('2d');
    const ny = matrix.length;
    const nx = matrix[0].length;

    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / nx;
    const cellH = height / ny;

    ctx.clearRect(0, 0, width, height);

    // Dibujar celdas térmicas
    // Invertir eje Y para que fila i=ny-1 esté al Norte (arriba) y fila 0 al Sur (abajo)
    for (let i = 0; i < ny; i++) {
      const renderY = (ny - 1 - i) * cellH;
      for (let j = 0; j < nx; j++) {
        const val = matrix[i][j];
        const [r, g, b] = getThermalColor(val, minVal, maxVal);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(j * cellW, renderY, cellW + 0.5, cellH + 0.5);
      }
    }

    // Dibujar líneas de cuadrícula si está activado
    if (showGrid && nx <= 60) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let j = 0; j <= nx; j++) {
        ctx.beginPath();
        ctx.moveTo(j * cellW, 0);
        ctx.lineTo(j * cellW, height);
        ctx.stroke();
      }
      for (let i = 0; i <= ny; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(width, i * cellH);
        ctx.stroke();
      }
    }

    // Dibujar flechas de viento
    if (showWind && (Math.abs(u) > 0.1 || Math.abs(v) > 0.1)) {
      const stepJ = Math.max(4, Math.floor(nx / 10));
      const stepI = Math.max(4, Math.floor(ny / 10));
      const spd = Math.hypot(u, v) || 1e-6;
      const angle = Math.atan2(v, u); // v positivo es hacia el Norte (+y en coordenadas físicas)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.5;

      const arrowLen = Math.min(cellW * 2.5, 22);

      for (let i = Math.floor(stepI / 2); i < ny; i += stepI) {
        const cy = (ny - 1 - i) * cellH + cellH / 2;
        for (let j = Math.floor(stepJ / 2); j < nx; j += stepJ) {
          const cx = j * cellW + cellW / 2;

          // En pantalla, Y crece hacia abajo, por lo que invertimos sin(angle)
          const dx = Math.cos(angle) * arrowLen;
          const dy = -Math.sin(angle) * arrowLen;

          ctx.beginPath();
          ctx.moveTo(cx - dx * 0.4, cy - dy * 0.4);
          ctx.lineTo(cx + dx * 0.4, cy + dy * 0.4);
          ctx.stroke();

          // Punta de flecha
          const headLen = 4;
          const tipX = cx + dx * 0.4;
          const tipY = cy + dy * 0.4;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(
            tipX - headLen * Math.cos(angle - Math.PI / 6),
            tipY + headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            tipX - headLen * Math.cos(angle + Math.PI / 6),
            tipY + headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Resaltar nodo seleccionado y su stencil de 5 puntos (N, S, E, O)
    if (selectedNode) {
      const { i, j } = selectedNode;
      if (i >= 0 && i < ny && j >= 0 && j < nx) {
        // Vecinos
        const neighbors = [
          { ni: i + 1, nj: j }, // N
          { ni: i - 1, nj: j }, // S
          { ni: i, nj: j + 1 }, // E
          { ni: i, nj: j - 1 }, // O
        ];

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        neighbors.forEach(({ ni, nj }) => {
          if (ni >= 0 && ni < ny && nj >= 0 && nj < nx) {
            const nyRender = (ny - 1 - ni) * cellH;
            ctx.strokeRect(nj * cellW, nyRender, cellW, cellH);
          }
        });

        // Nodo central
        const centerRenderY = (ny - 1 - i) * cellH;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(j * cellW, centerRenderY, cellW, cellH);

        // Cruz conectora
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 1.5;
        const cX = j * cellW + cellW / 2;
        const cY = centerRenderY + cellH / 2;
        ctx.beginPath();
        ctx.moveTo(cX - cellW, cY);
        ctx.lineTo(cX + cellW, cY);
        ctx.moveTo(cX, cY - cellH);
        ctx.lineTo(cX, cY + cellH);
        ctx.stroke();
      }
    }
  }, [matrix, selectedNode, u, v, minVal, maxVal, showGrid, showWind]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || !matrix.length) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const ny = matrix.length;
    const nx = matrix[0].length;
    const cellW = canvas.width / nx;
    const cellH = canvas.height / ny;

    const j = Math.max(0, Math.min(nx - 1, Math.floor(clickX / cellW)));
    // Invertir eje Y para índice de fila física
    const i = Math.max(0, Math.min(ny - 1, ny - 1 - Math.floor(clickY / cellH)));

    if (onSelectNode) {
      onSelectNode({ i, j });
    }
  };

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-2 text-xs font-mono text-slate-400">
        <span>Norte ↑ (y) · Este → (x)</span>
        <span>Clic en un nodo para inspeccionar stencil</span>
      </div>

      <div className="relative aspect-square w-full max-w-[620px] mx-auto overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onClick={handleCanvasClick}
          className="h-full w-full cursor-crosshair touch-none"
        />
      </div>

      {/* Barra de colores (Leyenda) */}
      <div className="mt-3 flex items-center gap-3 px-1 text-xs font-mono">
        <span className="text-blue-400">{minVal.toFixed(1)} °C</span>
        <div
          className="h-3 flex-1 rounded-full shadow-inner"
          style={{
            background:
              'linear-gradient(to right, rgb(20,50,220), rgb(50,170,180), rgb(200,230,30), rgb(245,140,10), rgb(255,40,30))',
          }}
        />
        <span className="text-red-400">{maxVal.toFixed(1)} °C</span>
      </div>
    </div>
  );
}
