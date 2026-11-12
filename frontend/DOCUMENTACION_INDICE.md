# 📚 DOCUMENTACIÓN CLIMA-APP
## Guía de Navegación

Bienvenido a la documentación completa de **Clima-App**. Este proyecto incluye tres documentos complementarios para diferentes propósitos. A continuación te mostramos cuál usar según tu necesidad.

---

## 🎯 ¿Cuál documento necesitas?

### 1️⃣ **CLIMA_APP_FUNCIONAL.md** 
**Para**: Exposición, defensa, presentación ejecutiva  
**Audiencia**: Profesores, junta directiva, público general  
**Extensión**: ~10,000 palabras  
**Formato**: Markdown narrativo, sin matemática pesada

#### Contenido:
- Resumen ejecutivo (qué es Clima-App)
- Contexto y motivación (por qué existe)
- Características principales
- Flujos de usuario (4 escenarios)
- Ventajas pedagógicas, de investigación y operacionales
- Casos de uso reales
- Roadmap futuro
- Requisitos del sistema

#### Cuándo usar:
- ✅ Defensa de tesis (diapositivas)
- ✅ Presentación a directivos
- ✅ Paper de divulgación
- ✅ Descripción del proyecto en GitHub/web
- ✅ Propuesta de financiamiento

**Muestra de contenido**:
```
# 🎨 Interfaz de Usuario
## 1. Cabecera (Header) - Sticky Top
- Logo + Título
- Modos de Interfaz
- Cambio de Tema
```

---

### 2️⃣ **METODOS_NUMERICOS_DETALLADO.md**
**Para**: Documentación técnica de métodos  
**Audiencia**: Estudiantes, investigadores, ingenieros  
**Extensión**: ~8,000 palabras  
**Formato**: Markdown con LaTeX matemático, código Python/JS

#### Contenido:
- Marco teórico completo (EDPs, diferencias finitas)
- Descripción detallada de 6 métodos:
  - FTCS + Upwind
  - RK4 (Runge-Kutta 4to orden)
  - ADI (Alternating Direction Implicit)
  - Crank-Nicolson
  - Beam-Warming
  - Kalman Filters (1D, 2D, Ensemble)
- Formulaciones matemáticas completas
- Código Python/JavaScript correspondiente
- Análisis de estabilidad CFL
- Comparativa de esquemas
- Validación analítica
- Benchmarks de rendimiento

#### Cuándo usar:
- ✅ Clase de Métodos Numéricos
- ✅ Seminario de Ecuaciones Diferenciales
- ✅ Publicación técnica
- ✅ Manual del programador
- ✅ Validación de métodos
- ✅ Comparativa de esquemas

**Muestra de contenido**:
```
### 3.2 RK4 (Runge-Kutta 4to Orden)

T^{n+1} = T^n + (Δt/6)(k₁ + 2k₂ + 2k₃ + k₄)

donde:
k₁ = f(T^n)
k₂ = f(T^n + Δt/2 · k₁)
...
```

---

### 3️⃣ **INFORME_IEEE_COMPLETO.md**
**Para**: Publicación académica, tesis de maestría  
**Audiencia**: Comunidad científica, revisores  
**Extensión**: ~6,000 palabras  
**Formato**: Estructura IEEE listo para Overleaf/LaTeX

#### Contenido:
- Abstract (resumen ejecutivo científico)
- I. Introducción (motivación, contribuciones)
- II. Marco Teórico (EDPs, números adimensionales)
- III. Métodos Numéricos (5 métodos + KF)
- IV. Arquitectura de Software
- V. Validación y Resultados
- VI. Mejoras y Trabajo Futuro
- VII. Conclusiones
- Referencias IEEE
- Apéndices (instalación, ecuaciones discretizadas)

#### Cuándo usar:
- ✅ Artículo de revista
- ✅ Tesis de Maestría/Doctorado
- ✅ Conferencia académica
- ✅ Publicación en Overleaf
- ✅ Reporte técnico profesional
- ✅ Portafolio académico

**Muestra de contenido**:
```
## II. MARCO TEÓRICO

### II.1 Ecuación de Advección-Difusión Térmica 2D

∂T/∂t = α(∂²T/∂x² + ∂²T/∂y²) - u∂T/∂x - v∂T/∂y ... (1)

Propiedades:
- Precisión O(Δt, Δx²)
- Estabilidad condicional
- Complejidad O(N²)
```

---

## 📖 Guía Rápida por Caso de Uso

| Situación | Documento | Por qué |
|-----------|-----------|--------|
| Exponiendo el proyecto en clase | FUNCIONAL | Narrativo, sin matemática pesada |
| Presentando a la junta directiva | FUNCIONAL | Casos de uso reales, impacto |
| Explicando métodos numéricos | MÉTODOS | Fórmulas, código, comparativas |
| Escribiendo un paper | IEEE | Estructura publicable, referencias |
| Defendiendo tesis | Ambos | FUNCIONAL para contexto, IEEE para rigor |
| Enseñando EDPs | MÉTODOS | Teoría + práctica detallada |
| Validando implementación | MÉTODOS | Benchmarks, estabilidad CFL |
| Buscando financiamiento | FUNCIONAL | Ventajas y visión futura |
| Publicando en revista | IEEE | Formato académico, abstract |

---

## 🔗 Estructura de Contenidos (Tabla de Contenidos Conjunta)

```
CLIMA-APP PROJECT DOCUMENTATION
│
├─ CLIMA_APP_FUNCIONAL.md (Ejecutiva)
│  ├─ Resumen Ejecutivo
│  ├─ Contexto del Problema
│  ├─ Arquitectura General
│  ├─ Interfaz de Usuario
│  │  ├─ Cabecera
│  │  ├─ Tarjeta Meteorológica
│  │  ├─ Mapa Térmico 3D/2D
│  │  ├─ Controles Temporales
│  │  └─ Paneles Colapsibles
│  ├─ Flujos Funcionales (4)
│  ├─ Características Principales
│  ├─ Ventajas (Educación, Investigación, Operacional)
│  ├─ Mejoras Futuras (Roadmap)
│  ├─ Casos de Uso (3)
│  └─ Conclusión
│
├─ METODOS_NUMERICOS_DETALLADO.md (Técnica)
│  ├─ Introducción Teórica
│  ├─ EDPs Gobernantes
│  ├─ Malla y Notación
│  ├─ Números Adimensionales (Fourier, Courant, CFL)
│  ├─ Métodos Implementados
│  │  ├─ FTCS + Upwind
│  │  ├─ RK4
│  │  ├─ ADI
│  │  ├─ Crank-Nicolson
│  │  ├─ Beam-Warming
│  │  └─ Kalman Filters
│  ├─ Integración en la Aplicación
│  ├─ Análisis de Estabilidad
│  ├─ Comparativa de Esquemas
│  ├─ Validación Analítica
│  └─ Benchmarks
│
└─ INFORME_IEEE_COMPLETO.md (Publicable)
   ├─ Abstract
   ├─ I. Introducción
   │  ├─ I.1 Motivación
   │  ├─ I.2 Contribuciones
   │  └─ I.3 Estructura
   ├─ II. Marco Teórico
   ├─ III. Métodos Numéricos
   ├─ IV. Arquitectura de Software
   ├─ V. Validación y Resultados
   ├─ VI. Mejoras Futuro
   ├─ VII. Conclusiones
   ├─ Referencias IEEE
   ├─ Apéndice A: Instalación
   └─ Apéndice B: Ecuaciones
```

---

## 💾 Descargar y Usar

### Opción 1: Visualizar en GitHub

```bash
# Ir al repositorio
https://github.com/Alexis-2301/Pron-stico-del-Clima-mediante-Mallas-y-Diferencias-Finitas

# Navegar a frontend/
# Hacer click en cada .md
```

### Opción 2: Descargar en Local

```bash
git clone https://github.com/Alexis-2301/Pron-stico-del-Clima-mediante-Mallas-y-Diferencias-Finitas.git
cd frontend

# Visualizar con editor (VS Code, Sublime, etc.)
code CLIMA_APP_FUNCIONAL.md

# O convertir a PDF (con pandoc)
pandoc CLIMA_APP_FUNCIONAL.md -o CLIMA_APP_FUNCIONAL.pdf
```

### Opción 3: Usar en Overleaf (IEEE)

```
1. Abre https://www.overleaf.com
2. New Project → Blank Project
3. Copia contenido de INFORME_IEEE_COMPLETO.md
4. Pega en main.tex (reemplaza \begin{document} ... \end{document})
5. Añade \usepackage{amsmath, graphicx, hyperref}
6. Compila con pdfLaTeX o XeLaTeX
```

---

## 🎯 Estrategia de Presentación

### Para Defensa de Tesis (30-45 min)

1. **Introducción** (5 min) → FUNCIONAL §II "Contexto"
2. **Solución Propuesta** (10 min) → FUNCIONAL §II "Arquitectura"
3. **Métodos Numéricos** (10 min) → MÉTODOS §III "Métodos Implementados"
4. **Validación** (5 min) → MÉTODOS §VII "Validación"
5. **UI y Casos de Uso** (5 min) → FUNCIONAL §IV "Flujos Funcionales"
6. **Conclusión** (5 min) → FUNCIONAL §VIII "Conclusión"

**Diapositivas sugeridas**: ~40-50 slides

### Para Publicación en Revista

1. Usar **INFORME_IEEE_COMPLETO.md** como base
2. Expandir secciones V (Validación) y VI (Trabajo Futuro)
3. Agregar figuras de resultados:
   - Convergencia numérica (gráficas)
   - UI screenshots
   - Benchmarks (tablas)
4. Enviar a revista (IEEE, Computers & Geosciences, etc.)

### Para Clase Universitaria

1. **Sesión 1**: FUNCIONAL §III "Interfaz de Usuario"
2. **Sesión 2**: MÉTODOS §II "Marco Teórico"
3. **Sesión 3**: MÉTODOS §III "FTCS + Upwind"
4. **Sesión 4**: MÉTODOS §III "RK4"
5. **Sesión 5**: MÉTODOS §III "ADI y Crank-Nicolson"
6. **Sesión 6**: MÉTODOS §VI "Estabilidad CFL"
7. **Práctica**: "Inspector del nodo" en Clima-App

---

## 📊 Estadísticas de Documentación

| Documento | Palabras | Secciones | Fórmulas | Código | Tablas |
|-----------|----------|-----------|----------|--------|--------|
| FUNCIONAL | ~10,000 | 15 | 5 | 3 | 8 |
| MÉTODOS | ~8,000 | 18 | 45+ | 20+ | 12+ |
| IEEE | ~6,000 | 12 | 30+ | 15+ | 8 |
| **TOTAL** | **~24,000** | **45+** | **80+** | **38+** | **28+** |

---

## ✨ Características Comunes

Todos los documentos incluyen:

✅ **Índice jerárquico** (navegación fácil)  
✅ **Formato profesional** (encabezados, listas)  
✅ **Referencias cruzadas** (hipervínculos internos)  
✅ **Código de ejemplo** (Python, JavaScript)  
✅ **Diagramas ASCII** (cuando aplica)  
✅ **Ecuaciones LaTeX** (compatibles con Markdown y Overleaf)  
✅ **Tablas comparativas** (resúmenes rápidos)  
✅ **Conclusiones y recomendaciones**  

---

## 🔍 Búsqueda Rápida

¿Qué buscar en cada documento?

| Búsqueda | Documento | Sección |
|----------|-----------|---------|
| "¿Qué es Clima-App?" | FUNCIONAL | §I |
| "¿Cómo funciona la UI?" | FUNCIONAL | §III |
| "¿Cuáles son los métodos?" | MÉTODOS | §III |
| "¿Cómo se valida?" | MÉTODOS | §VII |
| "¿Qué es el número de Fourier?" | MÉTODOS | §II.3 |
| "¿Cuál es más rápido?" | MÉTODOS | Tabla comparativa |
| "¿Cómo instalar?" | IEEE | Apéndice A |
| "¿Dónde está el código de RK4?" | MÉTODOS | §III.2 |
| "¿Cuál es la arquitectura?" | IEEE | §IV |
| "¿Cuál es el roadmap?" | FUNCIONAL | §VII |

---

## 📱 Recomendaciones de Formato

### Para Pantalla

- ✅ Visualiza en navegador (GitHub)
- ✅ VS Code con markdown preview
- ✅ Obsidian (gratuito, local)

### Para Imprimir

- ✅ Convierte a PDF con Pandoc:
  ```bash
  pandoc CLIMA_APP_FUNCIONAL.md -o CLIMA_APP_FUNCIONAL.pdf
  ```
- ✅ Usa Overleaf para IEEE (genera PDF automáticamente)

### Para Presentar

- ✅ Copia al generador de slides (Reveal.js, Marp)
- ✅ Crea diapositivas desde PDF

---

## 🤝 Contribuir

¿Quieres mejorar la documentación?

1. Fork el repositorio
2. Edita los .md en `/frontend/`
3. Commit y push
4. Pull request

**Áreas de mejora bienvenidas**:
- Traducción a otros idiomas
- Figuras/diagramas mejorados
- Más casos de uso
- Validación experimental adicional

---

## 📞 Contacto

**Mantendores**:
- Julian Esteban Romero Guzmán
- Eduar Alexis Murcia Rodríguez

**Institución**: Universidad de los Llanos, Villavicencio, Meta, Colombia

**Repositorio**: https://github.com/Alexis-2301/Pron-stico-del-Clima-mediante-Mallas-y-Diferencias-Finitas

**Licencia**: MIT (código) + CC BY 4.0 (documentación)

---

## 📋 Checklist para Usuarios

- [ ] He leído CLIMA_APP_FUNCIONAL.md para entender el proyecto
- [ ] He revisado METODOS_NUMERICOS_DETALLADO.md para la teoría
- [ ] He consultado INFORME_IEEE_COMPLETO.md para detalles técnicos
- [ ] He instalado Clima-App (`docker-compose up`)
- [ ] He probado la UI (modo Intuitivo y Técnico)
- [ ] He ejecutado una simulación con datos reales
- [ ] He inspeccionado el código en GitHub
- [ ] He reportado bugs/mejoras en Issues

---

**Versión de Documentación**: 2.2  
**Última actualización**: Noviembre 2026  
**Compatibilidad**: Markdown, LaTeX, HTML, PDF
