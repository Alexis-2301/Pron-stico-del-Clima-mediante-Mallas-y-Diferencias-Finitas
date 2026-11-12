# 🌍 Integración de APIs Meteorológicas Reales - Guía Técnica

## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Servicios Integrados](#servicios-integrados)
3. [Autenticación y Configuración](#autenticación-y-configuración)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Estrategia de Fallback](#estrategia-de-fallback)
6. [Interpolación 2D (IDW)](#interpolación-2d-idw)

---

## Visión General

El sistema meteorológico integra **múltiples fuentes de datos** para:
- ✅ Obtener redundancia (si una falla, otras funcionan)
- ✅ Promediar predicciones (ensemble meteorológico)
- ✅ Mejorar precisión local con estaciones reales
- ✅ Acceso a modelos de pronóstico 10+ días

**Flujo:**
```
Usuario solicita región → Busca Redis caché → Si falta:
  → Consulta 3-5 APIs en paralelo
  → Promedia resultados
  → Interpola a malla 2D (IDW)
  → Guarda en caché
  → Retorna a frontend
```

---

## Servicios Integrados

### 1. **Open-Meteo** (Gratuito, 10,000 req/día)

**Ventajas:**
- ✅ Sin API key requerida
- ✅ Excelente cobertura global
- ✅ Datos históricos + pronóstico
- ✅ Muy confiable

**Parámetros de consulta:**
```python
def fetch_openmeteo(latitude, longitude, days=1):
    """Obtiene datos de Open-Meteo."""
    url = "https://open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "America/Bogota",
        "forecast_days": days,
    }
    response = requests.get(url, params=params)
    return response.json()
```

**Respuesta típica:**
```json
{
  "hourly": {
    "time": ["2024-11-11T00:00", "2024-11-11T01:00", ...],
    "temperature_2m": [15.2, 14.8, 14.5, ...],
    "relative_humidity_2m": [68, 72, 75, ...],
    "wind_speed_10m": [2.3, 2.1, 1.9, ...]
  }
}
```

---

### 2. **OpenWeatherMap** (Freemium, 1,000 req/día gratuito)

**Ventajas:**
- ✅ Datos históricos extensos
- ✅ Alertas de clima severo
- ✅ Datos satélite
- ✅ API muy madura

**Configuración:**
```bash
export OPENWEATHER_API_KEY="your_api_key_here"
```

**Uso:**
```python
import os
from openweather import WeatherClient

client = WeatherClient(api_key=os.getenv("OPENWEATHER_API_KEY"))

data = client.get_forecast(
    lat=4.5,
    lon=-74.1,
    exclude="minutely,alerts",
)
```

**Respuesta:**
```python
{
    "current": {
        "temp": 28.5,
        "humidity": 65,
        "pressure": 1011,
        "wind_speed": 3.2,
        "weather": [{"main": "Clouds", "description": "scattered clouds"}]
    },
    "hourly": [...],
    "daily": [...]
}
```

---

### 3. **AEMET** (Agencia Estatal Meteorología - España)

**Ventajas:**
- ✅ Datos de estaciones reales en España
- ✅ Pronóstico a 10 días
- ✅ Acceso a información de aviación

**Requisito:**
```bash
export AEMET_API_KEY="your_aemet_key"
```

**Obtener datos de Villavicencio (si disponible):**
```python
def fetch_aemet_forecast(location_code, days=3):
    """Obtiene pronóstico de AEMET."""
    url = f"https://opendata.aemet.es/opendata/api/prediccion/especifica/municipios/diarios/{location_code}"
    params = {
        "api_key": os.getenv("AEMET_API_KEY"),
        "format": "json"
    }
    response = requests.get(url, params=params)
    return response.json()
```

---

### 4. **NOAA** (National Oceanic & Atmospheric Admin - USA)

**Ventajas:**
- ✅ Datos de satélites
- ✅ Modelos de predicción (GFS, NAM)
- ✅ Análisis de huracanes/tormentas

**Uso (sin autenticación):**
```python
def fetch_noaa_gfs(latitude, longitude):
    """Obtiene pronóstico del modelo GFS de NOAA."""
    # NOAA Points API
    points_url = f"https://api.weather.gov/points/{latitude},{longitude}"
    points_resp = requests.get(points_url).json()
    
    forecast_url = points_resp["properties"]["forecast"]
    forecast = requests.get(forecast_url).json()
    
    return forecast
```

---

### 5. **Modelos Numéricos Directos** (GFS/NAM)

Para pronósticos de **largo plazo** (7-10 días), accedemos directamente al modelo GFS:

```python
def fetch_gfs_forecast(latitude, longitude, days=7):
    """Descarga pronóstico del modelo numérico GFS."""
    # Encuentra el análisis más reciente
    base_url = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod"
    
    # Construye URL (complejo, requiere parsear directorios)
    # Retorna datos NetCDF/GRIB2
    ...
```

---

## Autenticación y Configuración

### Archivo `.env.local`

```bash
# APIs públicas (sin key)
OPENMETEO_ENABLED=true

# APIs que requieren key
OPENWEATHER_API_KEY=sk_live_xxxxxxxxxxxxxxxx
OPENWEATHER_ENABLED=true

AEMET_API_KEY=your_aemet_key_here
AEMET_ENABLED=true

NOAA_ENABLED=true

# Configuración de caché
REDIS_URL=redis://localhost:6379
CACHE_TTL_WEATHER=1800  # 30 minutos

# Timeouts
API_TIMEOUT_SECONDS=10
MAX_CONCURRENT_REQUESTS=5
```

### En Docker:

```bash
docker run -e OPENWEATHER_API_KEY=$KEY -e AEMET_API_KEY=$AEMET_KEY ... clima_backend
```

---

## Ejemplos de Uso

### Ejemplo 1: Obtener Datos de Villavicencio

```python
from backend.api.weather_integrations import fetch_weather_ensemble

async def get_villavicencio_forecast():
    """Obtiene pronóstico para Villavicencio."""
    
    # Villavicencio: lat=4.5, lon=-74.1
    data = await fetch_weather_ensemble(
        latitude=4.5,
        longitude=-74.1,
        days=3,  # 3 días de pronóstico
    )
    
    return {
        "temperature": data["temperature"],      # Media de APIs
        "humidity": data["humidity"],
        "wind_speed": data["wind_speed"],
        "confidence": data["ensemble_std"],      # Desviación estándar
        "sources": data["sources_used"],         # Qué APIs contribuyeron
    }
```

### Ejemplo 2: Interpolación a Malla 2D

```python
from backend.api.interpolation import idw_interpolate_to_grid

async def create_initial_grid(region="villavicencio", ny=50, nx=50):
    """Crea malla 2D a partir de observaciones puntuales."""
    
    # Obtener estaciones cercanas
    stations = await get_weather_stations(region)
    
    # Coordenadas de estaciones: [(lat, lon), (lat, lon), ...]
    station_coords = [(s["lat"], s["lon"]) for s in stations]
    station_temps = [s["temperature"] for s in stations]
    
    # Interpolar a malla rectangular
    grid = idw_interpolate_to_grid(
        station_coords=station_coords,
        station_values=station_temps,
        grid_shape=(ny, nx),
        power=2,  # IDW power
        radius=100000,  # metros
    )
    
    return grid
```

---

## Estrategia de Fallback

Si una API falla, el sistema automáticamente:

1. **Intenta la siguiente** en la lista de prioridad
2. **Usa caché** si está disponible
3. **Retorna predicción numérica** (sin datos reales)
4. **Registra error** para análisis posterior

```python
async def fetch_weather_with_fallback(lat, lon):
    """Fetch con fallback automático."""
    
    apis_to_try = [
        ("openmeteo", fetch_openmeteo),
        ("openweather", fetch_openweather),
        ("noaa", fetch_noaa),
        ("aemet", fetch_aemet),
    ]
    
    results = []
    errors = []
    
    for api_name, fetch_func in apis_to_try:
        try:
            data = await asyncio.wait_for(
                fetch_func(lat, lon),
                timeout=10  # segundos
            )
            results.append(data)
            logger.info(f"✓ {api_name} succeeded")
        except TimeoutError:
            errors.append(f"{api_name}: timeout")
            logger.warning(f"✗ {api_name} timeout")
        except Exception as e:
            errors.append(f"{api_name}: {str(e)}")
            logger.warning(f"✗ {api_name} error: {e}")
    
    if not results:
        logger.error(f"All APIs failed: {errors}")
        return get_cached_data(lat, lon) or synthetic_fallback()
    
    # Promediar resultados disponibles
    return average_forecasts(results)
```

---

## Interpolación 2D (IDW)

**Inverse Distance Weighting** es el método usado para convertir observaciones puntuales (estaciones) en malla 2D:

$$T(x, y) = \frac{\sum_{i=1}^{n} w_i T_i}{\sum_{i=1}^{n} w_i}$$

donde $w_i = \frac{1}{d_i^p}$ es el peso basado en distancia, $d_i$ es distancia a estación $i$, $p$ es el poder (típicamente 2).

### Implementación

```python
def idw_interpolate_to_grid(
    station_coords: list[tuple[float, float]],
    station_values: list[float],
    grid_shape: tuple[int, int],
    power: float = 2.0,
    radius: float | None = None,
) -> np.ndarray:
    """Interpola valores puntuales a malla rectangular.
    
    Args:
        station_coords: [(lat, lon), ...] de estaciones
        station_values: [T_1, T_2, ...] temperaturas
        grid_shape: (ny, nx) forma de malla
        power: Potencia para IDW (por defecto 2)
        radius: Radio máximo de influencia (metros)
        
    Returns:
        Malla interpolada
    """
    ny, nx = grid_shape
    grid = np.zeros(grid_shape)
    
    # Convertir coordenadas a índices de grid
    station_indices = [
        (int((90 - lat) * nx / 180), int((lon + 180) * ny / 360))
        for lat, lon in station_coords
    ]
    
    for i in range(ny):
        for j in range(nx):
            distances = [
                np.sqrt((i - si)**2 + (j - sj)**2)
                for si, sj in station_indices
            ]
            
            # Si alguna distancia es 0, usar ese valor exactamente
            min_dist = min(distances)
            if min_dist < 1e-10:
                grid[i, j] = station_values[distances.index(min_dist)]
                continue
            
            # Aplicar radio de influencia si está especificado
            if radius is not None:
                # Convertir radio de metros a índices
                indices_in_radius = [
                    k for k, d in enumerate(distances)
                    if d * 10000 <= radius  # Aproximación: 1 índice ≈ 10 km
                ]
                if not indices_in_radius:
                    # Usar el más cercano
                    indices_in_radius = [distances.index(min_dist)]
            else:
                indices_in_radius = range(len(distances))
            
            # Calcular pesos IDW
            weights = np.array([
                1.0 / (distances[k] ** power)
                for k in indices_in_radius
            ])
            values = np.array([
                station_values[k]
                for k in indices_in_radius
            ])
            
            grid[i, j] = np.sum(weights * values) / np.sum(weights)
    
    return grid
```

---

## Caché Distribuido

Las respuestas se almacenan en Redis con TTL adaptativo:

```python
async def cache_weather_data(region: str, data: dict, ttl: int = 1800):
    """Guarda pronóstico en caché."""
    redis = await get_redis_client()
    key = f"weather:{region}:{datetime.now().isoformat()}"
    await redis.setex(key, ttl, json.dumps(data))
```

**Política de limpieza:**
- Datos actuales: 30 min TTL
- Pronóstico futuro: 6 horas TTL
- Datos históricos: 7 días TTL

---

## Monitoreo y Alertas

Registra métricas:
```python
metrics = {
    "api_response_times": {
        "openmeteo": 1.234,
        "openweather": 2.567,
        "noaa": 3.456,
    },
    "api_success_rates": {
        "openmeteo": 0.998,
        "openweather": 0.995,
        "noaa": 0.985,
    },
    "cache_hit_rate": 0.72,
}
```

Si alguna API tiene success rate < 90%, alerta al admin.

---

**Generado:** Noviembre 2024 | Proyecto: Pronóstico Meteorológico v2.0
