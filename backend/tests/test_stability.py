"""Pruebas unitarias para backend/core/stability.py (Fase 4).

Valida el cálculo de Δt_max, la condición de estabilidad combinada
(Caso E de docs/modelo.md) y comprueba experimentalmente la divergencia
cuando se viola la condición CFL / Fourier.
"""

import numpy as np
import pytest

from backend.core.grid import create_hotspot_grid
from backend.core.schemes import step
from backend.core.stability import (
    calculate_dt_max,
    check_stability,
    validate_stability_or_raise,
)


def test_reference_values_stability():
    """Verifica los valores numéricos de la tabla de referencia en docs/modelo.md.

    Δx = 10 km (10 000 m), α = 5000 m²/s, u = 5 m/s, v = 0.
    - Con Δt = 600 s: r = 0.03, cx = 0.3, 4r + cx = 0.42 <= 1 -> Estable
    - Con Δt = 3600 s: r = 0.18, cx = 1.8, 4r + cx = 2.52 > 1 -> Inestable
    """
    dx = 10_000.0
    alpha = 5000.0
    u = 5.0
    v = 0.0

    # 1. Caso estable: dt = 600 s
    report_stable = check_stability(alpha=alpha, u=u, v=v, dx=dx, dt=600.0)
    assert report_stable.is_stable is True
    assert np.isclose(report_stable.r, 0.03)
    assert np.isclose(report_stable.cx, 0.3)
    assert np.isclose(report_stable.combined_factor, 0.42)

    # 2. Caso inestable: dt = 3600 s (salto de hora en hora del documento base)
    report_unstable = check_stability(alpha=alpha, u=u, v=v, dx=dx, dt=3600.0)
    assert report_unstable.is_stable is False
    assert np.isclose(report_unstable.r, 0.18)
    assert np.isclose(report_unstable.cx, 1.8)
    assert np.isclose(report_unstable.combined_factor, 2.52)


def test_dt_max_calculation():
    """Verifica la fórmula cerrada de Δt_max."""
    dx = 10_000.0
    alpha = 5000.0
    u = 5.0
    v = 0.0

    # denom = 4 * 5000 / 1e8 + 5 / 1e4 = 0.0002 + 0.0005 = 0.0007
    # dt_max = 1 / 0.0007 ≈ 1428.57 s
    expected_dt_max = 1.0 / ((4.0 * alpha / (dx**2)) + (u / dx))
    dt_max = calculate_dt_max(alpha=alpha, u=u, v=v, dx=dx)
    assert np.isclose(dt_max, expected_dt_max)
    assert np.isclose(dt_max, 1428.57142857)


def test_case_e_raise_on_unstable():
    """Caso E: validate_stability_or_raise debe lanzar ValueError cuando es inestable."""
    dx = 10_000.0
    alpha = 5000.0
    u = 5.0
    v = 0.0

    # No lanza error con dt estable
    report = validate_stability_or_raise(alpha=alpha, u=u, v=v, dx=dx, dt=600.0)
    assert report.is_stable is True

    # Lanza error claro con dt inestable
    with pytest.raises(ValueError, match="Configuración INESTABLE"):
        validate_stability_or_raise(alpha=alpha, u=u, v=v, dx=dx, dt=3600.0)


def test_numerical_explosion_when_unstable():
    """Experimento numérico: compara la simulación con dt estable vs inestable.

    Demuestra que violar la condición CFL causa oscilaciones espurias y divergencia
    hacia infinito o NaN, mientras que el caso estable permanece acotado.
    """
    ny, nx = 25, 25
    dx = 10_000.0
    alpha = 5000.0
    u = 15.0
    v = 10.0

    dt_max = calculate_dt_max(alpha, u, v, dx)

    # 1. Ejecución con dt estable (dt = 0.5 * dt_max)
    dt_stable = 0.5 * dt_max
    grid_stable = create_hotspot_grid(ny, nx, base_temp=20.0, hot_spot_temp=35.0, dx=dx)
    T_stable = grid_stable.T.copy()
    for _ in range(30):
        T_stable = step(T_stable, alpha=alpha, u=u, v=v, dx=dx, dt=dt_stable)

    # El resultado estable permanece acotado y sin NaN
    assert not np.isnan(T_stable).any()
    assert np.max(T_stable) <= 35.0 + 1e-5
    assert np.min(T_stable) >= 20.0 - 1e-5

    # 2. Ejecución con dt inestable (dt = 2.0 * dt_max)
    dt_unstable = 2.0 * dt_max
    grid_unstable = create_hotspot_grid(ny, nx, base_temp=20.0, hot_spot_temp=35.0, dx=dx)
    T_unstable = grid_unstable.T.copy()
    for _ in range(30):
        T_unstable = step(T_unstable, alpha=alpha, u=u, v=v, dx=dx, dt=dt_unstable)

    # El resultado inestable debe explotar (valores gigantes, NaN o Inf)
    exploded = (
        np.isnan(T_unstable).any()
        or np.isinf(T_unstable).any()
        or np.max(np.abs(T_unstable)) > 1e4
    )
    assert exploded, "El caso inestable debería haber explotado numéricamente."
