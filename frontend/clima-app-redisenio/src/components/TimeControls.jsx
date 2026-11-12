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
  const max = Math.max(0, totalSnapshots - 1);
  const pct = max ? (currentIndex / max) * 100 : 0;

  return (
    <section className="clay flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5" aria-label="Línea de tiempo">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="btn-primary h-12 min-w-[8.5rem]"
          aria-label={isPlaying ? 'Pausar simulación' : 'Reproducir simulación'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </button>
        <button
          type="button"
          onClick={onStep}
          disabled={isPlaying || currentIndex >= totalSnapshots - 1}
          className="btn-soft h-12 w-12 !p-0"
          title="Avanzar un paso"
          aria-label="Avanzar un paso"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className="btn-soft h-12 w-12 !p-0" title="Reiniciar a las 00:00" aria-label="Reiniciar a las 00:00">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-baseline justify-between text-xs text-mute">
          <span>
            <span className="font-display text-xl font-bold tabular-nums text-ink">{formatHoursMinutes(currentSec)}</span>
            <span className="ml-1.5 tabular-nums">de {formatHoursMinutes(totalSec)}</span>
          </span>
          <span className="tabular-nums">
            Paso {currentIndex} de {max}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="clay-range"
          style={{ '--fill': `${pct}%` }}
          aria-label="Momento de la simulación"
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-faint">
          <span>00:00</span>
          <span>12:00</span>
          <span>24:00</span>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-mute sm:flex-col sm:items-stretch sm:gap-1.5">
        Velocidad
        <select value={speed} onChange={(e) => onChangeSpeed(Number(e.target.value))} className="field !w-auto">
          <option value={500}>0.5x</option>
          <option value={200}>1x</option>
          <option value={100}>2x</option>
          <option value={40}>5x</option>
          <option value={15}>10x</option>
        </select>
      </label>
    </section>
  );
}
