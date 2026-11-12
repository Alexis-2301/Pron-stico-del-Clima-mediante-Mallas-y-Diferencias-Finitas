# 🚀 GUÍA PARA LEVANTAR LOS SERVICIOS

## 📊 Estado de Servicios

Docker Compose se está levantando en background con los siguientes servicios:
- ✅ Redis (cache)
- 🔄 Backend FastAPI (puerto 8000)
- 🔄 Frontend React (puerto 3000)

**ETA de completitud:** 2-5 minutos

---

## 🐳 DOCKER COMPOSE - Ya en Progreso

Los siguientes contenedores se están construyendo y levantando:

### 1. Redis (Cache)
```
Estado: ⏳ Iniciando
Puerto: 6379
Comando: redis-server --appendonly yes
Healthcheck: redis-cli ping
```

### 2. Backend (FastAPI + Python)
```
Estado: 🔄 Building...
Puerto: 8000
Dockerfile: Dockerfile.backend
Comando: uvicorn backend.api.app:app --host 0.0.0.0
API Docs: http://localhost:8000/docs
```

### 3. Frontend (React + Nginx)
```
Estado: 🔄 Building...
Puerto: 3000
Dockerfile: Dockerfile.frontend
Build: npm run build (Vite)
Servidor: nginx -g 'daemon off;'
URL: http://localhost:3000
```

---

## ⏱️ Progreso Esperado

```
Paso 1: Descargar imágenes base         (30s - 1 min)
Paso 2: Instalar dependencias           (2-3 min)
Paso 3: Build frontend (npm run build)  (1-2 min)
Paso 4: Copyar archivos                 (30s)
Paso 5: Iniciar servicios               (30s)
────────────────────────────────────
TOTAL ESPERADO: 4-7 minutos
```

---

## 📋 Verificar Estado

Cuando termine, puedes verificar:

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis

# Ver estado de contenedores
docker-compose ps

# Probar conexión
curl http://localhost:8000/
curl http://localhost:3000/
```

---

## 🔍 Una Vez Que Todo Esté Listo

### Frontend
Abre tu navegador en: **http://localhost:3000**

Deberías ver:
- ✨ Interfaz principal de Clima-App
- 📊 Panel de control con parámetros
- 🌡️ Visualización 3D/2D
- ⚡ Indicador de estabilidad

### Backend API
Documentación interactiva: **http://localhost:8000/docs**

Endpoints principales:
- `POST /simulate` - Ejecutar simulación
- `GET /stability` - Verificar estabilidad CFL
- `GET /load-real-weather` - Cargar datos reales

---

## 🎯 Primeros Pasos en la Interfaz

1. **Parámetros por Defecto**
   - Malla: 40 × 40 nodos
   - Difusividad: 6000 m²/s
   - Viento: 8 m/s Este, 3 m/s Norte
   - Paso temporal: 450 s

2. **Ejecutar Simulación**
   - Click en "Ejecutar Simulación"
   - Esperar ~2-5 segundos
   - Ver visualización en 3D

3. **Cargar Datos Reales**
   - Click en "Cargar Clima Real en Vivo"
   - Seleccionar región (Villavicencio, Medellín, etc.)
   - Se cargarán datos de satélites 🛰️

4. **Ver Análisis Académico**
   - Click en "Modo Académico"
   - Ver gráficos de convergencia
   - Matriz Jacobiana
   - Inspector de nodos

---

## 🚨 Si Algo Falla

### Backend no inicia
```bash
docker-compose logs backend
# Verificar que no hay errores de Python
```

### Frontend no compila
```bash
docker-compose logs frontend
# Verificar node_modules y npm ci
```

### Puertos ocupados
```bash
# Cambiar puertos en docker-compose.yml
# ports:
#   - "8001:8000"  # Backend
#   - "3001:80"    # Frontend
```

### Reiniciar todo
```bash
docker-compose down
docker-compose up -d
```

---

## 📞 Monitoreo en Tiempo Real

Para ver todo lo que sucede:

```bash
# Terminal 1: Ver todos los logs
docker-compose logs -f

# Terminal 2: Monitorear contenedores
docker stats

# Terminal 3: Verificar puertos
netstat -ano | findstr ":8000\|:3000\|:6379"
```

---

## ✅ Checklist Cuando Esté Listo

- [ ] `docker-compose ps` muestra todos en "Up"
- [ ] `curl http://localhost:8000/` retorna JSON
- [ ] `curl http://localhost:3000/` retorna HTML
- [ ] Browser abre http://localhost:3000 correctamente
- [ ] API Docs en http://localhost:8000/docs funciona
- [ ] Puedo cambiar parámetros en el panel
- [ ] Puedo ejecutar simulación
- [ ] Puedo cargar datos reales

---

## 📚 Documentación Disponible

- **QUICK_START.md** - Guía rápida
- **docs/arquitectura_sistema.md** - Componentes y flujos
- **docs/deployment.md** - Más detalles Docker
- **README.md** - Proyecto completo

---

**Aguarda mientras Docker termina de construir. Te notificaré cuando esté listo.** ⏳

```
Noticia: Docker Compose está levantando en background...
Esto puede tomar 3-7 minutos dependiendo de tu conexión.
```
