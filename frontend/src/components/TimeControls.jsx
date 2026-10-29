import React from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

function formatHoursMinutes(seconds) {
  const mins = Math.round(seconds / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function TimeControls({
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  currentIndex,
  totalSnapshots,
  timestamps,
  speed,
  onChangeSpeed,
  onSeek,
}) {
  const currentSec = timestamps && timestamps[currentIndex] !== undefined ? timestamps[currentIndex] : 0;
  const totalSec = timestamps && timestamps.length ? timestamps[timestamps.length - 1] : 86400;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
      {/* Barra de progreso y reloj */}
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="font-bold text-amber-400">
          t = {formatHoursMinutes(currentSec)} / {formatHoursMinutes(totalSec)}
        </span>
        <span className="text-slate-400">
          Paso {currentIndex} de {totalSnapshots - 1}
        </span>
      </div>

      {/* Slider de tiempo */}
      <div className="my-3">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSnapshots - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="w-full accent-amber-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>00:00 (Inicio)</span>
          <span>12:00 (Mediodía)</span>
          <span>24:00 (Pronóstico)</span>
        </div>
      </div>

      {/* Botones de transporte */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </button>

          <button
            onClick={onStep}
            disabled={isPlaying || currentIndex >= totalSnapshots - 1}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            title="Avanzar un solo paso temporal"
          >
            <SkipForward className="h-4 w-4" />
            Un paso
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            title="Reiniciar a t=0"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>

        {/* Selector de velocidad */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Velocidad:</span>
          <select
            value={speed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value={500}>0.5x</option>
            <option value={200}>1x</option>
            <option value={100}>2x</option>
            <option value={40}>5x</option>
            <option value={15}>10x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
