# 🏗️ Arquitectura del Sistema - Pronóstico Meteorológico

## 📋 Índice
1. [Visión General](#visión-general)
2. [Componentes Principales](#componentes-principales)
3. [Flujo de Datos](#flujo-de-datos)
4. [Patrones de Diseño](#patrones-de-diseño)
5. [API REST](#api-rest)
6. [Caché y Rendimiento](#caché-y-rendimiento)

---

## Visión General

La arquitectura sigue un modelo **cliente-servidor** desacoplado:

```
┌─────────────────┐
│   Frontend      │ (React/Vite)
│   Navegador     │ JavaScript puro
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────────────────────────┐
│      Backend FastAPI                │
│  ┌─────────────────────────────────┐│
│  │  API REST / WebSocket           ││
│  │  - Simulación                   ││
│  │  - APIs Meteorológicas          ││
│  │  - Caché Redis                  ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  Motor Numérico                 ││
│  │  - FTCS / RK4 / ADI             ││
│  │  - Difusión-Advección 2D        ││
│  │  - Estabilidad CFL              ││
│  └─────────────────────────────────┘│
└────────┬────────────────────────────┘
         │
    ┌────┴────┬────────────────┐
    ↓         ↓                ↓
 [Redis]  [APIs Externas]  [Archivos]
```

---

## Componentes Principales

### 1. **Frontend (React/Vite)**

**Responsabilidades:**
- Interfaz interactiva del usuario
- Visualización 3D/2D (Three.js)
- Control de parámetros de simulación
- Reproducción de animaciones temporales

**Estructura de archivos:**
```
frontend/src/
├── components/
│   ├── ThreeViewer.jsx          # Visualización 3D
│   ├── Heatmap.jsx              # Mapa de calor 2D
│   ├── Controls.jsx             # Panel de control
│   ├── AdvancedDashboard.jsx    # Dashboard académico
│   ├── InteractivePlots.jsx     # Gráficos Plotly
│   └── RealTimeMonitor.jsx      # Monitor en vivo
├── services/
│   ├── api.js                   # Comunicación con backend
│   ├── advanced_api.js          # APIs avanzadas
│   ├── realWeather.js           # Datos meteorológicos
│   └── localKernel.js           # Simulador local JS
├── App.jsx                      # Componente raíz
└── main.jsx
```

**Dependencias de visualización:**
```json
{
  "three": "^0.186.1",
  "recharts": "^2.10.0",
  "plotly.js": "^2.26.0",
  "d3": "^7.8.0",
  "framer-motion": "^10.16.0"
}
```

### 2. **Backend (FastAPI)**

**Responsabilidades:**
- API REST para simulaciones
- Integración con APIs meteorológicas
- Validación y control de estabilidad
- Caché de resultados
- Autenticación/autorización

**Estructura de módulos:**
```
backend/
├── core/
│   ├── grid.py                  # Malla 2D y condiciones
│   ├── schemes.py               # FTCS + Upwind
│   ├── advanced_schemes.py      # RK4, ADI, Crank-Nicolson
│   ├── adaptive_timestep.py     # Paso temporal adaptativo
│   ├── kalman_filter.py         # Asimilación de datos
│   ├── stability.py             # Análisis CFL
│   └── simulator.py             # Motor de simulación
├── api/
│   ├── app.py                   # Aplicación principal
│   ├── schemas.py               # Modelos Pydantic
│   ├── weather_integrations.py  # APIs externas
│   ├── redis_cache.py           # Caché distribuido
│   └── middleware.py            # Rate limiting, etc.
├── ml/
│   ├── predictor.py             # Modelos predictivos
│   └── ensemble_ml.py           # Ensambles ML
└── tests/
```

### 3. **Base de Datos (Redis)**

**Uso:**
- Caché de simulaciones frecuentes
- Sesiones de usuario
- Cola de tareas pendientes
- Datos meteorológicos en caché

**Clave-valor típicos:**
```
"sim:user123:params_hash" → {serialized_result}
"weather:villavicencio:2024-11-11" → {forecast_data}
"sessions:user456" → {user_config}
"status:simulation:job_id" → {progress_percent}
```

---

## Flujo de Datos

### Flujo 1: Simulación Estándar

```
┌────────────────────────┐
│  Usuario ajusta paráms │
│  (ny, nx, u, v, ...)   │
└────────┬───────────────┘
         │
         ↓
┌────────────────────────┐
│  Frontend valida en    │
│  localKernel.js        │
└────────┬───────────────┘
         │ HTTP POST /simulate
         ↓
┌────────────────────────────────┐
│  Backend recibe JSON           │
│  SimulateRequest (Pydantic)    │
└────────┬──────────────────────┘
         │
         ↓
┌────────────────────────────────┐
│  Check Redis: ¿ya calculado?   │
└──┬──────────────────────────┬──┘
   │                          │
   ↓ SÍ (caché)               ↓ NO
┌──────────┐         ┌───────────────────┐
│ Retorna  │         │ run_simulation()  │
│ resultado│         │  - Grid setup     │
│ JSON     │         │  - Selecciona     │
└────┬─────┘         │    esquema        │
     │               │  - Ejecuta 144    │
     │               │    pasos          │
     │               │  - Guarda cache   │
     │               └────────┬──────────┘
     │                        │
     └────────────┬───────────┘
                  │
                  ↓
         ┌────────────────────┐
         │  Frontend recibe   │
         │  JSON con          │
         │  snapshots + stats │
         └────────┬───────────┘
                  │
                  ↓
         ┌────────────────────┐
         │  Renderiza 3D      │
         │  Anima 24 horas    │
         └────────────────────┘
```

### Flujo 2: Datos Meteorológicos Reales

```
┌──────────────────────────┐
│  Usuario: "Cargar Clima  │
│  Real en Vivo"           │
└────────┬─────────────────┘
         │ POST /load-real-weather
         ↓
┌────────────────────────────────┐
│  Backend checks Redis cache    │
└──┬──────────────────────────┬──┘
   │                          │
   ↓ Caché válido             ↓ Expirado/No existe
┌────────┐         ┌──────────────────────────┐
│Return  │         │ fetch_weather_ensemble()│
│cached  │         │ - Open-Meteo API        │
└────┬───┘         │ - OpenWeather API       │
     │             │ - AEMET API             │
     │             │ - Promediar resultados  │
     │             │ - Interpolar malla 2D   │
     │             │ - Guardar en Redis      │
     │             └────────┬────────────────┘
     │                      │
     └──────────┬───────────┘
                │
                ↓
        ┌──────────────────┐
        │  Retorna grid    │
        │  inicial real    │
        └────────┬─────────┘
                 │
                 ↓
        ┌──────────────────┐
        │  run_simulation()│
        │  con grid real   │
        └────────┬─────────┘
                 │
                 ↓
        ┌──────────────────┐
        │  Visualización   │
        │  sobre mapa      │
        │  geográfico      │
        └──────────────────┘
```

---

## Patrones de Diseño

### 1. **Strategy Pattern** - Esquemas Numéricos

```python
# backend/core/advanced_schemes.py
AVAILABLE_SCHEMES = {
    'ftcs': ftcs_step,
    'rk4': step_rk4,
    'adi': step_adi,
    'crank_nicolson': step_cranck_nicolson,
}

# Usar:
scheme_func = AVAILABLE_SCHEMES['rk4']
T_new = scheme_func(T, alpha, u, v, dx, dt, dy)
```

### 2. **Factory Pattern** - Creación de Grillas

```python
# backend/core/grid.py
def create_hotspot_grid(ny, nx, base_temp, hot_spot_temp, sigma, ...):
    """Factory para malla con mancha caliente gaussiana."""
    ...

def create_uniform_grid(ny, nx, temp, ...):
    """Factory para malla uniforme."""
    ...
```

### 3. **Observer Pattern** - Asimilación de Datos

```python
# backend/core/kalman_filter.py
class KalmanFilter2D:
    def predict(self, increment):
        # Actualiza predicción
        pass
    
    def update_from_observation(self, obs_pos, obs_value, dx):
        # Observa y corrige
        pass
```

### 4. **Singleton Pattern** - Conexión a Redis

```python
# backend/api/redis_cache.py
class RedisCache:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
```

---

## API REST

### Endpoint: `POST /simulate`

**Request:**
```json
{
  "ny": 50,
  "nx": 50,
  "dx": 10000,
  "alpha": 6000,
  "u": 8,
  "v": 3,
  "dt": 450,
  "total_time": 86400,
  "save_interval": 600,
  "scheme": "rk4",
  "adaptive_dt": true,
  "kalman_filtering": false,
  "boundary_type": "dirichlet"
}
```

**Response:**
```json
{
  "snapshots": [[[20, 21, ...], ...], ...],
  "timestamps": [0, 600, 1200, ...],
  "dt": 450,
  "total_time": 86400,
  "steps_executed": 192,
  "computation_time_seconds": 0.234,
  "stability": {
    "is_stable": true,
    "combined_factor": 0.487
  },
  "stats": {
    "min": [18.5, 18.2, ...],
    "max": [35.2, 34.8, ...],
    "mean": [26.3, 26.1, ...]
  }
}
```

### Endpoint: `GET /load-real-weather`

**Query Parameters:**
- `region`: "villavicencio" | "cartagena" | "medellin" | ...
- `ny`, `nx`: Dimensiones de malla
- `days`: Número de días de pronóstico (default: 1)

**Response:**
```json
{
  "regionName": "Villavicencio, Colombia",
  "latitude": 4.5,
  "longitude": -74.1,
  "T": [[15, 16, ...], ...],
  "H": [[65, 68, ...], ...],
  "P": [[1012, 1011, ...], ...],
  "U": [[2, 3, ...], ...],
  "V": [[-1, 0, ...], ...],
  "minT": 12,
  "maxT": 32,
  "avgU": 2.5,
  "avgV": -0.3,
  "timestamp": "2024-11-11T10:30:00Z"
}
```

---

## Caché y Rendimiento

### Estrategia de Caché Redis

| Recurso | TTL | Hit Rate Esperado |
|---------|-----|------------------|
| Simulación | 24h | 40-60% |
| Datos meteorológicos | 30 min | 70-80% |
| Estabilidad CFL | 1h | 80%+ |
| Sesiones usuario | 7 días | 90%+ |

### Optimizaciones

1. **Vectorización NumPy:** 10-100x vs loops Python
2. **Tipado estático (Pydantic):** Validación rápida
3. **Multithreading BLAS:** Paralelismo automático
4. **Compresión JSON:** 50-70% reducción en red

### Benchmarks Típicos

| Operación | Tiempo |
|-----------|--------|
| Simulación 50×50 (144 pasos) | ~50 ms |
| Simulación 100×100 (144 pasos) | ~150 ms |
| Fetch múltiples APIs | ~2-5 seg |
| Asimilación Kalman 50×50 | ~10 ms |

---

## Seguridad

### Rate Limiting

```python
@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    client_ip = request.client.host
    if exceeds_limit(client_ip):
        return HTTPException(429, "Too Many Requests")
    return await call_next(request)
```

**Límites:**
- Anónimo: 100 req/hora
- Autenticado: 1000 req/hora
- Admin: Sin límite

### Validación de Entrada

```python
class SimulateRequest(BaseModel):
    ny: int = Field(..., ge=3, le=1000)
    nx: int = Field(..., ge=3, le=1000)
    dt: float = Field(..., gt=0, le=86400)
    ...
```

### CORS y HTTPS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://*.clima.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
)
```

---

**Generado:** Noviembre 2024 | Proyecto: Pronóstico Meteorológico v2.0
