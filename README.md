# 🌤️ Clima-App: Pronóstico Meteorológico Numérico 2D en Mallas Espaciales

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Relief-black.svg)](https://threejs.org)
[![Tests](https://img.shields.io/badge/Pytest-31%2F31_Passing-success.svg)](https://pytest.org)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

> **Proyecto de Métodos Numéricos — Universidad de los Llanos**  
> **Autores:** Julian Esteban Romero Guzmán · Eduar Alexis Murcia Rodríguez  
> **Tema:** Solución de la Ecuación de Advección-Difusión 2D para pronóstico climático a 24 horas con visualización 3D interactiva y conexión a datos reales de satélites/estaciones.

---

## 📚 Documentación del Proyecto

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
