import React, { useEffect, useMemo, useRef, useState } from 'react';
import { classifyWeather } from '../services/weatherClassifier';
import { HOURS, closestIndex } from './HourlyStrip';

const TABS = [
  { id: 'temp', label: 'Temperatura', unit: '°', fmt: (v) => v.toFixed(0) },
  { id: 'hum', label: 'Humedad', unit: '%', fmt: (v) => v.toFixed(0) },
  { id: 'pres', label: 'Presión', unit: '', fmt: (v) => v.toFixed(0) },
];

const MIN_H = 270;
const PAD_X = 30;
const TOP = 46;

/** Curva de área del nodo seleccionado, con probabilidad de lluvia por hora. */
export default function ForecastChart({
  snapshots = [],
  humiditySnapshots = [],
  pressureSnapshots = [],
  timestamps = [],
  selectedNode = { i: 20, j: 20 },
  windSpeed = 5,
  currentStep = 0,
  onSeek,
}) {
  const [tab, setTab] = useState('temp');
  const [width, setWidth] = useState(640);
  const [H, setH] = useState(MIN_H);
  const wrapRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(300, Math.round(entry.contentRect.width)));
      setH(Math.max(MIN_H, Math.round(entry.contentRect.height)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { i, j } = selectedNode;
  const total = timestamps.length ? timestamps[timestamps.length - 1] || 1 : 1;
  const drawW = width - PAD_X * 2;
  const activeTab = TABS.find((t) => t.id === tab);
  const BOTTOM = H - 76;
  const marks = width < 520 ? [0, 6, 12, 18, 24] : HOURS; // en pantallas angostas, menos marcas

  const values = useMemo(() => {
    const src = tab === 'temp' ? snapshots : tab === 'hum' ? humiditySnapshots : pressureSnapshots;
    return (src || []).map((m) => {
      const v = m?.[i]?.[j];
      return typeof v === 'number' && Number.isFinite(v) ? v : null;
    });
  }, [tab, snapshots, humiditySnapshots, pressureSnapshots, i, j]);

  const valid = values.filter((v) => v !== null);
  const hasData = valid.length > 1 && timestamps.length === values.length;

  let body = (
    <p className="py-16 text-center text-sm text-mute">Calcula el pronóstico para ver la curva de este nodo.</p>
  );

  if (hasData) {
    const lo = Math.min(...valid);
    const hi = Math.max(...valid);
    const span = hi - lo || 1;
    const pad = span * 0.18;
    const xAt = (k) => PAD_X + (timestamps[k] / total) * drawW;
    const yAt = (v) => BOTTOM - ((v - lo + pad) / (span + pad * 2)) * (BOTTOM - TOP);

    const pts = values.map((v, k) => (v === null ? null : [xAt(k), yAt(v)])).filter(Boolean);
    const line = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${BOTTOM} L${pts[0][0].toFixed(1)} ${BOTTOM} Z`;

    const cur = Math.min(currentStep, values.length - 1);
    const curV = values[cur];
    const cx = xAt(cur);
    const cy = curV === null ? BOTTOM : yAt(curV);

    const seekFromPointer = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left - PAD_X) / drawW));
      onSeek && onSeek(closestIndex(timestamps, frac * total));
    };

    body = (
      <div>
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label={`Curva de ${activeTab.label.toLowerCase()} del nodo ${i}, ${j}: mínimo ${lo.toFixed(1)}, máximo ${hi.toFixed(1)}`}
          className="absolute left-0 top-0 block touch-none select-none"
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'rgb(var(--red))', stopOpacity: 0.42 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(var(--accent))', stopOpacity: 0.02 }} />
            </linearGradient>
            <linearGradient id="line-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" style={{ stopColor: 'rgb(var(--red))' }} />
              <stop offset="100%" style={{ stopColor: 'rgb(var(--accent))' }} />
            </linearGradient>
          </defs>

          <path d={area} fill="url(#area-fill)" />
          <path d={line} fill="none" stroke="url(#line-stroke)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Valores en horas clave */}
          {marks.map((h) => {
            const k = closestIndex(timestamps, h * 3600);
            const v = values[k];
            if (v === null) return null;
            const x = xAt(k);
            if (Math.abs(x - cx) < 34) return null;
            return (
              <text key={`v${h}`} x={x} y={yAt(v) - 12} textAnchor="middle" className="fill-ink text-[12px] font-semibold tabular-nums">
                {activeTab.fmt(v)}
                {activeTab.unit}
              </text>
            );
          })}

          {/* Línea del momento actual */}
          <line x1={cx} x2={cx} y1={TOP - 14} y2={BOTTOM} className="stroke-llanos-red" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.7" />
          {curV !== null && (
            <>
              <circle cx={cx} cy={cy} r="7" className="fill-white stroke-llanos-red" strokeWidth="3.5" />
              <rect x={cx - 27} y={cy - 40} width="54" height="24" rx="12" className="fill-llanos-red" />
              <text x={cx} y={cy - 24} textAnchor="middle" className="fill-white text-[12px] font-bold tabular-nums">
                {activeTab.fmt(curV)}
                {activeTab.unit}
              </text>
            </>
          )}

          {/* Fila de lluvia y horas */}
          {marks.map((h) => {
            const k = closestIndex(timestamps, h * 3600);
            const x = xAt(k);
            const fc = classifyWeather({
              temp: snapshots[k]?.[i]?.[j] ?? 25,
              humidity: humiditySnapshots[k]?.[i]?.[j] ?? 60,
              pressure: pressureSnapshots[k]?.[i]?.[j] ?? 1012,
              windSpeed,
            });
            const anchor = h === 0 ? 'start' : h === 24 ? 'end' : 'middle';
            const left = anchor === 'start' ? x : anchor === 'end' ? x - 38 : x - 19;
            return (
              <g key={`r${h}`}>
                <path
                  transform={`translate(${left + 4.5} ${H - 45})`}
                  d="M0 -6 C2.5 -2.5 4.5 -0.5 4.5 2 A4.5 4.5 0 0 1 -4.5 2 C-4.5 -0.5 -2.5 -2.5 0 -6 Z"
                  className="fill-sky-500"
                />
                <text x={left + 13} y={H - 41} className="fill-mute text-[11px] tabular-nums">
                  {fc.rainProb}%
                </text>
                <text x={x} y={H - 12} textAnchor={anchor} className="fill-mute text-[12px] font-medium tabular-nums">
                  {String(h).padStart(2, '0')}:00
                </text>
              </g>
            );
          })}

          {/* Zona interactiva: clic o arrastre para viajar en el tiempo */}
          <rect
            x="0"
            y="0"
            width={width}
            height={H}
            fill="transparent"
            style={{ cursor: 'ew-resize' }}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              seekFromPointer(e);
            }}
            onPointerMove={(e) => dragging.current && seekFromPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          />
        </svg>
      </div>
    );
  }

  return (
    <section className="clay flex h-full flex-col p-5 sm:p-6" aria-label="Evolución del nodo en 24 horas">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Evolución en 24 horas</h2>
          <p className="text-xs text-mute">
            Nodo [{i}, {j}] · arrastra sobre la curva para moverte en el tiempo
          </p>
        </div>
        <div className="seg" role="group" aria-label="Variable a graficar">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="seg-item" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={wrapRef} className="clay-well relative min-h-[270px] flex-1 px-1">
        {body}
      </div>
    </section>
  );
}
