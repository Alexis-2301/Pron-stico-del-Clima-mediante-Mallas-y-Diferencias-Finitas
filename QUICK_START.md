# 🚀 Quick Start - Primeros 5 Minutos

## Opción 1: Ejecutar Con Docker (Más Fácil)

### Paso 1: Verificar Prerequisites
```bash
docker --version   # >= 24.0
docker-compose --version  # >= 2.20
```

### Paso 2: Clonar y Entrar
```bash
git clone https://github.com/yourusername/clima-app.git
cd clima-app
```

### Paso 3: Iniciar
```bash
docker-compose up
```

### Paso 4: Abrir en Navegador
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Redis Commander:** http://localhost:8081 (opcional)

✅ **¡Listo! Tu simulación está corriendo.**

---

## Opción 2: Ejecutar Localmente (Python + Node.js)

### Backend (Terminal 1)
```bash
cd backend

# Crear venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar API
python -m uvicorn api.app:app --reload --port 8000
```

Esperar a ver: `✓ Uvicorn running on http://127.0.0.1:8000`

### Frontend (Terminal 2)
```bash
cd frontend

npm install
npm run dev
```

Esperar a ver: `➜ Local: http://localhost:5173`

✅ **Abierto en http://localhost:5173**

---

## Opción 3: Quick Test (Verificar Instalación)

```bash
# Backend: Verificar API está online
curl http://localhost:8000/
# Response: {"status": "online", ...}

# Ejecutar simulación simple
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "ny": 20,
    "nx": 20,
    "dx": 10000,
    "alpha": 6000,
    "u": 5,
    "v": 0,
    "dt": 300,
    "total_time": 3600
  }'

# Response: JSON con snapshots, timestamps, stats
```

---

## Primeras Cosas para Probar

### 1. Cambiar Parámetros
- Mueve los sliders en el panel derecho
- Aumenta `u` (viento Este) para ver cómo se propaga el calor
- Cambia `alpha` (difusividad) para efecto de dispersión

### 2. Alternar Modo 3D/2D
- Botones en la tarjeta superior
- 3D: Relieve de temperatura
- 2D: Mapa de calor clásico

### 3. Reproducir Animación 24 Horas
- Click en ▶️ Play
- Velocidad ajustable
- Pausa y rewind disponibles

### 4. Cargar Datos Reales
- Click "Cargar Clima Real en Vivo"
- Selecciona región (Villavicencio, Medellín, Cartagena)
- Los datos se cargan desde satélites 🛰️

### 5. Ver Modo Académico
- Click en "Modo Académico"
- Gráficos de convergencia
- Matriz Jacobiana
- Inspector de nodos

---

## Explorar la Documentación

### Para Entender Qué Hace
→ Lee: [`README.md`](README.md) (5 min)

### Para Ver Cambios v2.0
→ Lee: [`cambios_finales.md`](cambios_finales.md) (10 min)

### Para Métodos Numéricos
→ Lee: [`docs/metodos_numericos.md`](docs/metodos_numericos.md) (20 min)

### Para APIs Meteorológicas
→ Lee: [`docs/guia_apis_reales.md`](docs/guia_apis_reales.md) (15 min)

### Para Deploy en Producción
→ Lee: [`docs/deployment.md`](docs/deployment.md) (15 min)

---

## Cambios Principales en v2.0

✨ **Métodos numéricos avanzados:**
- RK4 (4to orden, 3x más rápido)
- ADI (incondicionalmente estable)

✨ **APIs meteorológicas reales:**
- Open-Meteo, OpenWeather, AEMET, NOAA

✨ **Visualización mejorada:**
- Dashboards profesionales
- Gráficos interactivos
- Análisis académico

✨ **Docker & Producción:**
- Orquestación con Docker Compose
- Kubernetes ready
- Deploy en 1 comando

---

## Troubleshooting

### Puerto 8000 ya en uso
```bash
# Cambiar puerto
python -m uvicorn api.app:app --port 8001

# O liberar puerto
lsof -i :8000
kill -9 <PID>
```

### Puerto 5173/3000 ya en uso
```bash
# Vite usa puertos alternativos automáticamente
# Si no, cambiar manualmente:
npm run dev -- --port 5174
```

### Docker no inicia
```bash
# Ver logs detallados
docker-compose logs -f

# Reiniciar
docker-compose down
docker-compose up
```

### API no responde
```bash
# Verificar health check
curl http://localhost:8000/

# Ver logs backend
docker-compose logs backend

# Reiniciar solo backend
docker-compose restart backend
```

---

## Próximo Paso: Deploy

Cuando estés listo para producción:

```bash
# 1. Build las imágenes
docker-compose build

# 2. Deploy con docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# 3. O deploy en la nube (Railway, AWS, etc.)
# Ver docs/deployment.md para instrucciones
```

---

## Stack Técnico Resumen

| Componente | Tecnología |
|-----------|-----------|
| **Frontend** | React 18.3 + Vite + Three.js + Tailwind |
| **Backend** | FastAPI + Python 3.11 + NumPy/SciPy |
| **Base Datos** | Redis (caché) |
| **Contenedor** | Docker + Docker Compose |
| **Cloud** | AWS / Railway / Kubernetes |
| **Testing** | Pytest + Jest |
| **Docs** | Markdown + LaTeX |

---

## Comando Cheat Sheet

```bash
# Desarrollo local
docker-compose up               # Todo en desarrollo
docker-compose logs -f backend  # Ver logs backend

# Testing
python -m pytest backend/tests -v
npm test                        # si existe

# Formato & Linting
black backend/
isort backend/
mypy backend/core/

# Build producción
docker-compose build
docker-compose -f docker-compose.prod.yml up

# Kubernetes
kubectl apply -f k8s/
kubectl get pods
kubectl logs -f pod-name
```

---

## Información Importante

📧 **Preguntas?** Ver [`docs/contribuir.md`](docs/contribuir.md)  
🐛 **Bug encontrado?** Abrir issue en GitHub  
💡 **Sugerencia?** Hacer PR (ver guía contribución)  

---

**¡Que disfrutes el proyecto! 🌤️**

*Generado: Noviembre 2024*
