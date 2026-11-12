import React from 'react';
import { Umbrella, Wind, Thermometer, Droplets } from 'lucide-react';
import { classifyWeather } from '../services/weatherClassifier';

/** Consejos prácticos derivados de la condición actual en el nodo. */
export default function Suggestions({ temp = 25, humidity = 60, pressure = 1012, windSpeed = 5 }) {
  const fc = classifyWeather({ temp, humidity, pressure, windSpeed });

  const umbrella = fc.rainProb >= 55 ? 'Llévalo' : fc.rainProb >= 25 ? 'Por si acaso' : 'No hace falta';
  const outdoor =
    fc.condition === 'storm' ? 'Evítalo' : fc.condition === 'rain' ? 'Mejor bajo techo' : temp >= 32 ? 'Con precaución' : 'Buen momento';
  const clothes = temp >= 30 ? 'Ligera y fresca' : temp >= 20 ? 'Cómoda' : 'Abrígate';
  const hydration = temp >= 30 ? 'Bebe más agua' : humidity >= 80 ? 'Ambiente húmedo' : 'Normal';

  const tiles = [
    { Icon: Umbrella, title: 'Paraguas', value: umbrella },
    { Icon: Wind, title: 'Al aire libre', value: outdoor },
    { Icon: Thermometer, title: 'Ropa', value: clothes },
    { Icon: Droplets, title: 'Hidratación', value: hydration },
  ];

  return (
    <section className="clay p-5 sm:p-6" aria-label="Sugerencias para tu día">
      <h2 className="mb-4 text-xl font-semibold text-ink">Sugerencias para tu día</h2>
      <ul className="grid grid-cols-2 gap-3">
        {tiles.map(({ Icon, title, value }) => (
          <li key={title} className="clay-well flex items-center gap-3 p-3">
            <span className="icon-chip">
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs leading-snug text-mute">{value}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-mute">{fc.advice}</p>
    </section>
  );
}
