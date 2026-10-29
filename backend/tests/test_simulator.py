"""Pruebas unitarias para backend/core/simulator.py (Fase 5).

Verifica el ciclo de 24 horas (144 pasos), ausencia de valores NaN,
tiempo de ejecución en malla 50x50 y consistencia de los resultados.
"""

import time
import numpy as np
import pytest

from backend.core.grid import create_hotspot_grid, create_uniform_grid
from backend.core.simulator import run_simulation


def test_24h_simulation_snapshots_and_no_nan():
    """Verifica 24 h (144 pasos de 10 min = 600 s):

    - Exactamente 144 pasos ejecutados.
    - 145 instantáneas guardadas (incluyendo t=0).
    - Ningún valor NaN ni Inf en toda la serie.
    """
    grid = create_hotspot_grid(ny=50, nx=50, base_temp=20.0, hot_spot_temp=35.0)

    result = run_simulation(
        grid=grid,
        alpha=5000.0,
        u=5.0,
        v=0.0,
        dt=600.0,
        total_time=86_400.0,
        save_interval=600.0,
        enforce_stability=True,
    )

    assert result.steps_executed == 144
    assert result.num_snapshots == 145
    assert len(result.timestamps) == 145
    assert result.timestamps[0] == 0.0
    assert np.isclose(result.timestamps[-1], 86_400.0)

    # Convertir a arreglo 3D y verificar ausencia de NaN/Inf
    arr_3d = result.as_array()
    assert arr_3d.shape == (145, 50, 50)
    assert not np.isnan(arr_3d).any()
    assert not np.isinf(arr_3d).any()


def test_simulation_performance_on_50x50():
    """Verifica que el tiempo de ejecución para 144 pasos en 50x50 sea rápido (< 1.5 s)."""
    grid = create_hotspot_grid(ny=50, nx=50, base_temp=20.0, hot_spot_temp=35.0)

    t0 = time.perf_counter()
    result = run_simulation(
        grid=grid,
        alpha=5000.0,
        u=8.0,
        v=4.0,
        dt=600.0,
        total_time=86_400.0,
        save_interval=600.0,
    )
    elapsed = time.perf_counter() - t0

    assert elapsed < 1.5, f"La simulación tomó {elapsed:.3f} s, superando el umbral de 1.5 s"
    assert result.computation_time_seconds < 1.5


def test_node_history_and_stats():
    """Verifica la extracción de series temporales por nodo y estadísticas globales."""
    grid = create_hotspot_grid(ny=20, nx=20, base_temp=15.0, hot_spot_temp=30.0, center=(10, 10))

    result = run_simulation(
        grid=grid,
        alpha=5000.0,
        u=0.0,
        v=0.0,
        dt=600.0,
        total_time=3600.0,  # 1 hora = 6 pasos
        save_interval=600.0,
    )

    history = result.get_node_history(10, 10)
    assert len(history) == 7
    # Con difusión pura, el nodo caliente central debe enfriarse monótonamente
    for k in range(len(history) - 1):
        assert history[k + 1] <= history[k]

    stats = result.get_global_stats()
    assert "min" in stats and "max" in stats and "mean" in stats
    assert len(stats["max"]) == 7


def test_enforce_stability_raises_on_unstable():
    """Verifica que enforce_stability rechace simulaciones inestables."""
    grid = create_uniform_grid(ny=10, nx=10, temp=20.0)

    # dt = 3600 s es inestable para estos parámetros
    with pytest.raises(ValueError, match="Configuración INESTABLE"):
        run_simulation(
            grid=grid,
            alpha=5000.0,
            u=5.0,
            v=0.0,
            dt=3600.0,
            total_time=7200.0,
            enforce_stability=True,
        )
