"""Motor de simulación temporal para clima-app.

Ejecuta el ciclo de avance temporal (por defecto 24 horas = 86400 s,
con Δt = 600 s para un total de 144 pasos), capturando instantáneas
periódicas del campo de temperatura.
"""

from __future__ import annotations
from dataclasses import dataclass, field
import time
from typing import Sequence
import numpy as np

from backend.core.grid import BoundaryType, Grid
from backend.core.schemes import step
from backend.core.stability import StabilityReport, check_stability


@dataclass
class SimulationResult:
    """Contenedor de resultados de la simulación."""

    snapshots: list[np.ndarray]  # Lista de matrices 2D (ny, nx)
    timestamps: list[float]      # Tiempo simulado en segundos para cada instantánea
    dt: float
    total_time: float
    steps_executed: int
    computation_time_seconds: float
    stability_report: StabilityReport
    grid_shape: tuple[int, int]
    metadata: dict = field(default_factory=dict)

    @property
    def num_snapshots(self) -> int:
        """Cantidad de instantáneas guardadas."""
        return len(self.snapshots)

    def as_array(self) -> np.ndarray:
        """Retorna todas las instantáneas como un arreglo 3D (tiempo, ny, nx)."""
        return np.stack(self.snapshots, axis=0)

    def get_node_history(self, i: int, j: int) -> np.ndarray:
        """Obtiene la serie temporal de temperatura para un nodo específico (i, j)."""
        return np.array([snap[i, j] for snap in self.snapshots])

    def get_global_stats(self) -> dict[str, list[float]]:
        """Calcula métricas globales (min, max, mean) para cada instantánea."""
        return {
            "min": [float(np.min(s)) for s in self.snapshots],
            "max": [float(np.max(s)) for s in self.snapshots],
            "mean": [float(np.mean(s)) for s in self.snapshots],
        }


def run_simulation(
    grid: Grid,
    alpha: float = 5000.0,
    u: float | np.ndarray = 5.0,
    v: float | np.ndarray = 0.0,
    dt: float = 600.0,
    total_time: float = 86_400.0,
    save_interval: float = 600.0,
    enforce_stability: bool = False,
) -> SimulationResult:
    """Ejecuta una simulación completa de pronóstico meteorológico.

    Args:
        grid: Instancia de Grid con la malla y temperaturas iniciales.
        alpha: Difusividad térmica en m²/s (default 5000.0).
        u: Viento Este-Oeste en m/s (default 5.0).
        v: Viento Norte-Sur en m/s (default 0.0).
        dt: Paso temporal en segundos (default 600.0 = 10 min).
        total_time: Tiempo total a simular en segundos (default 86400.0 = 24 h).
        save_interval: Intervalo entre instantáneas guardadas en segundos (default 600.0).
        enforce_stability: Si True, lanza ValueError si el esquema es inestable.

    Returns:
        SimulationResult con todas las instantáneas y metadatos.
    """
    if total_time <= 0:
        raise ValueError(f"total_time debe ser positivo. Recibido: {total_time}")
    if dt <= 0:
        raise ValueError(f"dt debe ser positivo. Recibido: {dt}")

    # Chequeo de estabilidad
    report = check_stability(alpha=alpha, u=u, v=v, dx=grid.dx, dt=dt, dy=grid.dy)
    if enforce_stability and not report.is_stable:
        raise ValueError(report.message)

    # Estado actual (copia para no mutar el grid original)
    T_current = grid.T.copy()
    fixed_boundary = grid._fixed_boundaries

    snapshots: list[np.ndarray] = [T_current.copy()]
    timestamps: list[float] = [0.0]

    current_time = 0.0
    next_save_time = save_interval
    steps_executed = 0

    t_start = time.perf_counter()

    while current_time < total_time - 1e-9:
        # Ajustar dt si el último paso supera total_time
        step_dt = min(dt, total_time - current_time)

        T_current = step(
            T=T_current,
            alpha=alpha,
            u=u,
            v=v,
            dx=grid.dx,
            dt=step_dt,
            dy=grid.dy,
            boundary_type=grid.boundary_type,
            fixed_boundary=fixed_boundary,
        )

        current_time += step_dt
        steps_executed += 1

        # Guardar instantánea si corresponde
        if current_time >= next_save_time - 1e-9 or current_time >= total_time - 1e-9:
            snapshots.append(T_current.copy())
            timestamps.append(current_time)
            next_save_time += save_interval

    computation_time = time.perf_counter() - t_start

    return SimulationResult(
        snapshots=snapshots,
        timestamps=timestamps,
        dt=dt,
        total_time=total_time,
        steps_executed=steps_executed,
        computation_time_seconds=computation_time,
        stability_report=report,
        grid_shape=grid.shape,
        metadata={
            "alpha": alpha,
            "u": float(np.mean(u)) if isinstance(u, np.ndarray) else u,
            "v": float(np.mean(v)) if isinstance(v, np.ndarray) else v,
            "dx": grid.dx,
            "dy": grid.dy,
            "boundary_type": grid.boundary_type,
        },
    )
