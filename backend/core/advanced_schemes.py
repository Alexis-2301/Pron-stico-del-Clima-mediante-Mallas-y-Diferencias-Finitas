"""Esquemas numéricos avanzados: RK4, ADI, Métodos semi-implícitos.

Implementa métodos de orden superior para mejorar precisión temporal
y permitir pasos de tiempo más grandes manteniendo estabilidad.
"""

from __future__ import annotations
from typing import Literal
import numpy as np
from scipy import linalg

from backend.core.grid import BoundaryType, apply_boundary_conditions
from backend.core.schemes import step as ftcs_step


def step_rk4(
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
    """Avanza usando Runge-Kutta de 4to orden (RK4).
    
    Precisión temporal: O(dt^4) vs O(dt) de FTCS puro.
    Permite dt 2-3x más grande manteniendo estabilidad.
    
    Args:
        T: Campo de temperatura actual (ny, nx)
        alpha: Difusividad térmica (m²/s)
        u, v: Velocidades de viento
        dx, dt, dy: Parámetros espaciales y temporales
        boundary_type, fixed_boundary: Condiciones de frontera
        
    Returns:
        T_new: Campo actualizado después de paso RK4
    """
    if dy is None:
        dy = dx
    
    # Coeficientes RK4
    dt_quarter = dt / 4.0
    
    # k1 = f(T^n)
    k1 = ftcs_step(T, alpha, u, v, dx, dt_quarter, dy, boundary_type, fixed_boundary)
    k1 = k1 - T  # Restamos T para obtener el incremento puro
    
    # k2 = f(T^n + dt/2 * k1)
    T_temp = T + (dt / 2.0) * k1
    apply_boundary_conditions(T_temp, boundary_type, fixed_boundary)
    k2 = ftcs_step(T_temp, alpha, u, v, dx, dt_quarter, dy, boundary_type, fixed_boundary)
    k2 = k2 - T_temp
    
    # k3 = f(T^n + dt/2 * k2)
    T_temp = T + (dt / 2.0) * k2
    apply_boundary_conditions(T_temp, boundary_type, fixed_boundary)
    k3 = ftcs_step(T_temp, alpha, u, v, dx, dt_quarter, dy, boundary_type, fixed_boundary)
    k3 = k3 - T_temp
    
    # k4 = f(T^n + dt * k3)
    T_temp = T + dt * k3
    apply_boundary_conditions(T_temp, boundary_type, fixed_boundary)
    k4 = ftcs_step(T_temp, alpha, u, v, dx, dt_quarter, dy, boundary_type, fixed_boundary)
    k4 = k4 - T_temp
    
    # T^{n+1} = T^n + (dt/6)(k1 + 2k2 + 2k3 + k4)
    T_new = T + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
    apply_boundary_conditions(T_new, boundary_type, fixed_boundary)
    
    return T_new


def step_adi(
    T: np.ndarray,
    alpha: float,
    dx: float,
    dt: float,
    dy: float | None = None,
    boundary_type: BoundaryType = "dirichlet",
    fixed_boundary: np.ndarray | None = None,
) -> np.ndarray:
    """Alternating Direction Implicit (ADI) para difusión pura.
    
    Incondicionalmente estable en difusión pura.
    Resuelve sistemas tridiagonales (Thomas algorithm) en O(N²).
    
    No incluye advección (viento).
    
    Args:
        T: Campo de temperatura (ny, nx)
        alpha: Difusividad térmica
        dx, dt, dy: Espaciado y paso temporal
        boundary_type, fixed_boundary: Condiciones frontera
        
    Returns:
        T_new: Temperatura después de paso ADI
    """
    if dy is None:
        dy = dx
    
    ny, nx = T.shape
    T_new = T.copy()
    
    # Coeficientes para la ecuación implícita
    rx = alpha * dt / (2.0 * dx * dx)
    ry = alpha * dt / (2.0 * dy * dy)
    
    # --- Paso 1: Resolver implícitamente en X (para cada fila) ---
    for i in range(1, ny - 1):
        # Sistema tridiagonal: a*T_{j-1} + b*T_j + c*T_{j+1} = d
        a = np.full(nx, -rx)
        b = np.full(nx, 1.0 + 2.0 * rx)
        c = np.full(nx, -rx)
        d = T[i, :].copy()
        
        # Condiciones de frontera Dirichlet
        if boundary_type == "dirichlet":
            b[0] = 1.0
            c[0] = 0.0
            a[0] = 0.0
            d[0] = fixed_boundary[i, 0] if fixed_boundary is not None else T[i, 0]
            
            b[-1] = 1.0
            a[-1] = 0.0
            c[-1] = 0.0
            d[-1] = fixed_boundary[i, -1] if fixed_boundary is not None else T[i, -1]
        
        # Resolver tridiagonal (Thomas algorithm)
        T_new[i, :] = _solve_tridiagonal(a, b, c, d)
    
    # --- Paso 2: Resolver implícitamente en Y (para cada columna) ---
    T = T_new.copy()
    for j in range(1, nx - 1):
        a = np.full(ny, -ry)
        b = np.full(ny, 1.0 + 2.0 * ry)
        c = np.full(ny, -ry)
        d = T[:, j].copy()
        
        # Condiciones de frontera
        if boundary_type == "dirichlet":
            b[0] = 1.0
            c[0] = 0.0
            a[0] = 0.0
            d[0] = fixed_boundary[0, j] if fixed_boundary is not None else T[0, j]
            
            b[-1] = 1.0
            a[-1] = 0.0
            c[-1] = 0.0
            d[-1] = fixed_boundary[-1, j] if fixed_boundary is not None else T[-1, j]
        
        T_new[:, j] = _solve_tridiagonal(a, b, c, d)
    
    return T_new


def _solve_tridiagonal(
    a: np.ndarray,
    b: np.ndarray,
    c: np.ndarray,
    d: np.ndarray,
) -> np.ndarray:
    """Resuelve sistema tridiagonal a*x_{i-1} + b*x_i + c*x_{i+1} = d.
    
    Algoritmo de Thomas (TDMA): O(N) en lugar de O(N³).
    
    Args:
        a: Subdiagonal (coeficiente de x_{i-1})
        b: Diagonal principal (coeficiente de x_i)
        c: Superdiagonal (coeficiente de x_{i+1})
        d: Término independiente
        
    Returns:
        x: Solución del sistema
    """
    n = len(d)
    x = np.zeros(n)
    
    # Eliminación hacia adelante (forward sweep)
    c_prime = np.zeros(n)
    d_prime = np.zeros(n)
    
    c_prime[0] = c[0] / b[0]
    d_prime[0] = d[0] / b[0]
    
    for i in range(1, n):
        denom = b[i] - a[i] * c_prime[i - 1]
        if abs(denom) < 1e-15:
            denom = 1e-15
        c_prime[i] = c[i] / denom
        d_prime[i] = (d[i] - a[i] * d_prime[i - 1]) / denom
    
    # Sustitución hacia atrás (back substitution)
    x[-1] = d_prime[-1]
    for i in range(n - 2, -1, -1):
        x[i] = d_prime[i] - c_prime[i] * x[i + 1]
    
    return x


def step_cranck_nicolson(
    T: np.ndarray,
    alpha: float,
    dx: float,
    dt: float,
    dy: float | None = None,
    boundary_type: BoundaryType = "dirichlet",
    fixed_boundary: np.ndarray | None = None,
) -> np.ndarray:
    """Crank-Nicolson: promedio entre FTCS explícito e implícito puro.
    
    Precisión: O(dt², dx²)
    Estabilidad: Incondicionalmente estable para difusión
    Complejidad: O(N²) (sistema implícito discreto)
    
    Fórmula:
        T^{n+1} = T^n + (dt/2)[f(T^n) + f(T^{n+1})]
    """
    if dy is None:
        dy = dx
    
    ny, nx = T.shape
    r_x = alpha * dt / (2.0 * dx * dx)
    r_y = alpha * dt / (2.0 * dy * dy)
    
    # Ensamblamos matriz 2D como sistema 1D
    # Ordenamiento: lexicográfico por fila-columna
    size = (ny - 2) * (nx - 2)
    
    A = np.zeros((size, size))
    b = np.zeros(size)
    
    idx = 0
    for i in range(1, ny - 1):
        for j in range(1, nx - 1):
            idx_center = (i - 1) * (nx - 2) + (j - 1)
            
            # Términos implícitos en la diagonal
            A[idx_center, idx_center] = 1.0 + 2.0 * r_x + 2.0 * r_y
            
            # Términos en vecinos
            if j > 1:
                A[idx_center, idx_center - 1] = -r_x
            if j < nx - 2:
                A[idx_center, idx_center + 1] = -r_x
            if i > 1:
                A[idx_center, idx_center - (nx - 2)] = -r_y
            if i < ny - 2:
                A[idx_center, idx_center + (nx - 2)] = -r_y
            
            # Término derecho (explícito)
            b[idx_center] = T[i, j] + r_x * (T[i, j + 1] + T[i, j - 1] - 2 * T[i, j]) + \
                           r_y * (T[i + 1, j] + T[i - 1, j] - 2 * T[i, j])
            
            idx += 1
    
    # Resolver sistema lineal
    T_interior = linalg.solve(A, b)
    
    # Reconstruir matriz completa
    T_new = T.copy()
    idx = 0
    for i in range(1, ny - 1):
        for j in range(1, nx - 1):
            T_new[i, j] = T_interior[idx]
            idx += 1
    
    # Aplicar condiciones de frontera
    apply_boundary_conditions(T_new, boundary_type, fixed_boundary)
    
    return T_new


def step_beam_warming(
    T: np.ndarray,
    alpha: float,
    u: float,
    v: float,
    dx: float,
    dt: float,
    dy: float | None = None,
    boundary_type: BoundaryType = "dirichlet",
    fixed_boundary: np.ndarray | None = None,
) -> np.ndarray:
    """Beam-Warming: esquema de 2do orden upwind para advección.
    
    Combina upwind simple con corrección de orden superior.
    Preciso para advección pura: O(dt, dx)
    Menos difusivo numéricamente que upwind estándar.
    
    Usa stencil de 3 puntos (en lugar de 2) para mayor precisión.
    """
    if dy is None:
        dy = dx
    
    T_new = T.copy()
    
    ny, nx = T.shape
    cx_x = u * dt / dx
    cy_y = v * dt / dy
    
    # Nodos internos (excluyendo frontera)
    for i in range(1, ny - 1):
        for j in range(1, nx - 1):
            T_c = T[i, j]
            
            # Advección en X (Beam-Warming)
            if u > 0:  # Viento hacia Este
                if j > 1:
                    # Reconstrucción cuadrática hacia atrás
                    T_x_approx = T[i, j] - cx_x * (T[i, j] - T[i, j - 1]) + \
                                (cx_x**2 / 2.0) * (T[i, j] - 2 * T[i, j - 1] + T[i, j - 2])
                else:
                    T_x_approx = T[i, j] - cx_x * (T[i, j] - T[i, j - 1])
            else:  # Viento hacia Oeste
                if j < nx - 2:
                    T_x_approx = T[i, j] - cx_x * (T[i, j + 1] - T[i, j]) + \
                                (cx_x**2 / 2.0) * (T[i, j + 2] - 2 * T[i, j + 1] + T[i, j])
                else:
                    T_x_approx = T[i, j] - cx_x * (T[i, j + 1] - T[i, j])
            
            # Advección en Y (Beam-Warming)
            if v > 0:  # Viento hacia Norte
                if i > 1:
                    T_y_approx = T[i, j] - cy_y * (T[i, j] - T[i - 1, j]) + \
                                (cy_y**2 / 2.0) * (T[i, j] - 2 * T[i - 1, j] + T[i - 2, j])
                else:
                    T_y_approx = T[i, j] - cy_y * (T[i, j] - T[i - 1, j])
            else:
                if i < ny - 2:
                    T_y_approx = T[i, j] - cy_y * (T[i + 1, j] - T[i, j]) + \
                                (cy_y**2 / 2.0) * (T[i + 2, j] - 2 * T[i + 1, j] + T[i, j])
                else:
                    T_y_approx = T[i, j] - cy_y * (T[i + 1, j] - T[i, j])
            
            # Promedio de advección X e Y
            T_new[i, j] = 0.5 * (T_x_approx + T_y_approx) + 0.5 * T_c
    
    apply_boundary_conditions(T_new, boundary_type, fixed_boundary)
    
    return T_new


# Registro de esquemas disponibles
AVAILABLE_SCHEMES = {
    'ftcs': ftcs_step,
    'rk4': step_rk4,
    'adi': step_adi,
    'cranck_nicolson': step_cranck_nicolson,
    'beam_warming': step_beam_warming,
}


def get_scheme_by_name(name: str) -> callable:
    """Obtiene función de esquema por nombre."""
    if name not in AVAILABLE_SCHEMES:
        raise ValueError(f"Esquema '{name}' no disponible. Use: {list(AVAILABLE_SCHEMES.keys())}")
    return AVAILABLE_SCHEMES[name]
