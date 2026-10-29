import React from 'react';
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Umbrella,
  Compass,
} from 'lucide-react';
import { classifyWeather } from '../services/weatherClassifier';

function getWeatherIcon(condition, className = 'h-8 w-8') {
  switch (condition) {
    case 'sunny':
      return <Sun className={`${className} text-amber-400 animate-spin-slow`} />;
    case 'storm':
      return <CloudLightning className={`${className} text-purple-400 animate-pulse`} />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-400 animate-bounce-subtle`} />;
    case 'windy':
      return <Wind className={`${className} text-cyan-400`} />;
    case 'cold':
      return <Thermometer className={`${className} text-indigo-400`} />;
    case 'partly_cloudy':
    default:
      return <CloudSun className={`${className} text-amber-300`} />;
  }
}

export default function WeatherForecastCard({
  temp,
  humidity = 60,
  pressure = 1012,
  windSpeed = 5,
  currentTimeSec = 0,
  onJumpToTime,
  snapshots = [],
  humiditySnapshots = [],
  pressureSnapshots = [],
  timestamps = [],
  selectedNode = { i: 20, j: 20 },
}) {
  const currentForecast = classifyWeather({
    temp: temp ?? 25,
    humidity,
    pressure,
    windSpeed,
  });

  const hours = Math.floor(currentTimeSec / 3600);
  const minutes = Math.floor((currentTimeSec % 3600) / 60);
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Horas clave del día para la tira horaria
  const keyHours = [
    { label: '06:00 AM', sec: 21600 },
    { label: '10:00 AM', sec: 36000 },
    { label: '02:00 PM', sec: 50400 },
    { label: '06:00 PM', sec: 64800 },
    { label: '10:00 PM', sec: 79200 },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Cabecera con Reloj y Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Pronóstico en Vivo · Hora Simulada {timeFormatted}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Ubicación: Nodo [{selectedNode.i}, {selectedNode.j}]
        </span>
      </div>

      {/* Tarjeta Principal del Clima (Diseño Tipo App Móvil) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            {getWeatherIcon(currentForecast.condition, 'h-12 w-12')}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {temp ? temp.toFixed(1) : '—'} °C
              </span>
              <span className="text-xs font-mono text-slate-400">
                Sensación: {currentForecast.feelLike} °C
              </span>
            </div>
            <h2 className="text-base font-bold text-amber-300 mt-0.5">{currentForecast.title}</h2>
          </div>
        </div>

        {/* Probabilidad de Lluvia Destacada */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Umbrella className="h-4 w-4 text-sky-400" />
            <span>Prob. de Lluvia:</span>
          </div>
          <span
            className={`text-2xl font-black font-mono ${
              currentForecast.rainProb >= 65 ? 'text-sky-400' : 'text-slate-200'
            }`}
          >
            {currentForecast.rainProb}%
          </span>
        </div>
      </div>

      {/* Resumen en Lenguaje Cotidiano y Recomendación */}
      <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/70 text-xs space-y-1.5">
        <p className="text-slate-200 leading-relaxed font-medium">
          {currentForecast.summary}
        </p>
        <p className="text-amber-400/90 font-mono text-[11px] flex items-center gap-1.5">
          <span>💡</span>
          <span>{currentForecast.advice}</span>
        </p>
      </div>

      {/* Grid de Métricas Atmosféricas Físicas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 p-2.5">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-1">
            <Droplets className="h-3.5 w-3.5 text-sky-400" /> Humedad
          </span>
          <span className="text-sm font-bold text-slate-100">{currentForecast.humidity}%</span>
        </div>

        <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 p-2.5">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-1">
            <Wind className="h-3.5 w-3.5 text-cyan-400" /> Viento
          </span>
          <span className="text-sm font-bold text-slate-100">{currentForecast.windKmh} km/h</span>
        </div>

        <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 p-2.5">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-1">
            <Gauge className="h-3.5 w-3.5 text-emerald-400" /> Presión
          </span>
          <span className="text-sm font-bold text-slate-100">{currentForecast.pressure} hPa</span>
        </div>

        <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 p-2.5">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mb-1">
            <Compass className="h-3.5 w-3.5 text-amber-400" /> Estado
          </span>
          <span className="text-sm font-bold text-amber-300 capitalize">{currentForecast.condition.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Tira Horaria con Horas Clave para saltar con un clic */}
      <div className="border-t border-slate-800/80 pt-3">
        <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
          Pronóstico por Horas del Día (Clic para viajar en el tiempo)
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {keyHours.map((kh) => {
            // Encontrar el índice de instantánea más cercano a esa hora
            let closestIdx = 0;
            if (timestamps && timestamps.length) {
              closestIdx = timestamps.reduce((prev, curr, idx) =>
                Math.abs(curr - kh.sec) < Math.abs(timestamps[prev] - kh.sec) ? idx : prev, 0);
            }

            const hTemp = snapshots[closestIdx]?.[selectedNode.i]?.[selectedNode.j] ?? 25;
            const hHum = humiditySnapshots[closestIdx]?.[selectedNode.i]?.[selectedNode.j] ?? 60;
            const hPres = pressureSnapshots[closestIdx]?.[selectedNode.i]?.[selectedNode.j] ?? 1012;
            const hFc = classifyWeather({ temp: hTemp, humidity: hHum, pressure: hPres, windSpeed });

            const isCurrent = Math.abs(currentTimeSec - kh.sec) < 3600;

            return (
              <button
                key={kh.label}
                onClick={() => onJumpToTime && onJumpToTime(closestIdx)}
                className={`rounded-xl border p-2 text-center transition flex flex-col items-center gap-1 ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-md'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono">{kh.label}</span>
                {getWeatherIcon(hFc.condition, 'h-5 w-5')}
                <span className="text-xs font-bold font-mono text-slate-100">{hTemp.toFixed(0)}°</span>
                <span className="text-[9px] font-mono text-sky-400">{hFc.rainProb}% lluvia</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
