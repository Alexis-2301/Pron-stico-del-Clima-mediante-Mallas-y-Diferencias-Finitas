# 🚀 LEVANTAR TODOS LOS SERVICIOS - GUÍA COMPLETA

## Estado Actual: Levantando en Background ⏳

Docker Compose está **levantando en background** con:
- **Redis** (cache en puerto 6379)
- **Backend FastAPI** (puerto 8000)
- **Frontend Nginx** (puerto 3000)

⏱️ **Tiempo estimado:** 3-8 minutos (depende de velocidad de conexión)

---

## 🎯 QUÉ PASARÁ EN LOS PRÓXIMOS PASOS

### Fase 1: Build de Imágenes Docker (2-4 min)
```
✓ Descargar imagen Python 3.11
✓ Instalar dependencias backend (NumPy, FastAPI, etc.)
✓ Descargar imagen Node.js
✓ Instalar dependencias frontend (React, Vite, etc.)
✓ Compilar frontend con Vite (npm run build)
```

### Fase 2: Arranque de Contenedores (30s - 1 min)
```
✓ Iniciar Redis
✓ Esperar healthcheck de Redis ✅
✓ Iniciar Backend FastAPI
✓ Esperar healthcheck de Backend ✅
✓ Iniciar Frontend Nginx
```

### Fase 3: Servicios Listos (cuando todo complete)
```
✅ http://localhost:3000    (Frontend React)
✅ http://localhost:8000    (Backend API)
✅ http://localhost:8000/docs (Documentación API interactiva)
✅ http://localhost:6379    (Redis - interno)
```

---

## 📊 VERIFICAR ESTADO EN TIEMPO REAL

### Opción 1: Ver todos los logs
```bash
docker-compose logs -f
```

### Opción 2: Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### Opción 3: Ver estado de contenedores
```bash
docker-compose ps
```

### Opción 4: Verificar puertos abiertos
```bash
netstat -ano | findstr "8000\|3000\|6379"
```

---

## ✅ CUANDO ESTÉ LISTO (verificar con una de estas)

### Verificación 1: Comando Docker
```bash
docker-compose ps
# Todos los servicios deben estar en estado "Up"
```

### Verificación 2: Probar Backend
```bash
curl http://localhost:8000/
# Debería retornar: {"status":"ok","version":"2.0"}
```

### Verificación 3: Probar Frontend
```bash
curl http://localhost:3000/
# Debería retornar HTML con <title>Clima-App</title>
```

### Verificación 4: Browser
Simplemente abre en tu navegador:
- **http://localhost:3000** (Frontend)
- **http://localhost:8000/docs** (API Swagger)

---

## 🎮 USAR LA APLICACIÓN

### 1. Acceder al Frontend
```
URL: http://localhost:3000
```

Verás:
- 📊 Panel de Control (parámetros de simulación)
- 🌡️ Visualización 3D del campo de temperatura
- ⚡ Indicador de estabilidad CFL
- 📈 Gráficos de convergencia
- 🛰️ Integración con datos reales

### 2. Ejecutar Simulación
1. Ajusta parámetros (malla, difusividad, viento)
2. Haz click en "Ejecutar Simulación"
3. Espera 2-5 segundos mientras se calcula
4. Visualiza el resultado en 3D

### 3. Cargar Datos Reales
1. Click en "Cargar Clima Real en Vivo"
2. Selecciona región (Villavicencio, Medellín, Bogotá, etc.)
3. Los datos se cargarán de APIs reales (Open-Meteo, OpenWeather)
4. Se mostrarán en el panel

### 4. Análisis Académico
1. Click en "Modo Académico"
2. Ver gráficos de convergencia
3. Inspeccionar nodos específicos
4. Analizar matriz Jacobiana
5. Ver CFL de cada esquema

---

## 🐛 SI ALGO FALLA

### El backend no inicia
```bash
docker-compose logs backend
# Buscar mensajes de error
# Posible causa: módulo faltante o error de import
```

### El frontend no compila
```bash
docker-compose logs frontend
# Verificar errores de npm
# Posible causa: dependencias faltantes
```

### Los puertos están ocupados
```bash
# Opción 1: Liberar puertos en Windows
netstat -ano | findstr ":8000"
taskkill /PID <PID> /F

# Opción 2: Cambiar puertos en docker-compose.yml
# ports:
#   - "8001:8000"  # Backend en 8001
#   - "3001:80"    # Frontend en 3001
```

### Reiniciar todo desde cero
```bash
docker-compose down
docker-compose up -d
```

### Limpiar completamente (si hay problemas graves)
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 📱 ACCESO A SERVICIOS

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Aplicación React (Simulador + Dashboard) |
| Backend API | http://localhost:8000 | API REST FastAPI |
| API Docs | http://localhost:8000/docs | Swagger interactivo |
| API Alternativo | http://localhost:8000/redoc | ReDoc |
| Redis CLI | localhost:6379 | Base de datos en-memoria |

---

## 🚀 OPCIÓN: LEVANTAR FRONTEND EN DEV MODE (Opcional)

Si quieres desarrollo rápido en lugar de usar Docker:

```bash
# Terminal nueva
cd frontend
npm install  # (si no está instalado)
npm run dev
```

Accede a: **http://localhost:5173**

⚠️ Esto requiere que el backend Docker esté corriendo en http://localhost:8000

---

## 📊 ESTRUCTURA DE ARCHIVOS IMPORTANTE

```
proyecto/
├── backend/
│   ├── api/
│   │   ├── app.py              ← App FastAPI
│   │   ├── schemas.py          ← Schemas Pydantic
│   │   └── ...
│   ├── core/
│   │   ├── advanced_schemes.py ← Esquemas numéricos (RK4, ADI, etc.)
│   │   ├── kalman_filter.py    ← Filtrado de datos
│   │   └── ...
│   └── requirements.txt        ← Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── components/         ← Componentes React
│   │   └── App.jsx
│   ├── package.json            ← Dependencias Node
│   └── vite.config.js
├── docker-compose.yml          ← Orquestación
├── Dockerfile.backend
└── Dockerfile.frontend
```

---

## 🔍 LOGS EN VIVO

Para ver **TODO** lo que sucede en tiempo real:

**Terminal 1:** Todos los logs
```bash
docker-compose logs -f
```

**Terminal 2:** Solo backend (más limpio)
```bash
docker-compose logs -f backend
```

**Terminal 3:** Solo frontend
```bash
docker-compose logs -f frontend
```

**Terminal 4:** Monitoreo de recursos
```bash
docker stats
```

---

## ⏳ PROGRESO ESPERADO

```
Tiempo    | Evento                              | Indicador
----------|-------------------------------------|-----------
0-30s     | Creando redes y volúmenes           | ⏳
30s-1m    | Pull de imágenes base               | 📥
1m-2m     | Build backend (pip install)         | 🔨
2m-4m     | Build frontend (npm install + Vite)| 🔨
4m-5m     | Arranque de contenedores            | 🚀
5m+       | Todos listos                        | ✅
```

---

## 🎓 NOTAS ACADÉMICAS

Este es un proyecto del **curso de Métodos Numéricos** que implementa:

- **Ecuación**: Advección-Difusión 2D
- **Esquemas**: FTCS, RK4, ADI, Crank-Nicolson, Beam-Warming
- **Estabilidad**: Análisis CFL y Von Neumann
- **APIs**: Integración con datos meteorológicos reales
- **Visualización**: 3D interactivo + análisis académico

Para más detalles:
- 📖 `QUICK_START.md` - Guía rápida
- 📚 `docs/metodos_numericos.md` - Métodos numéricos completos
- 🏗️ `docs/arquitectura_sistema.md` - Arquitectura
- 🐳 `docs/deployment.md` - Deployment

---

## ✨ RESUMEN

**Ahora:**
- Docker Compose está levantando en background
- Cuando termine, todos los servicios estarán en http://localhost

**Próximos 5-8 minutos:**
1. Espera a que Docker termine
2. Abre http://localhost:3000 en tu navegador
3. ¡Comienza a usar la aplicación!

**Si tienes dudas:**
- Mira los logs: `docker-compose logs -f`
- Reinicia: `docker-compose down; docker-compose up -d`
- Limpia todo: `docker system prune -a`

---

*Última actualización: 11 Nov 2026*
*Estado: Docker levantando en background...*

