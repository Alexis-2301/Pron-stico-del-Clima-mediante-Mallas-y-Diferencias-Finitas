# Informe Final: Aplicación de Métodos Numéricos en la Predicción Meteorológica

**Asignatura:** Métodos Numéricos  
**Programa:** Ingeniería de Sistemas  
**Institución:** Universidad de los Llanos  
**Autores:** Julian Esteban Romero Guzmán · Eduar Alexis Murcia Rodríguez  

---

## 1. El Problema Real y Justificación

La atmósfera terrestre es un fluido continuo, tridimensional e infinito. Medir o resolver analíticamente las variables meteorológicas (como temperatura, presión y velocidad del viento) en cada punto infinitesimal del espacio es físicamente irrealizable. 

Para resolver este desafío, los centros meteorológicos mundiales (como el ECMWF y NOAA) recurren a la **discretización espacial y temporal**, transformando el sistema continuo de ecuaciones diferenciales en derivadas parciales (EDP) en un sistema discreto computable sobre una **malla meteorológica regular**.

En este proyecto, se modela y resuelve numéricamente la evolución temporal de la temperatura $T(x, y, t)$ sobre una región geográfica de $1000 \times 1000\text{ km}$ a lo largo de un ciclo de 24 horas.

---

## 2. Modelo Matemático y Esquema Numérico

### 2.1 Ecuación Gobernativa (Advección-Difusión 2D)

La dinámica térmica atmosférica en el plano horizontal responde a dos fenómenos físicos fundamentales:
1. **Difusión térmica molecular y turbulenta ($\alpha$):** Redistribución pasiva del calor entre zonas contiguas.
2. **Advección debida al viento ($u, v$):** Transporte de masa de aire caliente o frío inducido por corrientes de aire (viento zonal $u$ hacia el Este y viento meridional $v$ hacia el Norte).

$$
\frac{\partial T}{\partial t} = \alpha \left( \frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2} \right) - u \frac{\partial T}{\partial x} - v \frac{\partial T}{\partial y}
$$

### 2.2 Discretización por Diferencias Finitas

Discretizamos el dominio con espaciados espaciales $\Delta x = \Delta y = 10\text{ km}$ y paso temporal $\Delta t = 600\text{ s}$ ($10\text{ minutos}$, completando 144 iteraciones en 24 horas).

Definimos los números adimensionales:
- **Número de difusión de Fourier:** $r = \dfrac{\alpha \Delta t}{\Delta x^2}$
- **Números de Courant (CFL):** $c_x = \dfrac{u \Delta t}{\Delta x}, \quad c_y = \dfrac{v \Delta t}{\Delta y}$

#### A. Difusión: Esquema FTCS (Forward Time, Centered Space)
Aproxima el laplaciano $\nabla^2 T$ usando un stencil centrado de segundo orden en espacio $O(\Delta x^2)$:

$$
D_{i,j} = r \left( T_{i+1,j} + T_{i-1,j} + T_{i,j+1} + T_{i,j-1} - 4 T_{i,j} \right)
$$

*Nota clave:* Cuando $r = \frac{1}{4}$ y no hay viento, la fórmula se reduce a:
$$
T^{n+1}_{i,j} = \frac{T_{i+1,j} + T_{i-1,j} + T_{i,j+1} + T_{i,j-1}}{4}
$$
que es exactamente el promedio de los 4 vecinos adyacentes propuesto en la formulación base.

#### B. Advección: Esquema Upwind (Viento a favor de la corriente)
Para evitar oscilaciones espurias no físicas del esquema centrado en advección pura, el esquema Upwind toma la información del nodo de donde **proviene** el flujo:

$$
A_{i,j} = \begin{cases}
-c_x (T_{i,j} - T_{i,j-1}) & \text{si } u > 0 \\
-c_x (T_{i,j+1} - T_{i,j}) & \text{si } u < 0
\end{cases} \quad + \quad \begin{cases}
-c_y (T_{i,j} - T_{i-1,j}) & \text{si } v > 0 \\
-c_y (T_{i+1,j} - T_{i,j}) & \text{si } v < 0
\end{cases}
$$

#### C. Ecuación de Avance Temporal
$$
T^{n+1}_{i,j} = T^n_{i,j} + D_{i,j} + A_{i,j}
$$

---

## 3. Análisis de Estabilidad (Condición CFL y Fourier)

Para que el esquema numérico explícito sea estable (no diverja hacia $\pm \infty$), los coeficientes del nodo central al despejar $T^n_{i,j}$ deben permanecer no negativos. Esto impone la **condición suficiente combinada**:

$$
4r + |c_x| + |c_y| \le 1
$$

Despejando el paso de tiempo máximo permitido:

$$
\Delta t_{\max} = \frac{1}{\dfrac{4\alpha}{\Delta x^2} + \dfrac{|u| + |v|}{\Delta x}}
$$

### Demostración Teórica y Experimental:

Para $\Delta x = 10\,000\text{ m}$, $\alpha = 5000\text{ m}^2/\text{s}$, $u = 5\text{ m/s}$, $v = 0$:
$$
\Delta t_{\max} = \frac{1}{\frac{4(5000)}{10^8} + \frac{5}{10^4}} = \frac{1}{0{,}0002 + 0{,}0005} = \frac{1}{0{,}0007} \approx 1428{,}57\text{ s} \approx 23{,}8\text{ min}
$$

| Caso | $\Delta t$ | $r$ | $c_x$ | $4r + |c_x|$ | Predicción | Comportamiento en Simulación |
|---|---|---|---|---|---|---|
| **Estable** | $600\text{ s}$ ($10\text{ min}$) | $0{,}03$ | $0{,}30$ | **$0{,}42 \le 1$** | Estable | Simulación suave, acotada y físicamente consistente. |
| **Inestable** | $3600\text{ s}$ ($1\text{ hora}$) | $0{,}18$ | $1{,}80$ | **$2{,}52 > 1$** | **Divergente** | Oscilaciones violentas, explosión a $>10^{15}\text{ °C}$, `NaN` e `Inf`. |

Esto valida formalmente la advertencia del documento del proyecto: *"Si el paso de tiempo es demasiado amplio (ej. saltar de hora en hora), el método pierde estabilidad y el pronóstico diverge por completo."*

---

## 4. Validación Numérica: Convergencia de Orden 2

Para certificar el rigor del método numérico, se comparó la solución obtenida con la **solución analítica cerrada** de la ecuación de difusión bidimensional de una gaussiana:

$$
T_{\text{exacto}}(x, y, t) = T_{\text{base}} + A_0 \frac{\sigma_0^2}{\sigma_0^2 + 2\alpha t} \exp\left( -\frac{(x - x_0)^2 + (y - y_0)^2}{2(\sigma_0^2 + 2\alpha t)} \right)
$$

Se realizó un estudio de refinamiento de malla variando la cantidad de nodos $N \in \{21, 41, 81, 161\}$:

$$
p = \frac{\ln(E_{L2, 1} / E_{L2, 2})}{\ln(\Delta x_1 / \Delta x_2)}
$$

### Resultados de Convergencia Observados:
- Entre $N = 21$ y $N = 41$: **$p \approx 2{,}04$**
- Entre $N = 41$ y $N = 81$: **$p \approx 2{,}02$**
- Entre $N = 81$ y $N = 161$: **$p \approx 2{,}01$**

El orden de convergencia espacial asintótico observado es exactamente **$p = 2$**, lo que confirma experimental y analíticamente que el esquema implementado respeta $O(\Delta x^2)$.

La gráfica generada se encuentra almacenada en [`docs/convergencia_L2.png`](file:///C:/Users/alexi/clima-app/docs/convergencia_L2.png).

---

## 5. Análisis del Costo Computacional $O(1/h^3)$

Al incrementar la resolución geográfica reduciendo el tamaño de celda $h$:
- El número de nodos crece cuadráticamente: $N_{\text{nodos}} \propto \dfrac{1}{h^2}$.
- Por la restricción CFL, el paso máximo de tiempo se reduce proporcionalmente a $h$: $\Delta t_{\max} \propto h$, lo que duplica el número de pasos temporales en 24 horas: $N_{\text{pasos}} \propto \dfrac{1}{h}$.
- Por tanto, el número total de operaciones de actualización crece de forma cúbica:
$$
\text{Costo Total} \propto \frac{1}{h^3}
$$

| $h$ | Nodos ($1000\times1000\text{ km}$) | $\Delta t_{\max}$ | Pasos en 24 h | Operaciones | Factor de Costo Relativo |
|---|---|---|---|---|---|
| $20\text{ km}$ | $2\,500$ | $666\text{ s}$ | $130$ | $3{,}25 \times 10^5$ | $0{,}12 \times$ |
| **$10\text{ km}$ (Base)** | **$10\,000$** | **$333\text{ s}$** | **$260$** | **$2{,}60 \times 10^6$** | **$1{,}00 \times$ (Referencia)** |
| $5\text{ km}$ | $40\,000$ | $166\text{ s}$ | $520$ | $2{,}08 \times 10^7$ | **$8{,}0 \times$** |
| $2{,}5\text{ km}$ | $160\,000$ | $83\text{ s}$ | $1\,040$ | $1{,}66 \times 10^8$ | **$64{,}0 \times$** |
| $1\text{ km}$ | $1\,000\,000$ | $33\text{ s}$ | $2\,600$ | $2{,}60 \times 10^9$ | **$1000{,}0 \times$** |

Este análisis fundamenta por qué la predicción meteorológica global de alta resolución exige supercomputadores con paralelismo masivo.

---

## 6. Arquitectura del Software

El proyecto se estructuró de forma modular y desacoplada:

```
clima-app/
├── backend/
│   ├── core/            # Motor numérico puro (NumPy vectorizado)
│   │   ├── grid.py          # Clase Grid, condiciones Dirichlet y periódicas
│   │   ├── schemes.py       # Esquema FTCS + Upwind vectorizado
│   │   ├── stability.py     # Cálculo analítico de CFL y dt_max
│   │   └── simulator.py     # Bucle temporal de 24 h (144 pasos)
│   ├── api/             # FastAPI REST con modelos Pydantic
│   │   ├── app.py           # Endpoints: /simulate, /stability, /
│   │   └── schemas.py       # Validación de parámetros y rechazo de inestabilidad
│   ├── analysis/        # Estudio de error y convergencia analítica
│   │   ├── convergence.py   # Solución analítica y cálculo L2
│   │   └── plot_convergence.py # Generador de gráfica de convergencia
│   └── tests/           # 30 pruebas automatizadas con pytest
└── frontend/            # Aplicación web React 18 + Vite (PWA)
    ├── src/
    │   ├── components/  # Heatmap canvas, Inspector 3x3, Sliders, StabilityBadge
    │   └── services/    # Cliente API FastAPI y Motor Local Web
    ├── vite.config.js   # Configuración PWA (Service Worker + Manifest)
    └── public/          # Íconos PWA y manifiesto
```

---

## 7. Instrucciones para Ejecución Local

### A. Backend (FastAPI):
```bash
# Instalar dependencias
pip install -r backend/requirements.txt

# Ejecutar suite de pruebas (30 tests)
python -m pytest backend/tests/ -v

# Iniciar servidor API en http://localhost:8000
python -m uvicorn backend.api.app:app --reload --port 8000
```
La documentación interactiva Swagger estará disponible en: `http://localhost:8000/docs`.

### B. Frontend (React + Vite + PWA):
```bash
cd frontend
npm install
npm run dev
```
La aplicación abrirá en: `http://localhost:5173`.

---

## 8. Limitaciones y Líneas Futuras

1. **Viento prescrito:** En la versión actual, el viento es un parámetro prescrito y uniforme o analítico; una versión avanzada acoplaría las ecuaciones de Navier-Stokes para dinámica de fluidos completa.
2. **Topografía y humedad:** No se incluye la elevación de la cordillera ni balance de calor por radiación solar diurna/nocturna, elementos que pueden agregarse incorporando términos fuente $+Q(x, y, t)$.
3. **Esquema temporal implícito:** Implementar Crank-Nicolson o ADI (Alternating Direction Implicit) permitiría dar pasos de tiempo $\Delta t$ arbitrariamente grandes sin restricción CFL, a costa de resolver sistemas de ecuaciones lineales en cada paso.
