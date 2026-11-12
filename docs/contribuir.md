# 👨‍💻 Guía de Contribución - Estándares del Proyecto

## 📋 Tabla de Contenidos
1. [Setup de Desarrollo](#setup-de-desarrollo)
2. [Estándares de Código](#estándares-de-código)
3. [Flujo de Git](#flujo-de-git)
4. [Testing](#testing)
5. [Documentación](#documentación)
6. [Checklist de PR](#checklist-de-pr)

---

## Setup de Desarrollo

### 1. Clonar y crear rama

```bash
git clone https://github.com/yourusername/clima-app.git
cd clima-app
git checkout -b feature/mi-nueva-feature
```

### 2. Entorno Python

```bash
# Crear venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Instalar dependencias + dev
pip install -r backend/requirements.txt
pip install black mypy pytest pytest-cov pylint isort
```

### 3. Entorno Node.js

```bash
cd frontend
npm install
npm run dev  # Servidor de desarrollo en http://localhost:5173
```

### 4. Variables de entorno

```bash
# En raíz del proyecto: .env.local
cat > .env.local << 'EOF'
OPENWEATHER_API_KEY=demo
AEMET_API_KEY=demo
LOG_LEVEL=DEBUG
EOF
```

---

## Estándares de Código

### Python (Backend)

**1. Formato con Black**
```bash
# Formatear código automáticamente
black backend/

# Verificar sin cambiar
black --check backend/
```

**2. Type Checking con mypy**
```bash
# Verificar tipos
mypy backend/core/simulator.py

# Mostrar errores
mypy --strict backend/
```

**3. Linting con pylint**
```bash
pylint backend/core/*.py

# Configuración en .pylintrc
[MASTER]
max-line-length=120
disable=too-many-arguments
```

**4. Ordenar imports con isort**
```bash
# Ordenar automáticamente
isort backend/

# Verificar
isort --check-only backend/
```

**Ejemplo de código bien formateado:**
```python
"""Módulo de simulación meteorológica.

Descripción detallada del módulo...
"""

from __future__ import annotations
from typing import Literal
import numpy as np

from backend.core.grid import Grid
from backend.core.stability import check_stability


def run_simulation(
    grid: Grid,
    alpha: float = 5000.0,
    scheme: Literal['ftcs', 'rk4', 'adi'] = 'ftcs',
) -> SimulationResult:
    """Ejecuta una simulación meteorológica.
    
    Args:
        grid: Instancia Grid con malla inicial.
        alpha: Difusividad térmica en m²/s.
        scheme: Esquema numérico a usar.
        
    Returns:
        SimulationResult con snapshots y metadatos.
        
    Raises:
        ValueError: Si los parámetros son inválidos.
    """
    # Validaciones
    if alpha < 0:
        raise ValueError(f"alpha debe ser ≥ 0, recibido {alpha}")
    
    # Lógica principal
    ...
    
    return result
```

### JavaScript/React (Frontend)

**1. Prettier (formato)**
```bash
npx prettier --write frontend/src/

# Configuración en .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**2. ESLint (linting)**
```bash
npx eslint frontend/src/

# Autofix
npx eslint --fix frontend/src/
```

**Ejemplo de código React bien escrito:**
```jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Componente que muestra el estado de simulación.
 * 
 * @param {Object} props - Propiedades
 * @param {number} props.progress - Progreso 0-100
 * @param {string} props.status - 'idle'|'running'|'done'|'error'
 * @param {Function} props.onCancel - Callback al cancelar
 * @returns {JSX.Element}
 */
function SimulationStatus({ progress, status, onCancel }) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (status === 'done') {
      // Notificación
      console.log('Simulación completada');
    }
  }, [status]);

  return (
    <div
      className="rounded-lg border p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span>Error en simulación</span>
        </div>
      )}
      {/* Más JSX */}
    </div>
  );
}

export default SimulationStatus;
```

---

## Flujo de Git

### Rama: Nomenclatura

```bash
# Nuevas funcionalidades
git checkout -b feature/nombre-descriptivo

# Correcciones de bugs
git checkout -b bugfix/descripcion-bug

# Mejoras/refactoring
git checkout -b refactor/descripcion

# Documentación
git checkout -b docs/tema
```

### Commits

```bash
# Mensaje descriptivo y específico
git commit -m "Add RK4 scheme for temporal integration

- Implement step_rk4() in advanced_schemes.py
- Update simulator to support 'rk4' parameter
- Add tests for convergence order O(dt^4)
- Allows 3x larger timesteps vs FTCS"

# Mejor que:
git commit -m "Add RK4"
```

**Convención:**
```
<tipo>(<ámbito>): <sujeto>

<cuerpo>

<pie>
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato (no afecta lógica)
- `refactor`: Refactoring (sin cambiar comportamiento)
- `perf`: Mejora de rendimiento
- `test`: Agregar/actualizar tests

**Ejemplo:**
```bash
git commit -m "feat(schemes): add Crank-Nicolson method

Implement semi-implicit Crank-Nicolson scheme with O(dt², dx²) precision.
Inconditionall stable for diffusion-only problems.

- Add step_cranck_nicolson() to advanced_schemes.py
- Implement tridiagonal solver (Thomas algorithm)
- Add benchmarks: ~2x slower than RK4 but unconditionally stable
- Update API to accept scheme='crank_nicolson'

Fixes #42
Relates to #35"
```

### Push y Pull Request

```bash
# Actualizar rama local
git fetch origin
git rebase origin/main

# Push
git push origin feature/mi-feature

# En GitHub: Crear PR con descripción clara
```

**Template de PR:**
```markdown
## Descripción
Breve descripción de qué hace esta PR.

## Tipo de cambio
- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Mejora de performance
- [ ] Documentación

## Cambios
- Punto 1
- Punto 2

## Testing
Cómo se probó:
```bash
pytest backend/tests/test_new_feature.py
```

## Checklist
- [ ] Código formateado con Black
- [ ] Types correctos (mypy)
- [ ] Tests pasan
- [ ] Documentación actualizada
```

---

## Testing

### Estructura de tests

```
backend/tests/
├── test_grid.py
├── test_schemes.py
├── test_stability.py
├── test_advanced_schemes.py  # NUEVO
├── test_simulator.py
├── test_api.py
└── fixtures.py
```

### Escribir un test

```python
import pytest
from backend.core.advanced_schemes import step_rk4
from backend.core.grid import create_hotspot_grid


class TestRK4:
    """Pruebas para el esquema RK4."""

    @pytest.fixture
    def simple_grid(self):
        """Malla de prueba 10x10."""
        return create_hotspot_grid(
            ny=10, nx=10,
            base_temp=20.0,
            hot_spot_temp=30.0,
            sigma=2.0
        )

    def test_rk4_preserves_energy(self, simple_grid):
        """RK4 no debe crear ni destruir energía térmica."""
        alpha = 1000.0
        u, v, dx, dt = 0.0, 0.0, 10000.0, 300.0

        T_initial = simple_grid.T.copy()
        energy_initial = np.sum(T_initial)

        T_new = step_rk4(T_initial, alpha, u, v, dx, dt, boundary_type='periodic')
        energy_final = np.sum(T_new)

        # Pequeña tolerancia por errores numéricos
        assert abs(energy_final - energy_initial) < energy_initial * 0.01

    def test_rk4_convergence_order(self):
        """Verifica orden de convergencia O(dt^4)."""
        from backend.core.schemes import step as ftcs_step

        ny, nx = 50, 50
        T_exact = np.exp(-np.linspace(0, 10, ny * nx)).reshape(ny, nx)

        errors = []
        dts = [0.1, 0.05, 0.025]

        for dt in dts:
            T = T_exact.copy()
            T = step_rk4(T, alpha=100, u=0, v=0, dx=1, dt=dt, boundary_type='periodic')
            error = np.linalg.norm(T - T_exact)
            errors.append(error)

        # Orden debería ser ~4
        ratio = errors[0] / errors[1]
        order = np.log2(ratio) / np.log2(dts[0] / dts[1])
        
        assert 3.5 < order < 4.5, f"Order {order} is not close to 4"
```

### Ejecutar tests

```bash
# Todos los tests
pytest backend/tests/

# Con cobertura
pytest backend/tests/ --cov=backend --cov-report=html

# Tests específicos
pytest backend/tests/test_advanced_schemes.py::TestRK4::test_rk4_convergence_order -v

# Modo watch (requiere pytest-watch)
ptw backend/tests/
```

---

## Documentación

### Docstrings (Python)

```python
def step_rk4(
    T: np.ndarray,
    alpha: float,
    ...
) -> np.ndarray:
    """Avanza la simulación usando Runge-Kutta 4to orden.
    
    Implementa el esquema RK4 para la ecuación de advección-difusión:
        ∂T/∂t = α∇²T - u·∂T/∂x - v·∂T/∂y
    
    Precisión temporal: O(Δt⁴)
    Pasos temporales: Hasta 3x más grandes que FTCS manteniendo estabilidad
    
    Args:
        T: Campo de temperatura [K] en nodos interiores de malla (ny, nx)
        alpha: Difusividad térmica [m²/s], α ≥ 0
        u: Componente zonal de viento [m/s], escalar o matriz (ny, nx)
        v: Componente meridional de viento [m/s], escalar o matriz (ny, nx)
        dx: Espaciado en dirección X [m], dx > 0
        dt: Paso de tiempo [s], dt > 0
        dy: Espaciado en dirección Y [m] (default: dy = dx)
        boundary_type: 'dirichlet' (fija) o 'periodic' (periódica)
        fixed_boundary: Valores de referencia para frontera Dirichlet
        
    Returns:
        T_new: Campo de temperatura en t + Δt, mismo shape que T
        
    Raises:
        ValueError: Si dt ≤ 0 o dx ≤ 0
        
    Examples:
        >>> import numpy as np
        >>> T = np.random.randn(50, 50)
        >>> T_new = step_rk4(T, alpha=6000, u=8, v=3, dx=10000, dt=450)
        >>> T_new.shape
        (50, 50)
        
    Notes:
        - Usa 4 evaluaciones de la función RHS por paso (vs 1 en FTCS)
        - Mejor que FTCS para advección dominante
        - Mantiene estabilidad bajo CFL modificado
        
    References:
        - Butcher, J. C. (2008). Numerical Methods for Ordinary Differential Equations
        - Press et al. (2007). Numerical Recipes (3rd ed.), Ch. 17.2
    """
    ...
```

### Markdown (Documentos)

```markdown
## Título de Sección

Párrafo introductorio que explique qué y por qué.

### Subsección

Detalles técnicos aquí.

**Destacado:** Información importante en negrita.

\`\`\`python
# Código de ejemplo
result = calculate_something()
\`\`\`

> Nota importante en blockquote

| Columna1 | Columna2 |
|----------|----------|
| Valor    | Valor    |

- Viñeta 1
- Viñeta 2
  - Sub-viñeta
```

---

## Checklist de PR

Antes de hacer un **Pull Request**:

```bash
# 1. Código limpio
black backend/
isort backend/
npx prettier --write frontend/src/

# 2. Linting
mypy backend/ --strict
pylint backend/core/*.py
npx eslint frontend/src/

# 3. Tests
pytest backend/tests/ -v --cov=backend
npm run test  # si existe

# 4. Build
npm run build  # Frontend
python -m py_compile backend/**/*.py  # Backend

# 5. Documentación
# - ¿Actualicé docstrings?
# - ¿Actualicé docs/ si es cambio de API?
# - ¿Agregué ejemplos de uso?

# 6. Commits
git log --oneline origin/main..HEAD
# Verificar que los mensajes sean descriptivos

# 7. Push
git push origin feature/mi-feature
```

---

**Generado:** Noviembre 2024 | Proyecto: Pronóstico Meteorológico v2.0
