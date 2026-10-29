"""Esquemas numéricos en diferencias finitas para clima-app.

Implementa la discretización espacial y temporal de la ecuación de
advección-difusión 2D:
    ∂T/∂t = α (∂²T/∂x² + ∂²T/∂y²) - u ∂T/∂x - v ∂T/∂y

Esquemas utilizados:
- Difusión: FTCS (Forward Time, Centered Space) de orden O(Δt, Δx²).
- Advección (viento): Upwind de primer orden O(Δt, Δx), condicional a la
  dirección del viento.

Toda la computación se realiza de forma vectorizada mediante slicing de NumPy.
"""

from __future__ import annotations
from typing import Literal
import numpy as np

from backend.core.grid import BoundaryType, apply_boundary_conditions


def step(
    T: np.ndarray,
    alpha: float,
    u: float | np.ndarray,
    v: float | np.ndarray,
    dx: float,
    dt: float,
    dy: float | None = None,
    boundary_type: BoundaryType = "dirichlet",
    fixed_boundary: np.ndarray | None = None,
) -> np.ndarray:
    """Avanza el campo de temperaturas un paso de tiempo Δt usando FTCS + Upwind.

    Args:
        T: Matriz 2D de temperatura actual (ny, nx).
        alpha: Coeficiente de difusión térmica (m²/s), α >= 0.
        u: Velocidad del viento hacia el Este (m/s), escalar o matriz 2D.
        v: Velocidad del viento hacia el Norte (m/s), escalar o matriz 2D.
        dx: Espaciado espacial en X (metros).
        dt: Paso de tiempo (segundos).
        dy: Espaciado espacial en Y (metros). Si es None, se asume dy = dx.
        boundary_type: 'dirichlet' (fija) o 'periodic' (periódica).
        fixed_boundary: Valores de referencia para frontera Dirichlet fija.

    Returns:
        np.ndarray: Nueva matriz 2D de temperaturas en t + Δt.
    """
    if dy is None:
        dy = dx

    if alpha < 0:
        raise ValueError(f"alpha debe ser no negativo. Recibido: {alpha}")
    if dx <= 0 or dy <= 0:
        raise ValueError(f"dx y dy deben ser positivos. Recibido: dx={dx}, dy={dy}")
    if dt <= 0:
        raise ValueError(f"dt debe ser positivo. Recibido: {dt}")

    # Inicializar nueva matriz con copia de T
    T_new = T.copy()

    # Slices de nodos internos y vecinos:
    # Fila i: Norte (i+1), Sur (i-1)
    # Columna j: Este (j+1), Oeste (j-1)
    T_c = T[1:-1, 1:-1]
    T_n = T[2:, 1:-1]
    T_s = T[:-2, 1:-1]
    T_e = T[1:-1, 2:]
    T_w = T[1:-1, :-2]

    # --- Término de difusión FTCS ---
    # r_x = alpha * dt / dx^2, r_y = alpha * dt / dy^2
    rx = alpha * dt / (dx * dx)
    ry = alpha * dt / (dy * dy)
    diff_term = rx * (T_e + T_w - 2.0 * T_c) + ry * (T_n + T_s - 2.0 * T_c)

    # --- Término de advección (Upwind) ---
    # cx = u * dt / dx, cy = v * dt / dy
    adv_x = _compute_upwind_x(T_c, T_e, T_w, u, dx, dt)
    adv_y = _compute_upwind_y(T_c, T_n, T_s, v, dy, dt)

    # Actualizar nodos internos
    T_new[1:-1, 1:-1] = T_c + diff_term + adv_x + adv_y

    # Aplicar condiciones de frontera
    apply_boundary_conditions(
        T_new,
        boundary_type=boundary_type,
        fixed_boundary=fixed_boundary if fixed_boundary is not None else T,
    )

    return T_new


def _compute_upwind_x(
    T_c: np.ndarray,
    T_e: np.ndarray,
    T_w: np.ndarray,
    u: float | np.ndarray,
    dx: float,
    dt: float,
) -> np.ndarray | float:
    """Calcula el término de advección en la dirección X (-u ∂T/∂x) con upwind."""
    if isinstance(u, (int, float, np.floating, np.integer)):
        if u == 0:
            return 0.0
        cx = u * dt / dx
        if u > 0:
            return -cx * (T_c - T_w)
        else:
            return -cx * (T_e - T_c)

    # Campo de viento u espacial 2D
    u_inner = u[1:-1, 1:-1] if u.shape == (T_c.shape[0] + 2, T_c.shape[1] + 2) else u
    cx = u_inner * dt / dx
    return np.where(u_inner > 0, -cx * (T_c - T_w), -cx * (T_e - T_c))


def _compute_upwind_y(
    T_c: np.ndarray,
    T_n: np.ndarray,
    T_s: np.ndarray,
    v: float | np.ndarray,
    dy: float,
    dt: float,
) -> np.ndarray | float:
    """Calcula el término de advección en la dirección Y (-v ∂T/∂y) con upwind."""
    if isinstance(v, (int, float, np.floating, np.integer)):
        if v == 0:
            return 0.0
        cy = v * dt / dy
        if v > 0:
            return -cy * (T_c - T_s)
        else:
            return -cy * (T_n - T_c)

    # Campo de viento v espacial 2D
    v_inner = v[1:-1, 1:-1] if v.shape == (T_c.shape[0] + 2, T_c.shape[1] + 2) else v
    cy = v_inner * dt / dy
    return np.where(v_inner > 0, -cy * (T_c - T_s), -cy * (T_n - T_c))
