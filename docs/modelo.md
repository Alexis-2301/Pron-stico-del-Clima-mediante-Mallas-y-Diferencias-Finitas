# Modelo matemático: Pronóstico del clima con diferencias finitas

> Documento de la **Fase 1**. Define la ecuación, el esquema numérico, la condición de estabilidad, los parámetros y los casos de prueba que validarán `core/schemes.py` y `core/stability.py`.

---

## 1. Objetivo

Simular la evolución de la temperatura $T$ sobre una región geográfica durante 24 horas, discretizando el espacio en una malla regular y el tiempo en pasos pequeños, usando el método de diferencias finitas.

**Alcance de la versión 1:** solo temperatura. Presión y humedad quedan fuera y se podrán añadir después reutilizando la misma estructura.

---

## 2. Ecuación gobernante

La temperatura $T(x, y, t)$ cambia por **difusión** (el calor se reparte entre zonas vecinas) y por **advección** (el viento transporta calor):

$$
\frac{\partial T}{\partial t} = \alpha \left( \frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2} \right) - u \frac{\partial T}{\partial x} - v \frac{\partial T}{\partial y}
$$

| Símbolo | Significado | Unidad |
|---|---|---|
| $T$ | Temperatura | °C |
| $\alpha$ | Coeficiente de difusión | m²/s |
| $u$ | Velocidad del viento hacia el Este | m/s |
| $v$ | Velocidad del viento hacia el Norte | m/s |

Esta ecuación es la versión formal del "Promedio de vecinos + Efecto Viento" del documento base del proyecto.

---

## 3. Discretización

### 3.1 Malla y convención de índices

- Malla regular con $\Delta x = \Delta y$.
- `i` = fila (Norte = `i+1`, Sur = `i-1`).
- `j` = columna (Este = `j+1`, Oeste = `j-1`).
- `T[i, j]` = temperatura del nodo en el instante actual.

```
              Norte
            T[i+1, j]
               |
Oeste  T[i, j-1] - T[i, j] - T[i, j+1]  Este
               |
            T[i-1, j]
              Sur
```

### 3.2 Números adimensionales

$$
r = \frac{\alpha \, \Delta t}{\Delta x^2} \qquad c_x = \frac{u \, \Delta t}{\Delta x} \qquad c_y = \frac{v \, \Delta t}{\Delta x}
$$

### 3.3 Término de difusión (FTCS: Forward Time, Centered Space)

$$
D_{i,j} = r \left( T_{i+1,j} + T_{i-1,j} + T_{i,j+1} + T_{i,j-1} - 4\,T_{i,j} \right)
$$

### 3.4 Término de viento (esquema upwind)

El esquema upwind toma la información del lado de donde **viene** el aire.

Para $u > 0$ y $v > 0$:

$$
A_{i,j} = -c_x \left( T_{i,j} - T_{i,j-1} \right) - c_y \left( T_{i,j} - T_{i-1,j} \right)
$$

Para $u < 0$ el término en $x$ pasa a ser $-c_x\,(T_{i,j+1} - T_{i,j})$, con $c_x$ conservando su signo (negativo). Para $v < 0$ el término en $y$ pasa a ser $-c_y\,(T_{i+1,j} - T_{i,j})$.

Resumen de implementación:

| Viento | Vecino usado en x | Vecino usado en y |
|---|---|---|
| $u > 0$ | `T[i, j-1]` (Oeste) | |
| $u < 0$ | `T[i, j+1]` (Este) | |
| $v > 0$ | | `T[i-1, j]` (Sur) |
| $v < 0$ | | `T[i+1, j]` (Norte) |

### 3.5 Paso de tiempo completo

$$
T^{n+1}_{i,j} = T^{n}_{i,j} + D_{i,j} + A_{i,j}
$$

### 3.6 Relación con el documento base

Cuando $r = \tfrac14$ y no hay viento, la fórmula se reduce a:

$$
T^{n+1}_{i,j} = \frac{T_{i+1,j} + T_{i-1,j} + T_{i,j+1} + T_{i,j-1}}{4}
$$

es decir, exactamente el "promedio de los nodos adyacentes" del documento. El esquema general es una versión más completa y controlable de esa idea.

---

## 4. Condición de estabilidad

El esquema explícito solo es estable si el paso de tiempo es suficientemente pequeño. Condición suficiente (la que implementará `stability.py`):

$$
4r + |c_x| + |c_y| \le 1
$$

Si se cumple, el coeficiente del nodo central permanece no negativo y el método no produce oscilaciones ni crecimiento descontrolado. Esta es la condición CFL generalizada a difusión más advección.

**Δt máximo permitido:**

$$
\Delta t_{max} = \frac{1}{\dfrac{4\alpha}{\Delta x^2} + \dfrac{|u|}{\Delta x} + \dfrac{|v|}{\Delta x}}
$$

### Ejemplo con valores de referencia

Con $\Delta x = 10\,000$ m, $\alpha = 5000$ m²/s, $u = 5$ m/s, $v = 0$:

| Δt | r | c_x | 4r + \|c_x\| | ¿Estable? |
|---|---|---|---|---|
| 600 s (10 min) | 0,03 | 0,3 | 0,42 | Sí |
| 3600 s (1 h) | 0,18 | 1,8 | 2,52 | **No** |

El segundo caso reproduce lo que advierte el documento base: saltar de hora en hora vuelve inestable el método.

---

## 5. Parámetros y supuestos de la versión 1

| Parámetro | Valor por defecto |
|---|---|
| Resolución de malla | $\Delta x = \Delta y = 10$ km |
| Tamaño de malla | 50 × 50 nodos (configurable) |
| Paso de tiempo | $\Delta t = 600$ s (10 min) |
| Duración | 24 h = 144 pasos |
| Difusión | $\alpha = 5000$ m²/s, constante |
| Viento | $u$, $v$ constantes y uniformes |
| Frontera | Temperatura fija (Dirichlet) |
| Condición inicial | Campo base uniforme con un punto caliente configurable |

**Limitaciones asumidas:**
- Viento y difusión uniformes (no dependen de la posición ni del tiempo).
- Sin efectos de relieve, radiación solar ni cambios de fase del agua.
- Es un modelo didáctico, no un modelo meteorológico operativo.

---

## 6. Casos de prueba verificados a mano

Malla de 5 × 5 con el nodo central `(2, 2) = 100` y el resto en `0`, salvo que se indique otra cosa. Se calcula **un solo paso** de tiempo.

### Caso A: difusión pura

- Parámetros: $r = 0{,}2$, $c_x = c_y = 0$.
- Centro: $100 + 0{,}2\,(0 + 0 + 0 + 0 - 400) = 20$.
- Vecino directo, por ejemplo `(2, 3)`: $0 + 0{,}2\,(100 + 0 + 0 + 0 - 0) = 20$.
- Resultado: centro = 20, cada uno de los 4 vecinos directos = 20, resto = 0.
- **Conservación:** $20 + 4 \cdot 20 = 100$.

### Caso B: promedio del documento base

- Parámetros: $r = 0{,}25$, sin viento.
- Centro: $100 + 0{,}25\,(-400) = 0$.
- Cada vecino directo: $0{,}25 \cdot 100 = 25$.
- Resultado: centro = 0, cada vecino directo = 25.
- **Conservación:** $4 \cdot 25 = 100$.

### Caso C: advección pura

- Parámetros: $r = 0$, $c_x = 0{,}5$, $u > 0$, $c_y = 0$.
- Centro: $100 - 0{,}5\,(100 - 0) = 50$.
- Nodo Este `(2, 3)`: $0 - 0{,}5\,(0 - 100) = 50$.
- Resultado: centro = 50, nodo Este = 50, resto = 0.
- **Conservación:** $50 + 50 = 100$.

### Caso D: campo uniforme

- Condición inicial: $T = 15$ en todos los nodos.
- Parámetros: cualquier $r$, $c_x$, $c_y$ estables.
- Resultado: el campo permanece en 15 en todos los nodos.

### Caso E: parámetros inestables

- Parámetros: cualquiera que cumpla $4r + |c_x| + |c_y| > 1$ (por ejemplo, $r = 0{,}18$ y $c_x = 1{,}8$).
- Resultado esperado: `stability.py` debe rechazar la configuración o emitir una advertencia clara.

### Resumen

| Caso | Parámetros | Resultado esperado |
|---|---|---|
| A | $r = 0{,}2$ | centro = 20, vecinos directos = 20 |
| B | $r = 0{,}25$ | centro = 0, vecinos directos = 25 |
| C | $c_x = 0{,}5$, $r = 0$ | centro = 50, nodo Este = 50 |
| D | $T = 15$ uniforme | sin cambios |
| E | $4r + \lvert c_x\rvert + \lvert c_y\rvert > 1$ | rechazado por `stability.py` |

---

## 7. Cómo se usarán estos casos

| Módulo | Pruebas que usan este documento |
|---|---|
| `core/schemes.py` | Casos A, B, C y D (valores exactos y conservación) |
| `core/stability.py` | Caso E y la tabla de la sección 4 |
| `core/simulator.py` | 144 pasos, sin valores `NaN`, conservación aproximada en dominio cerrado |
| `analysis/` | Comparación con la solución analítica de difusión de una gaussiana (Fase 6) |

---

## 8. Checklist de la Fase 1

- [x] Ecuación gobernante definida.
- [x] Discretización con índices y esquema upwind documentada.
- [x] Condición de estabilidad y $\Delta t_{max}$ definidos.
- [x] Parámetros y supuestos escritos.
- [x] Casos A a E verificados a mano (o en hoja de cálculo).
