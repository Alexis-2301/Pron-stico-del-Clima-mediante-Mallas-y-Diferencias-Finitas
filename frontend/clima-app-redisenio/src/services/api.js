/**
 * Cliente HTTP para la API de FastAPI del backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'online';
  } catch {
    return false;
  }
}

export async function fetchStability(params) {
  const query = new URLSearchParams({
    alpha: params.alpha.toString(),
    u: params.u.toString(),
    v: params.v.toString(),
    dx: params.dx.toString(),
    dt: params.dt.toString(),
  });

  const res = await fetch(`${BASE_URL}/stability?${query}`);
  if (!res.ok) {
    throw new Error('Error al consultar estabilidad');
  }
  return res.json();
}

export async function runApiSimulation(params) {
  const res = await fetch(`${BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error en la simulación' }));
    throw new Error(err.detail || 'Error en el cálculo');
  }

  return res.json();
}
