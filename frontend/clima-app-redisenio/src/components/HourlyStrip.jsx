import React from 'react';
import { Droplets } from 'lucide-react';
import { classifyWeather } from '../services/weatherClassifier';
import WeatherIcon from './WeatherIcon';

export const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

export function closestIndex(timestamps, sec) {
  if (!timestamps || !timestamps.length) return 0;
  let best = 0;
  for (let k = 1; k < timestamps.length; k++) {
    if (Math.abs(timestamps[k] - sec) < Math.abs(timestamps[best] - sec)) best = k;
  }
  return best;
}

/** Tira horizontal de 24 horas: cada tarjeta es un salto en el tiempo. */
export default function HourlyStrip({
  snapshots = [],
  humiditySnapshots = [],
  pressureSnapshots = [],
  timestamps = [],
  selectedNode = { i: 20, j: 20 },
  windSpeed = 5,
  currentSec = 0,
  onSeek,
}) {
  const { i, j } = selectedNode;

  const cards = HOURS.map((h) => {
    const idx = closestIndex(timestamps, h * 3600);
    const temp = snapshots[idx]?.[i]?.[j] ?? 25;
    const hum = humiditySnapshots[idx]?.[i]?.[j] ?? 60;
    const pres = pressureSnapshots[idx]?.[i]?.[j] ?? 1012;
    return { h, idx, temp, fc: classifyWeather({ temp, humidity: hum, pressure: pres, windSpeed }) };
  });

  const activeH = cards.reduce(
    (best, c) => (Math.abs(c.h * 3600 - currentSec) < Math.abs(best * 3600 - currentSec) ? c.h : best),
    0
  );

  return (
    <section aria-label="Pronóstico de 24 horas">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-xl font-semibold text-ink">Pronóstico de 24 horas</h2>
        <span className="text-xs text-mute">Toca una hora para saltar a ese momento</span>
      </div>

      <ul className="-mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-6 pt-1 lg:grid lg:grid-cols-9 lg:overflow-visible">
        {cards.map(({ h, idx, temp, fc }) => {
          const active = h === activeH;
          return (
            <li key={h} className="min-w-[92px] flex-1 snap-start">
              <button
                type="button"
                onClick={() => onSeek && onSeek(idx)}
                aria-pressed={active}
                aria-label={`${String(h).padStart(2, '0')}:00, ${temp.toFixed(0)} grados, lluvia ${fc.rainProb}%`}
                className={`flex w-full flex-col items-center gap-2 rounded-clay-sm px-2 py-4 transition-transform duration-150 hover:-translate-y-0.5 ${
                  active ? 'clay-active' : 'clay-sm text-ink'
                }`}
              >
                <span className={`text-sm font-semibold tabular-nums ${active ? 'text-white' : 'text-mute'}`}>
                  {String(h).padStart(2, '0')}:00
                </span>
                <WeatherIcon condition={fc.condition} className="h-7 w-7" onDark={active} />
                <span className="font-display text-2xl font-bold tabular-nums">{temp.toFixed(0)}°</span>
                <span className={`flex items-center gap-1 text-xs tabular-nums ${active ? 'text-white/90' : 'text-mute'}`}>
                  <Droplets className="h-3 w-3" aria-hidden="true" />
                  {fc.rainProb}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
