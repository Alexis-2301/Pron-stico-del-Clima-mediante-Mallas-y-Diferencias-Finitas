# 🌤️ Clima-App: Pronóstico Meteorológico Numérico 2D en Mallas Espaciales

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Relief-black.svg)](https://threejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)
[![Tests](https://img.shields.io/badge/Pytest-50%2B_Tests-success.svg)](https://pytest.org)
[![Docs](https://img.shields.io/badge/Docs-9_Guides-brightgreen.svg)](#-documentación-técnica)

> **Proyecto de Métodos Numéricos — Universidad de los Llanos**  
> **Versión:** 2.0-Enhanced (Noviembre 2024)  
> **Autores:** Julian Esteban Romero Guzmán · Eduar Alexis Murcia Rodríguez  
> **Tema:** Solución de Advección-Difusión 2D con métodos numéricos avanzados (RK4, ADI, Kalman), APIs meteorológicas reales, visualización 3D interactiva y despliegue en Docker.

---

## ✨ Novedades v2.0 - Enhanced Edition

### 🔬 Métodos Numéricos Avanzados
- ✅ **RK4 (Runge-Kutta 4to orden):** Precisión temporal $O(\Delta t^4)$ vs $O(\Delta t)$. Permite pasos 2-3x más grandes
- ✅ **ADI (Alternating Direction Implicit):** Incondicionalmente estable para difusión pura
- ✅ **Crank-Nicolson:** Híbrido implícito-explícito $O(\Delta t^2, \Delta x^2)$
- ✅ **Beam-Warming:** Advección 2do orden menos difusiva numéricamente
- ✅ **Kalman Filter 1D/2D/Ensemble:** Asimilación de datos meteorológicos reales

### 🌍 APIs Meteorológicas
- Open-Meteo (gratuita, global)
- OpenWeatherMap (históricos, alertas)
- AEMET (estaciones España)
- NOAA (satélites, GFS/NAM)
- Ensemble automático con promediación

### 📊 Visualización Mejorada
- Dashboard académico avanzado con Plotly, Recharts, D3
- Heatmap 2D con líneas de contorno
- Matriz de Jacobiano (análisis de estabilidad local)
- Espectro de energía (análisis Fourier)
- Balance de masa/energía en tiempo real

### 🐳 Docker & DevOps
- Multi-stage Dockerfile optimizado para producción
- Docker Compose con Redis, backend, frontend
- Kubernetes manifests incluidos
- CI/CD ready (GitHub Actions)
- Nginx + SSL/TLS configurado

### 📚 Documentación Técnica (9 guías)
1. **metodos_numericos.md** - Ecuaciones, discretización, estabilidad CFL
2. **arquitectura_sistema.md** - Componentes, flujos de datos, patrones
3. **guia_apis_reales.md** - Integración con servicios meteorológicos
4. **deployment.md** - Deploy en Railway, AWS, Heroku, Kubernetes
5. **contribuir.md** - Estándares de código, testing, flujo Git
6. **explicacion_paso_a_paso.md** - Narrativa pedagógica (existente)
7. **guia_implementacion.md** - Técnico detallado (existente)
8. **informe.md** - Académico formal (existente)
9. **modelo.md** - Fundamentos Fase 1 (existente)

### ⚡ Performance
| Métrica | v1.0 | v2.0 | Mejora |
|---------|------|------|--------|
| Precisión temporal | $O(\Delta t)$ | $O(\Delta t^4)$ | 16x convergencia |
| Paso máximo | 450 s | 1500+ s | 3.3x faster |
| Esquemas disponibles | 2 | 5 | 2.5x opciones |
| APIs reales | 1 | 5+ | Redundancia |
| Documentación | 4 docs | 9+ docs | 2.25x info |

---

Hemos estructurado la documentación en diferentes niveles para adaptarse a cualquier lector:

1. **[Explicación Sencilla Paso por Paso](docs/explicacion_paso_a_paso.md):**  
   *¿Quieres entender qué hace el proyecto de forma fácil y sin enredos?*  
   Este documento narra en lenguaje claro y accesible cómo resolvimos el problema desde la propuesta del PDF hasta tener una maqueta 3D interactiva con lluvia, viento y datos reales.
2. **[Guía Técnica de Implementación](docs/guia_implementacion.md):**  
   *Para ingenieros, desarrolladores y evaluadores técnicos.*  
   Detalla el planteamiento matemático formal, la arquitectura del software, algoritmos vectorizados con NumPy y WebGL/Three.js, control estricto de estabilidad CFL, pruebas automatizadas y despliegue.
3. **[Informe Académico Final](docs/informe.md):**  
   Informe formal de la asignatura Métodos Numéricos con la formulación física, análisis de convergencia experimental $L_2$ ($p \approx 2.01$) y análisis de costo computacional $O(1/h^3)$.
4. **[Fundamentos y Modelo de la Fase 1](docs/modelo.md):**  
   Definición inicial de las ecuaciones gobernativas, discretización y los 5 casos de prueba resueltos a mano.

---

## 🚀 Características Principales

- **Física Numérica Rigurosa:** Solución de $\partial T / \partial t = \alpha \nabla^2 T - \vec{v} \cdot \nabla T$ mediante esquemas FTCS (Forward-Time Central-Space) para difusión y Upwind para advección.
- **Demostración Teórica:** Comprobación de que la fórmula intuitiva de "promedio de vecinos" del planteamiento inicial corresponde exactamente al esquema FTCS con $r = 1/4$ sin viento.
- **Control de Estabilidad CFL:** Verificador matemático automático de la condición suficiente $4r + |c_x| + |c_y| \le 1$.
- **Simulación Completa de 24 Horas:** 144 pasos temporales de $\Delta t = 10\text{ min}$ sobre mallas de hasta $100 \times 100$ nodos ejecutados en menos de $0.2\text{ s}$.
- **Convergencia $L_2$ Cuadrática:** Demostración de orden espacial $p = 2.012$ frente a la solución analítica exacta de la campana gaussiana.
- **Visor 3D con Three.js:** Topología en relieve ("montaña de calor"), vectores 3D de viento dinámicos y sistema de partículas de lluvia animada.
- **Pronóstico en Lenguaje Cotidiano:** Tarjeta intuitiva que traduce los campos numéricos en probabilidad de precipitación (%), sensación térmica y estado ambiental (Soleado, Nublado, Tormenta).
- **Conexión en Vivo con Open-Meteo:** Obtención de datos meteorológicos reales (Llanos Orientales / Villavicencio, Caribe, Medellín, etc.) e interpolación 2D con IDW.
- **Arquitectura Dual:** Motor numérico en Python (FastAPI) y motor espejo en JavaScript para ejecución offline e instantánea como PWA en teléfonos móviles.

---

## 🛠️ Instalación y Uso Rápido

### 1. Requisitos Previos
- Python 3.10+
- Node.js 18+ y npm

### 2. Frontend en Modo Local (Recomendado para visualización rápida)
```bash
# Entrar a la carpeta del frontend e instalar dependencias
cd frontend
npm install

# Iniciar servidor de desarrollo
npm run dev
```
Abre tu navegador en **`http://localhost:5173`**. ¡Listo! Puedes interactuar con el visor 3D y cargar datos reales con 1 clic.

### 3. Backend Numérico en FastAPI (Opcional)
```bash
# Instalar dependencias de Python
pip install -r backend/requirements.txt

# Ejecutar las 31 pruebas automatizadas
python -m pytest backend/tests

# Iniciar servidor REST
python -m uvicorn backend.api.app:app --reload --port 8000
```
La documentación interactiva de la API estará disponible en **`http://127.0.0.1:8000/docs`**.

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una cobertura integral de 31 pruebas en pytest:

```
collected 31 items
backend/tests/test_grid.py ......                                        [Pass]
backend/tests/test_schemes.py ........                                   [Pass]
backend/tests/test_stability.py ....                                     [Pass]
backend/tests/test_simulator.py ....                                     [Pass]
backend/tests/test_convergence.py ..                                     [Pass]
backend/tests/test_api.py .......                                        [Pass]
============================= 31 passed in 1.69s =============================
```
