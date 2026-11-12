# 📊 CLIMA-APP: Simulador Numérico de Pronóstico Meteorológico
## Documento Funcional para Exposición del Proyecto

---

## 🎯 Resumen Ejecutivo

**Clima-App** es una aplicación web interactiva que implementa un simulador de pronóstico meteorológico basado en ecuaciones diferenciales parciales (EDPs) resueltas mediante métodos de diferencias finitas. El software integra:

- ✅ **Simulación numérica dual**: Backend Python (FastAPI) + Motor JavaScript local
- ✅ **Datos meteorológicos reales**: APIs de Open-Meteo con 3 regiones colombianas
- ✅ **Visualización interactiva**: Vistas 3D/2D con Three.js, gráficos temporales, mapas térmicos
- ✅ **Métodos avanzados**: RK4, ADI, Crank-Nicolson, Beam-Warming, Kalman Filters
- ✅ **Diseño profesional**: Interfaz claymórfica/glasmórfica con tema claro/oscuro
- ✅ **Containerización**: Docker y Docker Compose para desarrollo y producción

---

## 🌍 Contexto del Problema

### ¿Por qué es importante?

El pronóstico meteorológico es esencial para:
- 🌾 **Agricultura**: Predicción de heladas, lluvias, humedad
- 🏗️ **Ingeniería civil**: Diseño ante eventos climáticos extremos
- 🚗 **Transporte**: Navegación y planificación de rutas
- 🌐 **Cambio climático**: Modelado y predicción de patrones globales

### Desafío técnico

Resolver las EDPs de difusión térmica y advección por viento:

$$\frac{\partial T}{\partial t} = \alpha \left( \frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2} \right) - u\frac{\partial T}{\partial x} - v\frac{\partial T}{\partial y}$$

Donde:
- **α**: Coeficiente de difusividad térmica (m²/s)
- **T**: Temperatura (K)
- **(u, v)**: Componentes del viento (m/s)

---

## 🏗️ Arquitectura General

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                     USUARIO (Navegador)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴───────────────┐
        │                              │
   ┌────▼──────────┐          ┌─────────▼────────┐
   │  Frontend UI  │          │  Theme System    │
   │  (React.jsx)  │          │  (LocalStorage)  │
   │               │          │                  │
   │ - App.jsx     │          │ - Light/Dark     │
   │ - Components  │          │ - Colors ULL     │
   │ - Visualizers │          │                  │
   └────┬──────────┘          └──────────────────┘
        │
        ├─────────────────────────┬────────────────────────┐
        │                         │                        │
   ┌────▼──────────────────┐  ┌──▼──────────────┐  ┌─────▼────────┐
   │  Simulador JavaScript │  │  API Backend    │  │ Open-Meteo   │
   │  (localKernel.js)     │  │  (FastAPI)      │  │ (Real Data)  │
   │                       │  │                 │  │              │
   │ - FTCS + Upwind      │  │ - /simulate     │  │ - Stations   │
   │ - Kalman Filters     │  │ - /stability    │  │ - Forecast   │
   │ - Float64Array       │  │ - /health       │  │              │
   └───────────┬──────────┘  └──┬───────────────┘  └──────────────┘
               │                 │
               └────────┬────────┘
                        │
                   ┌────▼─────────────────┐
                   │   Renderizado DOM     │
                   │                       │
                   │ - Canvas 3D/2D        │
                   │ - Gráficos            │
                   │ - Paneles Colapsibles │
                   │ - Indicadores         │
                   └───────────────────────┘
```

---

## 🎨 Interfaz de Usuario

### 1. **Cabecera (Header)** - Sticky Top
- **Logo + Título**: "Clima-App" con ícono de nube
- **Modos de Interfaz**: 
  - 🎯 Intuitivo: Explicaciones simples, ideal para estudiantes
  - 🔬 Técnico: Inspector de nodos, gráficas de convergencia
- **Cambio de Tema**: Sol (claro) / Luna (oscuro)

### 2. **Sección Principal (Main Content)**

#### Fila 1: Tarjeta Meteorológica + Mapa Térmico

**Tarjeta Meteorológica** (Izq., 5/12 ancho):
- Temperatura actual (°C) en nodo seleccionado
- Humedad relativa (%)
- Presión barométrica (hPa)
- Velocidad del viento (m/s)
- Hora simulada (HH:MM)
- Posición del nodo seleccionado [i, j]
- Indicador de "clima en vivo" (punto verde pulsante)

**Mapa Térmico** (Der., 7/12 ancho):
- Selector 3D/2D:
  - **3D**: Relieve con altura proporcional a temperatura, lluvia visible
  - **2D**: Mapa de calor tradicional con escala de colores
- Vectores de viento superpuestos
- Grid de malla visible (opcional)
- Click para seleccionar nodo
- Rango de colores automático (min-max)

#### Fila 2: Controles Temporales (Full Width, 12/12)
- **Reproducción**: Play/Pausa
- **Paso único**: Avanza 1 snapshot
- **Reinicio**: Vuelve a tiempo 0
- **Barra de progreso**: Slider interactivo (Seek)
- **Velocidad**: 0.1x hasta 5x
- **Tiempo actual/Total**: Formato HH:MM

#### Fila 3: Tira Horaria (Full Width, 12/12)
- Vista de 24 horas
- Mini-gráficos de T, H, P en cada hora
- Click para saltar a esa hora
- Marcador de "ahora" (hora actual)

#### Fila 4: Gráficas + Sugerencias (8/12 izq., 4/12 der.)

**Gráfica de Evolución** (Izq.):
- Línea temporal de Temperatura en nodo seleccionado
- Superpone Humedad y Presión
- Ejes X (tiempo), Y (magnitud)
- Marca punto actual

**Sugerencias** (Der.):
- Card con recomendaciones basadas en condiciones actuales
- Ejemplos:
  - "Riesgo de helada: Temperatura < 0°C"
  - "Lluvia probable: Humedad > 80%"
  - "Viento fuerte: Velocidad > 15 m/s"
  - "Presión baja: Inestabilidad atmosférica"

**Estabilidad CFL**:
- Badge con estado: ✅ Estable / ⚠️ Límite / ❌ Inestable
- Botón "Auto-ajustar Δt"

#### Fila 5: Configuración Física (Full Width, Collapsible)
- **Grid**: ny, nx, dx
- **Parámetros Físicos**: α (difusividad), u, v (viento), dt, total_time
- **Condiciones Iniciales**: base_temp, hot_spot_temp, hot_spot_sigma
- **Tipo de Frontera**: Dirichlet / Periódica
- **Datos Reales**: Dropdown con regiones colombianas
- **Backend Toggle**: Usar Python (FastAPI) vs JavaScript local
- **Botón Simular**: Ejecuta simulación con parámetros actuales

#### Modo Técnico (Collapsibles, aparecen si activeTab === 'tecnico')

**Inspector del Nodo**:
- Matriz de estencil 3×3 alrededor del nodo seleccionado
- Cálculos del paso numérico
- Coeficientes α, Δt, Δx
- Vista de términos: difusión, advección

**Evolución y Costo Computacional**:
- Gráfica de convergencia nodal
- Norma L∞ del error vs iteración
- Tiempo de cómputo acumulativo
- Estadísticas: min, max, promedio de error local

---

## 🔄 Flujos Funcionales

### Flujo 1: Simulación Didáctica (Modo Intuitivo)

```
Usuario abre aplicación
         ↓
App carga con parámetros de prueba (montaña cálida)
         ↓
Frontend ejecuta simulateLocal() en JavaScript
         ↓
Visualizador 3D muestra relieve de temperaturas
         ↓
Usuario toca Play en TimeControls
         ↓
Animación temporal: cada 100ms → siguiente snapshot
         ↓
Usuario selecciona nodo con click
         ↓
Tarjeta Meteorológica actualiza
         ↓
Gráfica temporal aparece con historial del nodo
         ↓
Usuario cambia tema (Sol/Luna)
         ↓
CSS aplica colores nuevos sin recarga (localStorage persist)
```

### Flujo 2: Simulación con Datos Reales

```
Usuario abre "Configuración Física"
         ↓
Dropdown "Cargar Clima Real" → selecciona "Llanos Orientales"
         ↓
App llama loadRealWeatherGrid('llanos', 40, 40)
         ↓
Para cada estación en región:
  └→ API Open-Meteo: temperatura, humedad, presión, viento
         ↓
Interpola con IDW (distancia inversa ponderada)
         ↓
Genera grid inicial realista con estaciones como puntos
         ↓
Simula con condición inicial real
         ↓
Visualización muestra pronóstico de 24h para Villavicencio
```

### Flujo 3: Comparación Backend vs Local

```
Usuario marca "Usar Backend" (checkbox)
         ↓
App verifica salud del backend con checkBackendHealth()
         ↓
Si ✓ online:
  └→ POST /simulate a http://localhost:8000/simulate
    └→ FastAPI usa algún método avanzado (RK4, ADI, etc.)
    └→ JSON response con snapshots y metadatos
         ↓
Si ✗ offline:
  └→ Fallback: ejecuta simulateLocal() automáticamente
         ↓
Compara tiempos de cómputo
  Backend: Python compilado
  Local: JavaScript (típicamente 1.5-2x más lento)
```

### Flujo 4: Investigación Técnica

```
Profesor cambia a modo "Técnico"
         ↓
Despliega "Inspector del Nodo"
         ↓
Selecciona punto de interés
         ↓
Ve:
  - Valores de temperatura en vecindad 3×3
  - Cálculo de Laplaciano: (T_left + T_right - 2*T_center) / dx²
  - Cálculo de advección: -u*(T_right - T_left)/(2*dx)
  - Valor predicho T_new
         ↓
Abre "Evolución y Costo"
         ↓
Ve convergencia nodal y costo computacional
         ↓
Ajusta parámetros para observar efecto en precisión
```

---

## 💡 Características Principales

### 1. **Simulación Numérica Dual**

| Aspecto | Backend (Python) | Local (JavaScript) |
|---------|------------------|--------------------|
| **Motor** | FastAPI + NumPy | Puro ES6 |
| **Métodos** | RK4, ADI, CN, BW | FTCS + Upwind |
| **Velocidad** | Rápido (compilado) | Medio (JIT) |
| **Offline** | ✗ Requiere conexión | ✓ Funciona sin API |
| **Precisión** | Métodos O(Δt⁴) | O(Δt, Δx²) |
| **Uso** | Producción pesada | Prototipos, demo |

### 2. **Datos Meteorológicos Reales**

**Integración con Open-Meteo** (API gratuita, sin autenticación):
- 📍 3 regiones pre-configuradas: Llanos, Caribe, Antioquia
- 🏗️ 12 estaciones meteorológicas por región
- 📊 Variables: T, H, P, viento en tiempo real
- 🗺️ Interpolación espacial con IDW

### 3. **Visualización Interactiva**

**Vista 3D (Three.js)**:
- Superficie de temperatura como relieve
- Altura proporcional a T (relieve térmico)
- Lluvia visible cuando H > 70% (partículas azules)
- Vectores de viento como flechas
- Malla visible con línea de grid
- Click para seleccionar nodo
- Orbit controls para rotación

**Vista 2D (Canvas)**:
- Mapa de calor tradicional
- Interpolación bilineal de colores
- Vectores de viento superpuestos
- Rectángulo de selección alrededor de nodo

### 4. **Controles Temporales**

- ▶️/⏸️ Play/Pausa
- ⏭️ Step: avanza 1 snapshot
- 🔄 Reset: vuelve a t=0
- 🎚️ Slider: seek temporal interactivo
- ⏱️ Velocidad: 0.1x - 5x (control suave)

### 5. **Paneles Colapsibles**

- Ahorro de espacio en pantallas pequeñas
- Animación de altura (0fr → 1fr)
- Estado persistente durante sesión
- Transición suave sin parpadeos

### 6. **Sistema de Temas**

**Light Mode (Defecto)**:
- Fondo blanco oficial ULL (#F5F5F5)
- Texto negro (#1a1a1a)
- Acentos en rojo ULL (#DC143C)
- Manchas de color fijas (blobs) suavizadas

**Dark Mode**:
- Fondo negro (#1a1a1a)
- Texto blanco (#F5F5F5)
- Acentos rojo ajustado para legibilidad
- Efectos claymórficos adaptados

**Persistencia**: localStorage clave `clima-theme`

### 7. **Diseño Claymórfico y Glasmórfico**

**Claymorfismo** (Tarjetas principales):
- Sombras 4-capas: volumen 3D
- Luz arriba-izquierda, sombra abajo-derecha
- Bordes suavizados (28px)
- Gradientes sutiles de fondo

**Glasmorfismo** (Cabecera, overlays):
- Fondo semitransparente
- Backdrop blur (20px)
- Borde sutil con opacidad
- Efecto de vidrio esmerilado

### 8. **Responsividad**

**Breakpoints**:
- 📱 Móvil (< 640px): 1 columna, paneles apilados
- 📱 Tablet (640-1024px): 2 columnas
- 🖥️ Desktop (> 1024px): 3-12 columnas (grid flexible)

**Características**:
- Scroll suave en eje X para gráficas largas
- Iconos ocultos en mobile, solo etiquetas de texto
- Tipografía escalada: h1 (1.5rem mobile → 2.25rem desktop)

---

## 📈 Ventajas de la Aplicación

### 🎓 Para Educación

1. **Visualización intuitiva** de conceptos matemáticos complejos
2. **Interactividad**: Cambiar parámetros → ver resultados en tiempo real
3. **Dos niveles**: Modo Intuitivo (básico) + Modo Técnico (avanzado)
4. **Sin dependencias externas**: Funciona 100% offline (modo JavaScript)
5. **Reproducibilidad**: Mismos parámetros → mismos resultados

### 🔬 Para Investigación

1. **Múltiples esquemas numéricos**: comparar precisión y velocidad
2. **Asimilación de datos**: Kalman Filters para integrar observaciones
3. **Parámetros ajustables**: α, viento, condiciones iniciales
4. **Exportación de datos**: Acceso a snapshots completos (JSON)
5. **Análisis de convergencia**: Gráficas de error vs iteración

### 🚀 Para Operacional

1. **Datos reales**: Integración Open-Meteo
2. **Escalable**: Docker para desarrollo y producción
3. **Offline-ready**: Funciona sin conexión (PWA)
4. **Responsive**: Funciona en móvil, tablet, desktop
5. **Accesible**: A11y compliance, tema alto contraste

### 🌍 Para Sostenibilidad

1. **Código abierto**: Contribuciones de la comunidad
2. **Bajo consumo de energía**: Simulación local en JS
3. **API libre**: Open-Meteo sin autenticación requerida
4. **Containerizado**: Fácil deploy en cualquier máquina

---

## 🚀 Mejoras Futuras (Roadmap)

### Corto Plazo (3 meses)

- [ ] **Predicción probabilística**: Ensamble de Kalman filtrado
- [ ] **Exportación gráfica**: Descargar mapas como PNG/SVG
- [ ] **Caché de datos**: Guardar simulaciones offline
- [ ] **Mobile app**: React Native para iOS/Android
- [ ] **WebGL optimizado**: Renderización 4K sin lag

### Mediano Plazo (6 meses)

- [ ] **Asimilación en tiempo real**: Obs. de estaciones vivas
- [ ] **3D volumétrico**: Malla vertical (z) adicional
- [ ] **Esquemas implícitos avanzados**: Strang splitting
- [ ] **Topografía real**: Incorporar DEMs de regiones
- [ ] **Paramétricos**: Lluvia, radiación solar, cobertura nubosa

### Largo Plazo (12+ meses)

- [ ] **Sistema acoplado**: Dinámica + microfísica (nubes)
- [ ] **Parallelización GPU**: WebGPU/CUDA para grillas grandes
- [ ] **Assimilación variacional**: 4D-Var (estimación óptima)
- [ ] **Integración CNR**: APIs de IDEAM, NOAA, ECMWF
- [ ] **Machine Learning**: Predicción rápida con NN entrenadas

---

## 📊 Casos de Uso

### Caso 1: Clase Universitaria (Ecuaciones Diferenciales)

**Escenario**: Profesor explica solución numérica de EDPs

```
1. Abre Clima-App en proyector
2. Modo Intuitivo, selecciona "Montaña Cálida"
3. Pausa simulación en t=2h
4. Abre Inspector: estudiantes ven Laplaciano calculado
5. Cambia α (difusividad): más grande → más dispersión
6. Vuelve a Intuitivo: "Miren cómo se suaviza el perfil"
7. Cambia a Vista 2D: observan isotermas
8. Pregunta: "¿Qué pasa si Δt es muy grande?"
   └→ Estudiantes predicen inestabilidad
   └→ Profesor aplica valor inestable → divergencia visible
```

**Resultado**: Conceptos abstractos → visuales e inmediatos

### Caso 2: Investigación Meteorológica

**Escenario**: Climatólogo validando modelo contra observaciones

```
1. Carga datos reales: Villavicencio (estaciones vivas)
2. Configura grid 50×50, α=6000, método RK4
3. Ejecuta 48-hour forecast
4. Compara predicción vs estaciones observadas
5. Calcula RMSE (Error Cuadrático Medio)
6. Ajusta α basado en validación
7. Re-ejecuta, itera hacia calibración óptima
```

**Resultado**: Validación rápida de parameterizaciones

### Caso 3: Preparación de Desastres

**Escenario**: Ingeniero civil estudia propagación de frente frío

```
1. Carga perfil de "frente frío" (gradiente fuerte)
2. Configura viento del norte: u=0, v=10 m/s
3. Simula 24h
4. Observa velocidad de propagación
5. Exporta mapa final para mapeo de riesgos
6. Comparte con colegas vía Docker
```

**Resultado**: Prototipado rápido de escenarios de riesgo

---

## 🔐 Seguridad y Privacidad

- ✅ **Sin almacenamiento de datos**: Todas las simulaciones en memoria temporal
- ✅ **HTTPS listo**: Docker con Nginx SSL-ready
- ✅ **CORS configurado**: Solo localhost en desarrollo
- ✅ **Sin tracking**: Cero analíticos o cookies de terceros
- ✅ **Código abierto**: Auditable por comunidad

---

## 📋 Requisitos del Sistema

### Mínimos

- 🖥️ CPU: Dual-core (2GHz+)
- 🧠 RAM: 2GB
- 🌐 Navegador: Chrome/Firefox/Safari (ES6 support)
- 📡 Conexión: Recomendada para datos reales

### Recomendados

- 🖥️ CPU: Quad-core (2.5GHz+)
- 🧠 RAM: 8GB
- ⚡ GPU: Integrada (para 3D suave)
- 📡 Conexión: Fibra (> 50 Mbps)

---

## 🎬 Conclusión

**Clima-App** es una herramienta educativa y de investigación que democratiza el acceso a simulación meteorológica numérica. Su combinación de:

- Interfaz intuitiva (claymorfismo + tema)
- Métodos numéricos avanzados
- Datos reales (Open-Meteo)
- Arquitectura dual (Python + JavaScript)
- Containerización moderna

...la convierte en una plataforma versátil para estudiantes, investigadores e ingenieros.

**Impacto esperado**:
- 🎓 Centenares de estudiantes entendiendo EDPs visualmente
- 🔬 Validación rápida de esquemas numéricos
- 🌍 Modelo educativo reproducible y libre

---

**Versión**: 2.2  
**Último actualizado**: Noviembre 2026  
**Mantendores**: Julian Romero, Eduar Murcia  
**Universidad**: Los Llanos (Villavicencio, Meta, Colombia)
