/**
 * Motor numérico en JavaScript puro para ejecución local / offline en el navegador.
 * Implementa exactamente el mismo algoritmo FTCS + Upwind del backend.
 */

export function calculateDtMax(alpha, u, v, dx) {
  const uMax = Math.abs(u);
  const vMax = Math.abs(v);
  const denom = (4.0 * alpha) / (dx * dx) + (uMax + vMax) / dx;
  return denom > 0 ? 1.0 / denom : Infinity;
}

export function checkLocalStability(alpha, u, v, dx, dt) {
  const dtMax = calculateDtMax(alpha, u, v, dx);
  const r = (alpha * dt) / (dx * dx);
  const cx = (Math.abs(u) * dt) / dx;
  const cy = (Math.abs(v) * dt) / dx;
  const cfl = cx + cy;
  const combined = 4.0 * r + cfl;
  const isStable = combined <= 1.0000001;

  return {
    is_stable: isStable,
    dt,
    dt_max: dtMax,
    r,
    cx,
    cy,
    cfl,
    combined_factor: combined,
    message: isStable
      ? `Estable: C+4r = ${combined.toFixed(3)} ≤ 1.0 (Δt ≤ ${Math.round(dtMax)} s)`
      : `Inestable: C+4r = ${combined.toFixed(3)} > 1.0 (excede Δt_max = ${Math.round(dtMax)} s)`,
  };
}

export function simulateLocal(params) {
  const {
    ny = 40,
    nx = 40,
    dx = 10000,
    alpha = 5000,
    u = 5,
    v = 0,
    dt = 600,
    total_time = 86400,
    save_interval = 600,
    base_temp = 20,
    hot_spot_temp = 35,
    hot_spot_sigma = 4,
    boundary_type = 'dirichlet',
  } = params;

  const tStart = performance.now();
  const stability = checkLocalStability(alpha, u, v, dx, dt);

  // Crear matriz inicial con foco gaussiano
  const ci = Math.floor(ny / 2);
  const cj = Math.floor(nx / 2);
  let T = new Float64Array(ny * nx);
  const deltaT = hot_spot_temp - base_temp;

  for (let i = 0; i < ny; i++) {
    for (let j = 0; j < nx; j++) {
      const distSq = (i - ci) ** 2 + (j - cj) ** 2;
      const g = deltaT * Math.exp(-distSq / (2 * hot_spot_sigma * hot_spot_sigma));
      T[i * nx + j] = base_temp + g;
    }
  }

  // Guardar bordes Dirichlet originales
  const fixed = new Float64Array(T);

  const snapshots = [];
  const timestamps = [];

  function captureSnapshot(timeSec) {
    const matrix = [];
    for (let i = 0; i < ny; i++) {
      const row = [];
      for (let j = 0; j < nx; j++) {
        row.push(T[i * nx + j]);
      }
      matrix.push(row);
    }
    snapshots.push(matrix);
    timestamps.push(timeSec);
  }

  captureSnapshot(0);

  let currentTime = 0;
  let nextSave = save_interval;
  let steps = 0;
  let TNext = new Float64Array(T);

  const rx = (alpha * dt) / (dx * dx);
  const cx = (u * dt) / dx;
  const cy = (v * dt) / dx;

  while (currentTime < total_time - 1e-6) {
    const stepDt = Math.min(dt, total_time - currentTime);
    const rCurrent = (alpha * stepDt) / (dx * dx);
    const cxCurrent = (u * stepDt) / dx;
    const cyCurrent = (v * stepDt) / dx;

    // FTCS + Upwind interno
    for (let i = 1; i < ny - 1; i++) {
      const row = i * nx;
      for (let j = 1; j < nx - 1; j++) {
        const p = row + j;
        const Tc = T[p];
        const Tn = T[p + nx];
        const Ts = T[p - nx];
        const Te = T[p + 1];
        const Tw = T[p - 1];

        const diff = rCurrent * (Tn + Ts + Te + Tw - 4 * Tc);
        const advX = u > 0 ? -cxCurrent * (Tc - Tw) : -cxCurrent * (Te - Tc);
        const advY = v > 0 ? -cyCurrent * (Tc - Ts) : -cyCurrent * (Tn - Tc);

        TNext[p] = Tc + diff + advX + advY;
      }
    }

    // Fronteras
    if (boundary_type === 'dirichlet') {
      for (let j = 0; j < nx; j++) {
        TNext[j] = fixed[j]; // Sur
        TNext[(ny - 1) * nx + j] = fixed[(ny - 1) * nx + j]; // Norte
      }
      for (let i = 0; i < ny; i++) {
        TNext[i * nx] = fixed[i * nx]; // Oeste
        TNext[i * nx + nx - 1] = fixed[i * nx + nx - 1]; // Este
      }
    } else {
      // Periódica
      for (let j = 1; j < nx - 1; j++) {
        TNext[j] = TNext[(ny - 2) * nx + j];
        TNext[(ny - 1) * nx + j] = TNext[nx + j];
      }
      for (let i = 1; i < ny - 1; i++) {
        TNext[i * nx] = TNext[i * nx + nx - 2];
        TNext[i * nx + nx - 1] = TNext[i * nx + 1];
      }
    }

    // Intercambiar buffers
    const temp = T;
    T = TNext;
    TNext = temp;

    currentTime += stepDt;
    steps++;

    if (currentTime >= nextSave - 1e-6 || currentTime >= total_time - 1e-6) {
      captureSnapshot(currentTime);
      nextSave += save_interval;
    }
  }

  const elapsed = (performance.now() - tStart) / 1000;

  // Estadísticas globales
  const stats = { min: [], max: [], mean: [] };
  for (const snap of snapshots) {
    let sMin = Infinity, sMax = -Infinity, sum = 0;
    const totalNodes = ny * nx;
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j < nx; j++) {
        const val = snap[i][j];
        if (val < sMin) sMin = val;
        if (val > sMax) sMax = val;
        sum += val;
      }
    }
    stats.min.push(sMin);
    stats.max.push(sMax);
    stats.mean.push(sum / totalNodes);
  }

  return {
    snapshots,
    timestamps,
    dt,
    total_time,
    steps_executed: steps,
    computation_time_seconds: elapsed,
    stability,
    grid_shape: [ny, nx],
    stats,
    metadata: { alpha, u, v, dx, boundary_type },
  };
}
