/**
 * Servicio de datos meteorológicos reales en vivo (Open-Meteo API).
 * Permite descargar mediciones satelitales y de estaciones reales para alimentar la malla 2D.
 */

export const REAL_REGIONS = [
  {
    id: 'llanos',
    name: '🇨🇴 Llanos Orientales & Meta (Villavicencio)',
    desc: 'Contraste térmico real entre la Cordillera Oriental y la llanura del Meta',
    stations: [
      { name: 'Bogotá (Cordillera)', lat: 4.71, lon: -74.07, gridPos: [0.8, 0.15] },
      { name: 'Villavicencio (Piedemonte)', lat: 4.15, lon: -73.63, gridPos: [0.5, 0.45] },
      { name: 'Puerto López (Llanura)', lat: 4.08, lon: -72.96, gridPos: [0.5, 0.85] },
      { name: 'Acacías (Sur)', lat: 3.99, lon: -73.76, gridPos: [0.2, 0.35] },
      { name: 'Yopal (Norte)', lat: 5.34, lon: -72.40, gridPos: [0.85, 0.8] },
    ],
  },
  {
    id: 'caribe',
    name: '🇨🇴 Costa Caribe (Barranquilla - Cartagena)',
    desc: 'Clima tropical cálido con brisas marinas costeras',
    stations: [
      { name: 'Cartagena', lat: 10.39, lon: -75.48, gridPos: [0.3, 0.2] },
      { name: 'Barranquilla', lat: 10.96, lon: -74.80, gridPos: [0.65, 0.5] },
      { name: 'Santa Marta', lat: 11.24, lon: -74.19, gridPos: [0.8, 0.8] },
      { name: 'Valledupar', lat: 10.46, lon: -73.25, gridPos: [0.25, 0.85] },
    ],
  },
  {
    id: 'antioquia',
    name: '🇨🇴 Valle de Aburrá & Medellín',
    desc: 'Topografía montañosa y gradientes térmicos de valle',
    stations: [
      { name: 'Medellín Centro', lat: 6.24, lon: -75.58, gridPos: [0.5, 0.5] },
      { name: 'Rionegro (Alto)', lat: 6.15, lon: -75.37, gridPos: [0.4, 0.8] },
      { name: 'Bello (Norte)', lat: 6.33, lon: -75.55, gridPos: [0.75, 0.55] },
      { name: 'Santa Fe (Cálido)', lat: 6.55, lon: -75.82, gridPos: [0.8, 0.2] },
    ],
  },
];

/**
 * Consulta la API pública Open-Meteo para una estación dada.
 */
export async function fetchStationWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error consultando Open-Meteo en [${lat}, ${lon}]`);
  }
  const data = await res.json();
  const cur = data.current;

  // En meteorología: 0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste
  // Viento indica de DÓNDE viene el aire
  const dirRad = (cur.wind_direction_10m * Math.PI) / 180;
  const spd = cur.wind_speed_10m; // km/h en open-meteo por defecto

  // Convertir a m/s (1 km/h = 1/3.6 m/s)
  const spdMs = spd / 3.6;

  // Componentes cartesianas (u hacia el Este, v hacia el Norte)
  const u = -spdMs * Math.sin(dirRad);
  const v = -spdMs * Math.cos(dirRad);

  return {
    temp: cur.temperature_2m,
    humidity: cur.relative_humidity_2m,
    pressure: cur.surface_pressure,
    windSpeedMs: spdMs,
    windSpeedKmh: spd,
    windDirDeg: cur.wind_direction_10m,
    u,
    v,
    time: cur.time,
  };
}

/**
 * Carga el clima real de una región e interpola las mediciones en una malla N x N
 * usando interpolación por distancia inversa ponderada (IDW).
 */
export async function loadRealWeatherGrid(regionId = 'llanos', ny = 40, nx = 40) {
  const region = REAL_REGIONS.find((r) => r.id === regionId) || REAL_REGIONS[0];

  // Consultar todas las estaciones de la región en paralelo
  const promises = region.stations.map(async (st) => {
    const weather = await fetchStationWeather(st.lat, st.lon);
    return { ...st, weather };
  });

  const sampledStations = await Promise.all(promises);

  // Calcular promedios regionales de viento
  let avgU = 0;
  let avgV = 0;
  sampledStations.forEach((s) => {
    avgU += s.weather.u;
    avgV += s.weather.v;
  });
  avgU /= sampledStations.length;
  avgV /= sampledStations.length;

  // Interpolar en la cuadrícula ny x nx con IDW
  const T = [];
  const H = [];
  const P = [];

  let minT = Infinity;
  let maxT = -Infinity;

  for (let i = 0; i < ny; i++) {
    const rowT = [];
    const rowH = [];
    const rowP = [];
    const normY = i / (ny - 1);

    for (let j = 0; j < nx; j++) {
      const normX = j / (nx - 1);

      let sumWeights = 0;
      let interpT = 0;
      let interpH = 0;
      let interpP = 0;

      for (const st of sampledStations) {
        const [stY, stX] = st.gridPos;
        const dist = Math.hypot(normX - stX, normY - stY) + 1e-3;
        const w = 1.0 / (dist * dist);

        sumWeights += w;
        interpT += w * st.weather.temp;
        interpH += w * st.weather.humidity;
        interpP += w * st.weather.pressure;
      }

      const cellT = interpT / sumWeights;
      const cellH = interpH / sumWeights;
      const cellP = interpP / sumWeights;

      rowT.push(cellT);
      rowH.push(cellH);
      rowP.push(cellP);

      if (cellT < minT) minT = cellT;
      if (cellT > maxT) maxT = cellT;
    }
    T.push(rowT);
    H.push(rowH);
    P.push(rowP);
  }

  return {
    regionName: region.name,
    timestamp: sampledStations[0]?.weather?.time || new Date().toISOString(),
    stations: sampledStations,
    T,
    H,
    P,
    avgU: Math.round(avgU * 10) / 10,
    avgV: Math.round(avgV * 10) / 10,
    minT,
    maxT,
  };
}
