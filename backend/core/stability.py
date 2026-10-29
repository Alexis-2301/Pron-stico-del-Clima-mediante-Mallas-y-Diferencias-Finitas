"""Módulo de análisis de estabilidad y condición CFL para clima-app.

Verifica la condición de estabilidad numérica combinada (difusión FTCS + advección Upwind):
    4r + |c_x| + |c_y| <= 1

donde:
    r = α · Δt / Δx²
    c_x = u · Δt / Δx
    c_y = v · Δt / Δy
"""

from __future__ import annotations
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class StabilityReport:
    """Reporte detallado de los parámetros de estabilidad del esquema."""

    is_stable: bool
    dt: float
    dt_max: float
    r: float
    cx: float
    cy: float
    cfl: float
    combined_factor: float
    message: str


def calculate_dt_max(
    alpha: float,
    u: float | np.ndarray,
    v: float | np.ndarray,
    dx: float,
    dy: float | None = None,
) -> float:
    """Calcula el paso de tiempo máximo permitido (Δt_max) para garantizar estabilidad.

    Δt_max = 1 / (2α/Δx² + 2α/Δy² + |u_max|/Δx + |v_max|/Δy)
    """
    if dy is None:
        dy = dx

    if alpha < 0 or dx <= 0 or dy <= 0:
        raise ValueError("Parámetros espaciales y de difusión deben ser positivos (alpha >= 0, dx > 0, dy > 0).")

    # Extraer velocidades máximas si son arreglos 2D
    u_max = float(np.max(np.abs(u)))
    v_max = float(np.max(np.abs(v)))

    denom = (2.0 * alpha / (dx * dx)) + (2.0 * alpha / (dy * dy)) + (u_max / dx) + (v_max / dy)

    if denom <= 0.0:
        return float("inf")

    return 1.0 / denom


def check_stability(
    alpha: float,
    u: float | np.ndarray,
    v: float | np.ndarray,
    dx: float,
    dt: float,
    dy: float | None = None,
    tolerance: float = 1e-9,
) -> StabilityReport:
    """Analiza si la combinación de parámetros numéricos y físicos es estable.

    Condición: S = 4r + |cx| + |cy| <= 1.0
    """
    if dy is None:
        dy = dx

    if dt <= 0:
        raise ValueError(f"dt debe ser positivo. Recibido: {dt}")

    dt_max = calculate_dt_max(alpha, u, v, dx, dy)

    u_max = float(np.max(np.abs(u)))
    v_max = float(np.max(np.abs(v)))

    rx = alpha * dt / (dx * dx)
    ry = alpha * dt / (dy * dy)
    cx = u_max * dt / dx
    cy = v_max * dt / dy

    cfl = cx + cy
    diff_factor = 2.0 * rx + 2.0 * ry
    combined = diff_factor + cfl

    is_stable = combined <= (1.0 + tolerance)

    if is_stable:
        msg = (
            f"Configuración ESTABLE: factor combinado = {combined:.4f} <= 1.0 "
            f"(Δt = {dt:.1f} s <= Δt_max = {dt_max:.1f} s)."
        )
    else:
        exceso = combined - 1.0
        msg = (
            f"Configuración INESTABLE: factor combinado = {combined:.4f} > 1.0 "
            f"(supera el límite por {exceso:.4f}). "
            f"El paso Δt = {dt:.1f} s excede el máximo permitido Δt_max = {dt_max:.1f} s. "
            f"El pronóstico numérico divergerá."
        )

    return StabilityReport(
        is_stable=is_stable,
        dt=dt,
        dt_max=dt_max,
        r=rx,
        cx=cx,
        cy=cy,
        cfl=cfl,
        combined_factor=combined,
        message=msg,
    )


def validate_stability_or_raise(
    alpha: float,
    u: float | np.ndarray,
    v: float | np.ndarray,
    dx: float,
    dt: float,
    dy: float | None = None,
) -> StabilityReport:
    """Valida estabilidad y lanza ValueError si el esquema resulta inestable."""
    report = check_stability(alpha, u, v, dx, dt, dy)
    if not report.is_stable:
        raise ValueError(report.message)
    return report
