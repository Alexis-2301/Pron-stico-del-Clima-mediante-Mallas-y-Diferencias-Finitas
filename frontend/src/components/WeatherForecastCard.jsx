import React from 'react';
import { Droplets, Wind, Gauge, Umbrella } from 'lucide-react';
import { classifyWeather } from '../services/weatherClassifier';
import WeatherIcon from './WeatherIcon';

const heroTone = (condition) => {
  if (condition === 'storm' || condition === 'rain') return 'hero-storm';
  if (condition === 'cold' || condition === 'windy') return 'hero-calm';
  return 'hero-warm';
};

/** Tarjeta principal: el tiempo actual en el nodo seleccionado. */
export default function WeatherForecastCard({
  temp,
  humidity = 60,
  pressure = 1012,
  windSpeed = 5,
  currentTimeSec = 0,
  selectedNode = { i: 20, j: 20 },
}) {
  const hasTemp = typeof temp === 'number' && Number.isFinite(temp);
  const forecast = classifyWeather({ temp: hasTemp ? temp : 25, humidity, pressure, windSpeed });

  const hh = String(Math.floor(currentTimeSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((currentTimeSec % 3600) / 60)).padStart(2, '0');
  const [whole, decimal] = (hasTemp ? temp.toFixed(1) : '--.-').split('.');

  const metrics = [
    { label: 'Humedad', value: `${forecast.humidity}%`, Icon: Droplets },
    { label: 'Viento', value: `${forecast.windKmh} km/h`, Icon: Wind },
    { label: 'Presión', value: `${forecast.pressure} hPa`, Icon: Gauge },
    { label: 'Prob. de lluvia', value: `${forecast.rainProb}%`, Icon: Umbrella },
  ];

  return (
    <article className={`hero ${heroTone(forecast.condition)} flex h-full flex-col justify-between gap-7 p-6 sm:p-7`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="hero-chip">
          <span className="live-dot" aria-hidden="true" />
          Hora simulada {hh}:{mm}
        </span>
        <span className="hero-chip">
          Nodo [{selectedNode.i}, {selectedNode.j}]
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="icon-bubble">
          <WeatherIcon condition={forecast.condition} className="h-12 w-12" onDark animated />
        </div>
        <div className="flex items-start font-display font-bold leading-none tracking-tight" aria-label={`${hasTemp ? temp.toFixed(1) : 'sin dato'} grados Celsius`}>
          <span className="text-7xl tabular-nums sm:text-8xl">{whole}</span>
          <span className="mt-2 text-3xl tabular-nums sm:mt-3 sm:text-4xl">.{decimal}°C</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold sm:text-3xl">{forecast.title}</h2>
        <p className="text-sm font-medium text-white/85">Sensación térmica {Math.round(forecast.feelLike)} °C</p>
        <p className="max-w-lg text-sm leading-relaxed text-white/90">{forecast.summary}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {metrics.map(({ label, value, Icon }) => (
          <div key={label} className="hero-metric">
            <dt className="flex items-center gap-1.5 text-xs text-white/80">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
