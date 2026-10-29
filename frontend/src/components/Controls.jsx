import React, { useState } from 'react';
import { Sliders, Wind, Flame, Grid3X3, Server, Laptop, Globe, Satellite, Sparkles, RefreshCw } from 'lucide-react';
import { REAL_REGIONS } from '../services/realWeather';

const PRESETS = [
  {
    id: 'base',
    name: 'Caso Base',
    desc: 'Condiciones estándar estables (10 min, 5 m/s)',
    params: { dt: 600, u: 5, v: 0, alpha: 5000, ny: 40, nx: 40 },
  },
  {
    id: 'front',
    name: 'Frente Frío',
    desc: 'Viento fuerte diagonal (15 m/s Este, 10 m/s Norte)',
    params: { dt: 300, u: 15, v: 10, alpha: 5000, ny: 40, nx: 40 },
  },
  {
    id: 'diffusion',
    name: 'Difusión Pura',
    desc: 'Sin viento, disipación isotrópica',
    params: { dt: 600, u: 0, v: 0, alpha: 12000, ny: 40, nx: 40 },
  },
  {
    id: 'limit',
    name: 'Límite Estable',
    desc: 'Casi en el umbral C+4r ≈ 0.95',
    params: { dt: 1300, u: 5, v: 0, alpha: 5000, ny: 40, nx: 40 },
  },
  {
    id: 'unstable',
    name: 'Inestable (Demo Divergencia)',
    desc: 'Δt = 1 h (3600 s), CFL violado: divergencia garantizada',
    params: { dt: 3600, u: 5, v: 0, alpha: 5000, ny: 40, nx: 40 },
  },
];

export default function Controls({
  params,
  onChangeParam,
  onApplyPreset,
  backendOnline,
  useBackend,
  onToggleUseBackend,
  showGrid,
  onToggleGrid,
  showWind,
  onToggleWind,
  onRunSimulation,
  isCalculating,
  onLoadRealWeather,
  isLoadingRealWeather,
  realWeatherInfo,
  onClearRealWeather,
}) {
  const [selectedRegion, setSelectedRegion] = useState('llanos');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md space-y-4">
      {/* Selector de modo Backend vs Local */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-amber-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Configuración Física</h3>
        </div>

        <button
          onClick={onToggleUseBackend}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
            useBackend
              ? backendOnline
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300'
              : 'border-sky-500/40 bg-sky-950/40 text-sky-300'
          }`}
          title="Alternar entre servidor FastAPI o motor local en el navegador"
        >
          {useBackend ? <Server className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />}
          <span>{useBackend ? (backendOnline ? 'API FastAPI' : 'API Desconectada') : 'Motor Local'}</span>
        </button>
      </div>

      {/* SECCIÓN DESTACADA: CLIMA REAL EN VIVO (OPEN-METEO) */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Satellite className="h-4 w-4" />
            <span>Datos Reales en Vivo (Open-Meteo)</span>
          </div>
          {realWeatherInfo && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Conectado
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Alimenta la malla con mediciones satelitales en tiempo real de temperatura y viento de estaciones oficiales:
        </p>

        <div className="flex flex-col gap-2">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-400 focus:outline-none font-mono"
          >
            {REAL_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => onLoadRealWeather && onLoadRealWeather(selectedRegion)}
              disabled={isLoadingRealWeather}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 text-xs transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Globe className="h-3.5 w-3.5" />
              {isLoadingRealWeather ? 'Descargando mediciones...' : 'Cargar Clima Real en Vivo'}
            </button>

            {realWeatherInfo && (
              <button
                onClick={onClearRealWeather}
                className="px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition"
                title="Volver a simulación sintética"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Resumen de estaciones conectadas */}
        {realWeatherInfo && realWeatherInfo.stations && (
          <div className="border-t border-emerald-500/20 pt-2 space-y-1">
            <span className="block text-[10px] font-mono text-slate-400 uppercase">
              Estaciones reales en la malla:
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300">
              {realWeatherInfo.stations.map((st) => (
                <div key={st.name} className="truncate bg-slate-900/60 p-1 rounded border border-slate-800">
                  <span className="text-slate-400">{st.name.split(' ')[0]}:</span>{' '}
                  <span className="font-bold text-amber-300">{st.weather.temp.toFixed(1)}°C</span>{' '}
                  <span className="text-sky-300">({st.weather.humidity}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Escenarios preestablecidos sintéticos */}
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>O prueba estos escenarios didácticos:</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.params)}
              className={`rounded-lg border border-slate-800 bg-slate-800/60 p-2 text-left text-xs transition hover:border-amber-500/50 hover:bg-slate-800 ${
                preset.id === 'unstable' ? 'hover:border-rose-500/60' : ''
              }`}
            >
              <span className="block font-semibold text-slate-200">{preset.name}</span>
              <span className="block text-[10px] text-slate-400 truncate">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Parámetros de la malla */}
      <div className="space-y-3 border-t border-slate-800 pt-3">
        {/* Tamaño de malla */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Grid3X3 className="h-3.5 w-3.5 text-sky-400" /> Resolución de Malla
            </span>
            <span className="text-amber-400 font-bold">
              {params.ny} × {params.nx} ({params.ny * params.nx} nodos)
            </span>
          </div>
          <div className="flex gap-2">
            {[25, 40, 50, 75].map((size) => (
              <button
                key={size}
                onClick={() => {
                  onChangeParam('ny', size);
                  onChangeParam('nx', size);
                }}
                className={`flex-1 rounded border py-1 text-xs font-mono transition ${
                  params.ny === size
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>

        {/* Paso de tiempo dt */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">Paso de tiempo Δt:</span>
            <span className="text-amber-400 font-bold">
              {params.dt} s ({Math.round(params.dt / 60)} min)
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={3600}
            step={30}
            value={params.dt}
            onChange={(e) => onChangeParam('dt', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Viento u (Este-Oeste) */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Wind className="h-3.5 w-3.5 text-sky-400" /> Viento u (Este-Oeste):
            </span>
            <span className="text-sky-300 font-bold">{params.u} m/s</span>
          </div>
          <input
            type="range"
            min={-25}
            max={25}
            step={1}
            value={params.u}
            onChange={(e) => onChangeParam('u', Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Viento v (Norte-Sur) */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Wind className="h-3.5 w-3.5 text-sky-400" /> Viento v (Norte-Sur):
            </span>
            <span className="text-sky-300 font-bold">{params.v} m/s</span>
          </div>
          <input
            type="range"
            min={-25}
            max={25}
            step={1}
            value={params.v}
            onChange={(e) => onChangeParam('v', Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Difusividad alpha */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-500" /> Difusividad térmica α:
            </span>
            <span className="text-amber-300 font-bold">
              {params.alpha.toLocaleString('es-CO')} m²/s
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={25000}
            step={500}
            value={params.alpha}
            onChange={(e) => onChangeParam('alpha', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Opciones de visualización */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-mono">
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => onToggleGrid(e.target.checked)}
            className="rounded accent-amber-500"
          />
          Mostrar malla
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={showWind}
            onChange={(e) => onToggleWind(e.target.checked)}
            className="rounded accent-sky-500"
          />
          Vectores de viento
        </label>
      </div>

      {/* Botón de recalcular simulación */}
      <button
        onClick={onRunSimulation}
        disabled={isCalculating}
        className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
      >
        {isCalculating ? 'Calculando pronóstico...' : 'Recalcular Pronóstico 24 h'}
      </button>
    </div>
  );
}
