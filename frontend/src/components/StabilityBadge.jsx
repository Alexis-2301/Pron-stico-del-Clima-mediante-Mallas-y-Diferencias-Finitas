import React from 'react';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

export default function StabilityBadge({ stability, onAutoFitDt }) {
  if (!stability) return null;

  const { is_stable, combined_factor, dt_max, dt, cfl, r } = stability;

  return (
    <div
      className={`rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all ${
        is_stable
          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
          : 'border-rose-500/40 bg-rose-950/30 text-rose-200 animate-pulse'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {is_stable ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          )}
          <span className="font-bold tracking-wide uppercase text-sm">
            {is_stable ? 'Esquema Estable' : 'Esquema Inestable'}
          </span>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
            is_stable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}
        >
          C + 4r = {combined_factor.toFixed(2)} ≤ 1.0
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
        <div>
          <span className="text-slate-400">Courant (CFL):</span>{' '}
          <span className="font-semibold text-slate-100">{cfl.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-400">Fourier (r):</span>{' '}
          <span className="font-semibold text-slate-100">{r.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-slate-400">Δt actual:</span>{' '}
          <span className="font-semibold text-slate-100">{dt} s ({Math.round(dt / 60)} min)</span>
        </div>
        <div>
          <span className="text-slate-400">Δt máx. permitido:</span>{' '}
          <span className="font-semibold text-amber-300">
            {isFinite(dt_max) ? `${Math.floor(dt_max)} s (${(dt_max / 60).toFixed(1)} min)` : '∞'}
          </span>
        </div>
      </div>

      {!is_stable && onAutoFitDt && (
        <button
          onClick={onAutoFitDt}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold py-1.5 px-3 text-xs transition"
        >
          <Zap className="h-4 w-4" />
          Ajustar automáticamente a Δt estable ({Math.floor(dt_max)} s)
        </button>
      )}
    </div>
  );
}
