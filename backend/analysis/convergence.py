"""Módulo de análisis de error y convergencia contra soluciones analíticas.

Compara la aproximación numérica por diferencias finitas (FTCS)
contra la solución analítica exacta de la ecuación del calor en 2D:
    ∂T/∂t = α ∇²T

Solución analítica de una perturbación gaussiana:
    T(x, y, t) = T_base + A_0 · (σ₀² / (σ₀² + 2αt)) · exp(-r² / (2(σ₀² + 2αt)))
donde r² = (x - x₀)² + (y - y₀)².
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Sequence
import numpy as np

from backend.core.grid import Grid
from backend.core.simulator import run_simulation


@dataclass
class ConvergenceResult:
    """Resultados de un estudio de refinamiento de malla."""

    dx_values: list[float]
    errors_l2: list[float]
    errors_linf: list[float]
    orders_l2: list[float]
    orders_linf: list[float]


def analytical_gaussian(
    x: np.ndarray,
    y: np.ndarray,
    t: float,
    alpha: float,
    x0: float,
    y0: float,
    sigma0: float,
    amplitude: float = 15.0,
    base_temp: float = 20.0,
) -> np.ndarray:
    """Evalúa la solución analítica exacta de difusión de una gaussiana 2D en el tiempo t.

    Args:
        x: Coordenadas espaciales X (2D o 1D meshgrid).
        y: Coordenadas espaciales Y (2D o 1D meshgrid).
        t: Tiempo transcurrido en segundos (t >= 0).
        alpha: Coeficiente de difusión térmica (m²/s).
        x0, y0: Centro de la gaussiana (metros).
        sigma0: Desviación estándar espacial inicial (metros).
        amplitude: Amplitud inicial sobre la temperatura base (°C).
        base_temp: Temperatura de fondo (°C).

    Returns:
        np.ndarray: Campo de temperatura exacto.
    """
    sigma_sq = (sigma0**2) + (2.0 * alpha * t)
    amp_t = amplitude * (sigma0**2) / sigma_sq
    r_sq = (x - x0) ** 2 + (y - y0) ** 2
    return base_temp + amp_t * np.exp(-r_sq / (2.0 * sigma_sq))


def compute_l2_error(numerical: np.ndarray, exact: np.ndarray) -> float:
    """Calcula el error RMS / norma L2 discreta normalizada."""
    diff = numerical - exact
    return float(np.sqrt(np.mean(diff**2)))


def compute_linf_error(numerical: np.ndarray, exact: np.ndarray) -> float:
    """Calcula el error máximo en norma infinito (L_inf)."""
    return float(np.max(np.abs(numerical - exact)))


def run_convergence_study(
    resolutions: Sequence[int] = (25, 49, 97),
    domain_length: float = 500_000.0,  # 500 km
    t_final: float = 3600.0,           # 1 hora
    alpha: float = 5000.0,
    sigma0: float = 40_000.0,          # 40 km
    amplitude: float = 15.0,
    base_temp: float = 20.0,
    r_target: float = 0.02,            # r pequeño para aislar el orden espacial O(Δx²)
) -> ConvergenceResult:
    """Ejecuta la simulación para distintas mallas y calcula el orden de convergencia.

    Al mantener r fijo, Δt ∝ Δx², asegurando que el error temporal O(Δt)
    disminuya a la misma tasa que el error espacial O(Δx²), permitiendo
    medir un orden de convergencia asintótico espacial cercano a 2.
    """
    dx_vals: list[float] = []
    l2_errs: list[float] = []
    linf_errs: list[float] = []

    x0 = domain_length / 2.0
    y0 = domain_length / 2.0

    for N in resolutions:
        dx = domain_length / (N - 1)
        # dt determinado por r_target para mantener estabilidad y relación cuadrática
        dt = r_target * (dx**2) / alpha

        # Coordenadas físicas de la malla
        # i (fila) -> y, j (columna) -> x
        y_coords = np.linspace(0, domain_length, N)
        x_coords = np.linspace(0, domain_length, N)
        X, Y = np.meshgrid(x_coords, y_coords)

        # Condición inicial evaluada en los nodos
        T_init = analytical_gaussian(
            X, Y, t=0.0, alpha=alpha, x0=x0, y0=y0, sigma0=sigma0,
            amplitude=amplitude, base_temp=base_temp,
        )

        grid = Grid(ny=N, nx=N, dx=dx, dy=dx, boundary_type="dirichlet", T=T_init)

        res = run_simulation(
            grid=grid,
            alpha=alpha,
            u=0.0,
            v=0.0,
            dt=dt,
            total_time=t_final,
            save_interval=t_final,
            enforce_stability=True,
        )

        T_final_num = res.snapshots[-1]
        T_final_exact = analytical_gaussian(
            X, Y, t=t_final, alpha=alpha, x0=x0, y0=y0, sigma0=sigma0,
            amplitude=amplitude, base_temp=base_temp,
        )

        # Evaluar error en los nodos internos (evitando influencia del borde Dirichlet)
        inner = (slice(1, -1), slice(1, -1))
        e_l2 = compute_l2_error(T_final_num[inner], T_final_exact[inner])
        e_linf = compute_linf_error(T_final_num[inner], T_final_exact[inner])

        dx_vals.append(dx)
        l2_errs.append(e_l2)
        linf_errs.append(e_linf)

    # Calcular órdenes de convergencia observados p = ln(e1/e2) / ln(dx1/dx2)
    orders_l2: list[float] = []
    orders_linf: list[float] = []
    for k in range(len(dx_vals) - 1):
        ratio_dx = dx_vals[k] / dx_vals[k + 1]
        p_l2 = np.log(l2_errs[k] / l2_errs[k + 1]) / np.log(ratio_dx)
        p_linf = np.log(linf_errs[k] / linf_errs[k + 1]) / np.log(ratio_dx)
        orders_l2.append(float(p_l2))
        orders_linf.append(float(p_linf))

    return ConvergenceResult(
        dx_values=dx_vals,
        errors_l2=l2_errs,
        errors_linf=linf_errs,
        orders_l2=orders_l2,
        orders_linf=orders_linf,
    )
