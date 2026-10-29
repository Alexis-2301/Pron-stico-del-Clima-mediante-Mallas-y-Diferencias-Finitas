"""Aplicación principal FastAPI para clima-app."""

from __future__ import annotations
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from backend.api.schemas import (
    SimulateRequest,
    SimulateResponse,
    StabilityResponse,
)
from backend.core.grid import Grid, create_hotspot_grid
from backend.core.simulator import run_simulation
from backend.core.stability import check_stability

app = FastAPI(
    title="Clima-App API",
    description="Motor numérico meteorológico basado en diferencias finitas (advección-difusión 2D)",
    version="1.0.0",
)

# Permitir CORS para desarrollo con React / Vite y PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Estado"])
def root_status() -> dict[str, str]:
    """Ruta raíz de verificación de salud."""
    return {
        "status": "online",
        "service": "Clima-App Numerical API",
        "docs_url": "/docs",
    }


@app.get("/stability", response_model=StabilityResponse, tags=["Estabilidad"])
def get_stability(
    alpha: float = Query(5000.0, ge=0, description="Difusividad térmica (m²/s)"),
    u: float = Query(5.0, description="Velocidad del viento en X (m/s)"),
    v: float = Query(0.0, description="Velocidad del viento en Y (m/s)"),
    dx: float = Query(10_000.0, gt=0, description="Espaciado espacial en metros"),
    dy: float | None = Query(None, gt=0, description="Espaciado espacial en Y"),
    dt: float = Query(600.0, gt=0, description="Paso temporal propuesto (segundos)"),
) -> StabilityResponse:
    """Calcula el Δt máximo permitido y evalúa si los parámetros son estables."""
    dy_val = dy if dy is not None else dx
    report = check_stability(alpha=alpha, u=u, v=v, dx=dx, dt=dt, dy=dy_val)
    return StabilityResponse(
        is_stable=report.is_stable,
        dt=report.dt,
        dt_max=report.dt_max,
        r=report.r,
        cx=report.cx,
        cy=report.cy,
        cfl=report.cfl,
        combined_factor=report.combined_factor,
        message=report.message,
    )


@app.post("/simulate", response_model=SimulateResponse, tags=["Simulación"])
def post_simulate(params: SimulateRequest) -> SimulateResponse:
    """Ejecuta la simulación temporal y devuelve las instantáneas térmicas."""
    try:
        dy_val = params.dy if params.dy is not None else params.dx

        if params.initial_grid is not None:
            arr = np.array(params.initial_grid, dtype=np.float64)
            grid = Grid(
                ny=arr.shape[0],
                nx=arr.shape[1],
                dx=params.dx,
                dy=dy_val,
                boundary_type=params.boundary_type,
                T=arr,
            )
        else:
            grid = create_hotspot_grid(
                ny=params.ny,
                nx=params.nx,
                base_temp=params.base_temp,
                hot_spot_temp=params.hot_spot_temp,
                sigma=params.hot_spot_sigma,
                dx=params.dx,
                dy=dy_val,
                boundary_type=params.boundary_type,
            )

        sim_res = run_simulation(
            grid=grid,
            alpha=params.alpha,
            u=params.u,
            v=params.v,
            dt=params.dt,
            total_time=params.total_time,
            save_interval=params.save_interval,
            enforce_stability=params.enforce_stability,
        )

        # Convertir arreglos NumPy a listas anidadas para serialización JSON
        snapshots_list = [snap.tolist() for snap in sim_res.snapshots]

        stab_report = sim_res.stability_report
        stab_resp = StabilityResponse(
            is_stable=stab_report.is_stable,
            dt=stab_report.dt,
            dt_max=stab_report.dt_max,
            r=stab_report.r,
            cx=stab_report.cx,
            cy=stab_report.cy,
            cfl=stab_report.cfl,
            combined_factor=stab_report.combined_factor,
            message=stab_report.message,
        )

        return SimulateResponse(
            snapshots=snapshots_list,
            timestamps=sim_res.timestamps,
            dt=sim_res.dt,
            total_time=sim_res.total_time,
            steps_executed=sim_res.steps_executed,
            computation_time_seconds=sim_res.computation_time_seconds,
            stability=stab_resp,
            grid_shape=list(sim_res.grid_shape),
            stats=sim_res.get_global_stats(),
            metadata=sim_res.metadata,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
