/**
 * Motor numérico en JavaScript puro para ejecución local / offline en el navegador.
 * Modela el trío meteorológico del PDF: Temperatura (T), Presión (P) y Humedad (H).
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
    u = 8,
    v = 3,
    dt = 450,
    total_time = 86400,
    save_interval = 600,
    base_temp = 18,
    hot_spot_temp = 36,
    hot_spot_sigma = 4.5,
    boundary_type = 'dirichlet',
  } = params;

  const tStart = performance.now();
  const stability = checkLocalStability(alpha, u, v, dx, dt);

  // 1. Inicializar Temperatura T
  const ci = Math.floor(ny / 2);
  const cj = Math.floor(nx / 2);
  let T = new Float64Array(ny * nx);
  let H = new Float64Array(ny * nx); // Humedad (%)
  let P = new Float64Array(ny * nx); // Presión (hPa)

  const deltaT = hot_spot_temp - base_temp;

  if (params.initialT && params.initialT.length === ny && params.initialT[0].length === nx) {
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j < nx; j++) {
        const idx = i * nx + j;
        T[idx] = params.initialT[i][j];
        H[idx] = params.initialH ? params.initialH[i][j] : 65;
        P[idx] = params.initialP ? params.initialP[i][j] : 1013;
      }
    }
  } else {
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j < nx; j++) {
        const idx = i * nx + j;
        const distSq = (i - ci) ** 2 + (j - cj) ** 2;
        const g = deltaT * Math.exp(-distSq / (2 * hot_spot_sigma * hot_spot_sigma));
        T[idx] = base_temp + g;

        // Humedad: el núcleo caliente es más seco (45-55%), mientras que en la periferia y este hay un frente húmedo (75-88%)
        const humidFront = Math.sin((j / nx) * Math.PI) * 25 + Math.cos((i / ny) * Math.PI) * 10;
        H[idx] = Math.max(35, Math.min(95, 65 + humidFront - g * 0.9));

        // Presión: baja térmica en el centro caliente (1007 hPa), alta en la periferia (1016 hPa)
        P[idx] = 1014.0 - g * 0.25;
      }
    }
  }

  // Copias de bordes fijos
  const fixedT = new Float64Array(T);
  const fixedH = new Float64Array(H);
  const fixedP = new Float64Array(P);

  const snapshots = [];
  const humiditySnapshots = [];
  const pressureSnapshots = [];
  const timestamps = [];

  function captureSnapshot(timeSec) {
    const matT = [];
    const matH = [];
    const matP = [];
    for (let i = 0; i < ny; i++) {
      const rowT = [];
      const rowH = [];
      const rowP = [];
      for (let j = 0; j < nx; j++) {
        const idx = i * nx + j;
        rowT.push(T[idx]);
        rowH.push(H[idx]);
        rowP.push(P[idx]);
      }
      matT.push(rowT);
      matH.push(rowH);
      matP.push(rowP);
    }
    snapshots.push(matT);
    humiditySnapshots.push(matH);
    pressureSnapshots.push(matP);
    timestamps.push(timeSec);
  }

  captureSnapshot(0);

  let currentTime = 0;
  let nextSave = save_interval;
  let steps = 0;

  let TNext = new Float64Array(T);
  let HNext = new Float64Array(H);
  let PNext = new Float64Array(P);

  function stepField(cur, nxt, fixed, fieldAlpha, fieldDt) {
    const rCurrent = (fieldAlpha * fieldDt) / (dx * dx);
    const cxCurrent = (u * fieldDt) / dx;
    const cyCurrent = (v * fieldDt) / dx;

    for (let i = 1; i < ny - 1; i++) {
      const row = i * nx;
      for (let j = 1; j < nx - 1; j++) {
        const p = row + j;
        const c = cur[p];
        const n = cur[p + nx];
        const s = cur[p - nx];
        const e = cur[p + 1];
        const w = cur[p - 1];

        const diff = rCurrent * (n + s + e + w - 4 * c);
        const advX = u > 0 ? -cxCurrent * (c - w) : -cxCurrent * (e - c);
        const advY = v > 0 ? -cyCurrent * (c - s) : -cyCurrent * (n - c);

        nxt[p] = c + diff + advX + advY;
      }
    }

    if (boundary_type === 'dirichlet') {
      for (let j = 0; j < nx; j++) {
        nxt[j] = fixed[j];
        nxt[(ny - 1) * nx + j] = fixed[(ny - 1) * nx + j];
      }
      for (let i = 0; i < ny; i++) {
        nxt[i * nx] = fixed[i * nx];
        nxt[i * nx + nx - 1] = fixed[i * nx + nx - 1];
      }
    } else {
      for (let j = 1; j < nx - 1; j++) {
        nxt[j] = nxt[(ny - 2) * nx + j];
        nxt[(ny - 1) * nx + j] = nxt[nx + j];
      }
      for (let i = 1; i < ny - 1; i++) {
        nxt[i * nx] = nxt[i * nx + nx - 2];
        nxt[i * nx + nx - 1] = nxt[i * nx + 1];
      }
    }
  }

  while (currentTime < total_time - 1e-6) {
    const stepDt = Math.min(dt, total_time - currentTime);

    // Avanzar Temperatura, Humedad y Presión con el mismo esquema
    stepField(T, TNext, fixedT, alpha, stepDt);
    stepField(H, HNext, fixedH, alpha * 0.7, stepDt); // La humedad se difunde ligeramente más lento
    stepField(P, PNext, fixedP, alpha * 1.2, stepDt);

    // Intercambio de buffers
    let tmp = T; T = TNext; TNext = tmp;
    tmp = H; H = HNext; HNext = tmp;
    tmp = P; P = PNext; PNext = tmp;

    currentTime += stepDt;
    steps++;

    if (currentTime >= nextSave - 1e-6 || currentTime >= total_time - 1e-6) {
      captureSnapshot(currentTime);
      nextSave += save_interval;
    }
  }

  const elapsed = (performance.now() - tStart) / 1000;

  return {
    snapshots,
    humiditySnapshots,
    pressureSnapshots,
    timestamps,
    dt,
    total_time,
    steps_executed: steps,
    computation_time_seconds: elapsed,
    stability,
    grid_shape: [ny, nx],
    metadata: { alpha, u, v, dx, boundary_type },
  };
}
