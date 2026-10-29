"""Esquemas Pydantic para la API REST de clima-app."""

from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field, model_validator

from backend.core.stability import calculate_dt_max, check_stability


class StabilityRequest(BaseModel):
    """Parámetros para consultar el límite de estabilidad."""

    alpha: float = Field(5000.0, ge=0, description="Difusividad térmica (m²/s)")
    u: float = Field(5.0, description="Velocidad del viento hacia el Este (m/s)")
    v: float = Field(0.0, description="Velocidad del viento hacia el Norte (m/s)")
    dx: float = Field(10_000.0, gt=0, description="Espaciado espacial en X (metros)")
    dy: float | None = Field(None, gt=0, description="Espaciado espacial en Y (metros)")
    dt: float = Field(600.0, gt=0, description="Paso de tiempo propuesto (segundos)")


class StabilityResponse(BaseModel):
    """Resultado del análisis de estabilidad CFL y Fourier."""

    is_stable: bool
    dt: float
    dt_max: float
    r: float
    cx: float
    cy: float
    cfl: float
    combined_factor: float
    message: str


class SimulateRequest(BaseModel):
    """Parámetros de entrada para la simulación numérica."""

    ny: int = Field(50, ge=3, le=150, description="Nodos en dirección Y")
    nx: int = Field(50, ge=3, le=150, description="Nodos en dirección X")
    dx: float = Field(10_000.0, gt=0, description="Espaciado de malla en X (metros)")
    dy: float | None = Field(None, gt=0, description="Espaciado de malla en Y (metros)")
    alpha: float = Field(5000.0, ge=0, description="Difusividad térmica (m²/s)")
    u: float = Field(5.0, description="Viento en dirección Este (m/s)")
    v: float = Field(0.0, description="Viento en dirección Norte (m/s)")
    dt: float = Field(600.0, gt=0, description="Paso de tiempo (segundos)")
    total_time: float = Field(86_400.0, gt=0, le=86_400.0 * 3, description="Duración total en segundos (default 24 h)")
    save_interval: float = Field(600.0, gt=0, description="Frecuencia de guardado de instantáneas en segundos")
    base_temp: float = Field(20.0, description="Temperatura ambiental de fondo (°C)")
    hot_spot_temp: float = Field(35.0, description="Temperatura pico del punto caliente (°C)")
    hot_spot_sigma: float = Field(4.0, gt=0, description="Radio/dispersión de la perturbación en celdas")
    boundary_type: Literal["dirichlet", "periodic"] = Field("dirichlet", description="Condición de frontera")
    enforce_stability: bool = Field(True, description="Si es True, rechaza pasos de tiempo inestables con error 400")

    @model_validator(mode="after")
    def validate_cfl_stability(self) -> SimulateRequest:
        """Valida si el paso de tiempo viola la condición de estabilidad."""
        if self.enforce_stability:
            dy_val = self.dy if self.dy is not None else self.dx
            report = check_stability(
                alpha=self.alpha,
                u=self.u,
                v=self.v,
                dx=self.dx,
                dt=self.dt,
                dy=dy_val,
            )
            if not report.is_stable:
                raise ValueError(
                    f"Paso de tiempo inestable detectado: dt={self.dt} s excede dt_max={report.dt_max:.1f} s. "
                    f"Factor combinado: {report.combined_factor:.3f} > 1.0. "
                    f"Reduzca dt o desactive enforce_stability para pruebas de divergencia."
                )
        return self


class SimulateResponse(BaseModel):
    """Respuesta completa de la simulación con matrices y metadatos."""

    snapshots: list[list[list[float]]]
    timestamps: list[float]
    dt: float
    total_time: float
    steps_executed: int
    computation_time_seconds: float
    stability: StabilityResponse
    grid_shape: list[int]
    stats: dict[str, list[float]]
    metadata: dict
