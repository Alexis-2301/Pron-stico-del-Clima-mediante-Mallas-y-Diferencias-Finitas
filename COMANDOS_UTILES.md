# 🚀 GUÍA RÁPIDA DE COMANDOS - CLIMA-APP v2.0

## ✨ INICIAR TODO (La forma más fácil)

### Opción 1: Docker Compose (Recomendado - Todo en contenedores)
```bash
docker-compose up -d
```
✅ **Resultado:**
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Redis: localhost:6379

### Opción 2: Desarrollo Local (Frontend + Docker Backend)
**Terminal 1:** Levanta el backend Docker
```bash
docker-compose up -d redis backend
```

**Terminal 2:** Levanta el frontend en desarrollo
```bash
cd frontend
npm install  # (primera vez)
npm run dev
```
✅ **Resultado:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173 (con hot-reload)
- Redis: localhost:6379

### Opción 3: Todo Local (Desarrollo puro - sin Docker)
**Terminal 1:** Backend
```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.api.app:app --reload
```

**Terminal 2:** Frontend
```bash
cd frontend
npm install  # (primera vez)
npm run dev
```
✅ **Resultado:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

## 📊 VERIFICAR ESTADO

### Ver estado de contenedores
```bash
docker-compose ps
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo redis
docker-compose logs -f redis
```

### Probar conectividad
```bash
# Backend
curl http://localhost:8000/
# Debería retornar: {"status":"ok","version":"2.0"}

# Frontend
curl http://localhost:3000/
# Debería retornar HTML con <title>Clima-App</title>

# API Docs
curl http://localhost:8000/docs
```

### Monitoreo en tiempo real
```bash
docker stats
```

---

## 🛑 DETENER SERVICIOS

### Detener sin eliminar
```bash
docker-compose stop
```

### Detener e eliminar contenedores
```bash
docker-compose down
```

### Detener e eliminar todo (incluyendo volúmenes)
```bash
docker-compose down -v
```

---

## 🔧 LIMPIAR Y REINICIAR

### Reinicio simple
```bash
docker-compose restart
```

### Reinicio del backend solo
```bash
docker-compose restart backend
```

### Build limpio desde cero
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 📦 CONSTRUIR IMÁGENES

### Build de todas las imágenes
```bash
docker-compose build
```

### Build sin caché (fuerza rebuild)
```bash
docker-compose build --no-cache
```

### Build de un servicio específico
```bash
docker-compose build backend
docker-compose build frontend
```

---

## 🐛 DEBUGGING

### Entrar al contenedor backend
```bash
docker-compose exec backend bash
# Dentro:
python -c "import backend; print('OK')"
pip list  # Ver paquetes instalados
```

### Entrar al contenedor frontend
```bash
docker-compose exec frontend sh
# Dentro:
node --version
npm list
```

### Ver logs del sistema del contenedor
```bash
docker logs -f clima_backend
docker logs -f clima_frontend
```

### Ejecutar comando en contenedor sin entrar
```bash
docker-compose exec backend python -m pytest tests/
```

---

## 📝 DESARROLLO FRONTEND

### Instalar dependencia nueva
```bash
cd frontend
npm install <paquete>
# No olvides hacer commit de package-lock.json
```

### Build para producción
```bash
cd frontend
npm run build
# Genera: dist/
```

### Preview de build
```bash
cd frontend
npm run build
npm run preview
```

---

## 🐍 DESARROLLO BACKEND

### Instalar dependencia nueva
```bash
pip install <paquete>
pip freeze > backend/requirements.txt
# No olvides hacer commit de requirements.txt
```

### Ejecutar tests
```bash
cd backend
python -m pytest tests/ -v
python -m pytest tests/test_advanced_schemes.py -v
```

### Type checking
```bash
pip install mypy
mypy backend/core/
```

### Linting
```bash
pip install pylint
pylint backend/
```

---

## 🌐 ACCESO A SERVICIOS

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Aplicación web (Docker) |
| Frontend Dev | http://localhost:5173 | Aplicación web (dev mode) |
| Backend API | http://localhost:8000 | API REST |
| API Swagger | http://localhost:8000/docs | Documentación interactiva |
| API ReDoc | http://localhost:8000/redoc | Documentación alternativa |
| Redis CLI | localhost:6379 | Cache (interno) |
| Health Check Backend | http://localhost:8000/health | Estado del backend |

---

## 🚀 SCRIPTS DE AYUDA

### Windows - Ejecutar frontend dev
```bash
.\run-frontend-dev.bat
# o
powershell -ExecutionPolicy Bypass -File .\run-frontend-dev.ps1
```

### Todos - Ejecutar backend
```bash
python -m uvicorn backend.api.app:app --reload --host 0.0.0.0 --port 8000
```

---

## 📚 DOCUMENTACIÓN

### Rápida
```
QUICK_START.md - 5 minutos
LEVANTAR_SERVICIOS.md - Guía completa
```

### Completa
```
docs/metodos_numericos.md - Métodos numéricos (600+ líneas)
docs/arquitectura_sistema.md - Arquitectura (400+ líneas)
docs/guia_apis_reales.md - Integración APIs (350+ líneas)
docs/deployment.md - Deployment (400+ líneas)
docs/contribuir.md - Contribuciones (350+ líneas)
```

### Videos/Tutoriales
```
Ver: README.md (sección Features v2.0)
```

---

## 🔐 VARIABLES DE ENTORNO

### Crear `.env` (opcional, para APIs reales)
```bash
# .env
OPENWEATHER_API_KEY=tu_clave_aqui
AEMET_API_KEY=tu_clave_aqui
NOAA_API_KEY=tu_clave_aqui
LOG_LEVEL=DEBUG
```

### En Docker, usar variables de docker-compose.yml
```yaml
environment:
  OPENWEATHER_API_KEY: "${OPENWEATHER_API_KEY:-demo}"
  AEMET_API_KEY: "${AEMET_API_KEY:-demo}"
```

---

## ⚙️ SOLUCIONAR PROBLEMAS COMUNES

### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr ":8000"
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8000
kill -9 <PID>
```

### "Module not found: backend.api.app"
```bash
# Verificar estructura
ls -la backend/api/
# Debe tener: __init__.py, app.py, schemas.py

# Reinstalar
docker-compose down -v
docker-compose up -d --build
```

### "npm ERR! ERESOLVE"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Connection refused" al backend
```bash
# Verificar que el contenedor está corriendo
docker-compose ps backend

# Ver logs
docker-compose logs backend

# Reiniciar
docker-compose restart backend
```

### Redis connection error
```bash
# Verificar Redis
docker-compose logs redis

# Probar conexión
docker-compose exec redis redis-cli ping
# Debe retornar: PONG
```

---

## 📊 PERFORMANCE & MONITOREO

### Ver uso de recursos
```bash
docker stats
# Ver CPU, memoria, I/O de cada contenedor
```

### Benchmarking de API
```bash
# Instalar Apache Bench (en Windows, usa WSL o Git Bash)
ab -n 100 -c 10 http://localhost:8000/

# O con curl
for i in {1..10}; do curl -s http://localhost:8000/ | head -c 100; done
```

### Profiling de Python
```bash
pip install py-spy
py-spy record -o profile.svg -- python -m uvicorn backend.api.app:app
```

---

## 🎯 WORKFLOW TÍPICO DE DESARROLLO

### Día 1: Configuración inicial
```bash
# 1. Verificar todo esté instalado
docker --version
docker-compose --version
node --version
npm --version
python --version

# 2. Levantar servicios
docker-compose up -d

# 3. Verificar en navegador
# http://localhost:3000 ✓
# http://localhost:8000/docs ✓
```

### Día 2: Modificar frontend
```bash
# Terminal 1: Backend Docker
docker-compose up -d backend redis

# Terminal 2: Frontend dev (auto-reload)
./run-frontend-dev.ps1
# o
cd frontend && npm run dev

# Edita src/, cambios se aplican al instante
```

### Día 3: Modificar backend
```bash
# Terminal 1: Backend local con reload
python -m uvicorn backend.api.app:app --reload

# Terminal 2: Frontend dev
./run-frontend-dev.ps1

# Edita backend/, cambios se aplican al instante
```

### Deploy: Producción
```bash
# Build y push a registro
docker-compose -f docker-compose.prod.yml build
docker tag ... myregistry/clima-app:latest
docker push myregistry/clima-app:latest

# Deploy con Kubernetes
kubectl apply -f k8s/
```

---

## 🔗 LINKS ÚTILES

- **FastAPI**: https://fastapi.tiangolo.com/
- **React/Vite**: https://vitejs.dev/
- **Docker**: https://docs.docker.com/
- **NumPy**: https://numpy.org/
- **Matplotlib**: https://matplotlib.org/

---

**Última actualización:** 11 Nov 2026
**Versión:** 2.0
**Estado:** ✅ Funcionando
