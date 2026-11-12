import React from 'react';
import { ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

/** Estado del esquema numérico: criterio C + 4r ≤ 1 con margen visual. */
export default function StabilityBadge({ stability, onAutoFitDt }) {
  if (!stability) return null;

  const { is_stable, combined_factor, dt_max, dt, cfl, r } = stability;
  const fill = Math.min(100, (combined_factor / 1.0) * 100);
  const tone = is_stable ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand';

  return (
    <section className="clay p-5 sm:p-6" aria-label="Estabilidad numérica">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`icon-chip ${tone}`}>
            {is_stable ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          </span>
          <div>
            <h2 className="text-xl font-semibold text-ink">{is_stable ? 'Esquema estable' : 'Esquema inestable'}</h2>
            <p className="text-xs text-mute">
              {is_stable ? 'El paso de tiempo respeta el criterio CFL.' : 'El paso de tiempo es demasiado grande.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="text-mute">C + 4r</span>
          <span className={`font-mono text-sm font-semibold tabular-nums ${tone}`}>{combined_factor.toFixed(2)} / 1.00</span>
        </div>
        <div className="clay-well h-3.5 !rounded-full p-[3px]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.max(4, fill)}%`,
              background: is_stable
                ? 'linear-gradient(90deg, #34d399, #10b981)'
                : 'linear-gradient(90deg, #ff6b35, #dc143c)',
            }}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        {[
          ['Courant (CFL)', cfl.toFixed(2)],
          ['Fourier (r)', r.toFixed(3)],
          ['Δt actual', `${Math.round(dt / 60)} min`],
          ['Δt máximo', isFinite(dt_max) ? `${(dt_max / 60).toFixed(1)} min` : '∞'],
        ].map(([label, value]) => (
          <div key={label} className="clay-well px-3 py-2.5">
            <dt className="text-xs text-mute">{label}</dt>
            <dd className="font-mono text-sm font-semibold tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {!is_stable && onAutoFitDt && (
        <button type="button" onClick={onAutoFitDt} className="btn-primary mt-5 w-full">
          <Zap className="h-4 w-4" />
          Ajustar Δt a {Math.floor(dt_max)} s
        </button>
      )}
    </section>
  );
}
