import React, { useState } from 'react';
import { Wind, Flame, Grid3X3, Server, Laptop, Globe, Satellite, Sparkles, RefreshCw, Gauge } from 'lucide-react';
import { REAL_REGIONS } from '../services/realWeather';

const PRESETS = [
  { id: 'base', name: 'Caso base', desc: 'Condiciones estables (10 min, 5 m/s)', params: { dt: 600, u: 5, v: 0, alpha: 5000, ny: 40, nx: 40 } },
  { id: 'front', name: 'Frente frío', desc: 'Viento fuerte diagonal (15 m/s E, 10 m/s N)', params: { dt: 300, u: 15, v: 10, alpha: 5000, ny: 40, nx: 40 } },
  { id: 'diffusion', name: 'Difusión pura', desc: 'Sin viento, el calor se reparte parejo', params: { dt: 600, u: 0, v: 0, alpha: 12000, ny: 40, nx: 40 } },
  { id: 'limit', name: 'Límite estable', desc: 'Casi en el umbral C+4r ≈ 0.95', params: { dt: 1300, u: 5, v: 0, alpha: 5000, ny: 40, nx: 40 } },
  { id: 'unstable', name: 'Inestable (demo)', desc: 'Δt = 1 h: el CFL se viola y la solución diverge', params: { dt: 3600, u: 5, v: 0, alpha: 5000, ny: 40, nx: 40 }, danger: true },
];

function Slider({ icon: Icon, label, value, display, min, max, step, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-ink">
          {Icon && <Icon className="h-4 w-4 text-brand" aria-hidden="true" />}
          {label}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-brand">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="clay-range"
        style={{ '--fill': `${pct}%` }}
        aria-label={label}
      />
    </div>
  );
}

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

  const engineLabel = useBackend ? (backendOnline ? 'API FastAPI' : 'API desconectada') : 'Motor local';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute">Ajusta la física de la malla y recalcula el pronóstico.</p>
        <button
          type="button"
          onClick={onToggleUseBackend}
          className="btn-soft"
          title="Alternar entre el servidor FastAPI y el motor local del navegador"
        >
          {useBackend ? <Server className="h-4 w-4 text-brand" /> : <Laptop className="h-4 w-4 text-brand" />}
          {engineLabel}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Columna izquierda: datos reales y escenarios */}
        <div className="space-y-6">
          <div className="clay-well space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
                <span className="icon-chip !h-9 !w-9">
                  <Satellite className="h-4 w-4" />
                </span>
                Datos reales en vivo
              </span>
              {realWeatherInfo && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="live-dot" aria-hidden="true" />
                  Conectado
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-mute">
              Alimenta la malla con temperatura y viento medidos por estaciones oficiales (Open-Meteo).
            </p>

            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="field" aria-label="Región">
              {REAL_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onLoadRealWeather && onLoadRealWeather(selectedRegion)}
                disabled={isLoadingRealWeather}
                className="btn-primary flex-1"
              >
                <Globe className="h-4 w-4" />
                {isLoadingRealWeather ? 'Descargando…' : 'Cargar clima real'}
              </button>
              {realWeatherInfo && (
                <button type="button" onClick={onClearRealWeather} className="btn-soft !px-3" title="Volver a la simulación didáctica" aria-label="Volver a la simulación didáctica">
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>

            {realWeatherInfo && realWeatherInfo.stations && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {realWeatherInfo.stations.map((st) => (
                  <div key={st.name} className="clay-sm px-3 py-2 text-xs">
                    <p className="truncate text-mute">{st.name.split(' ')[0]}</p>
                    <p className="font-semibold tabular-nums text-ink">
                      {st.weather.temp.toFixed(1)} °C <span className="font-normal text-mute">· {st.weather.humidity}%</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
              <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
              O prueba un escenario didáctico
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset.params)}
                  className="btn-soft !flex-col !items-start !gap-0.5 !rounded-clay-sm !p-3.5 text-left"
                >
                  <span className={`text-sm font-semibold ${preset.danger ? 'text-brand' : 'text-ink'}`}>{preset.name}</span>
                  <span className="text-xs font-normal leading-snug text-mute">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: parámetros */}
        <div className="space-y-6">
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink">
                <Grid3X3 className="h-4 w-4 text-brand" aria-hidden="true" />
                Resolución de la malla
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums text-brand">
                {params.ny}×{params.nx} · {params.ny * params.nx} nodos
              </span>
            </div>
            <div className="seg w-full" role="group" aria-label="Resolución de la malla">
              {[25, 40, 50, 75].map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={params.ny === size}
                  onClick={() => {
                    onChangeParam('ny', size);
                    onChangeParam('nx', size);
                  }}
                  className="seg-item flex-1 justify-center font-mono"
                >
                  {size}²
                </button>
              ))}
            </div>
          </div>

          <Slider icon={Gauge} label="Paso de tiempo Δt" value={params.dt} display={`${params.dt} s (${Math.round(params.dt / 60)} min)`} min={30} max={3600} step={30} onChange={(v) => onChangeParam('dt', v)} />
          <Slider icon={Wind} label="Viento u (Este–Oeste)" value={params.u} display={`${params.u} m/s`} min={-25} max={25} step={1} onChange={(v) => onChangeParam('u', v)} />
          <Slider icon={Wind} label="Viento v (Norte–Sur)" value={params.v} display={`${params.v} m/s`} min={-25} max={25} step={1} onChange={(v) => onChangeParam('v', v)} />
          <Slider icon={Flame} label="Difusividad térmica α" value={params.alpha} display={`${params.alpha.toLocaleString('es-CO')} m²/s`} min={0} max={25000} step={500} onChange={(v) => onChangeParam('alpha', v)} />

          <div className="clay-well flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm text-ink">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={showGrid} onChange={(e) => onToggleGrid(e.target.checked)} className="h-4 w-4 accent-llanos-red" />
              Mostrar malla
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={showWind} onChange={(e) => onToggleWind(e.target.checked)} className="h-4 w-4 accent-llanos-red" />
              Vectores de viento
            </label>
          </div>

          <button type="button" onClick={onRunSimulation} disabled={isCalculating} className="btn-primary w-full !py-3.5">
            {isCalculating ? 'Calculando pronóstico…' : 'Recalcular pronóstico de 24 h'}
          </button>
        </div>
      </div>
    </div>
  );
}
