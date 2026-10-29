"""Pruebas unitarias para backend/analysis/convergence.py (Fase 6).

Comprueba la exactitud de la solución analítica gaussiana y valida que
el esquema numérico converja con orden espacial ≈ 2 al refinar la malla.
"""

import numpy as np
import pytest

from backend.analysis.convergence import (
    analytical_gaussian,
    compute_l2_error,
    run_convergence_study,
)


def test_analytical_gaussian_properties():
    """Verifica que la solución analítica conserve propiedades físicas:

    - Amplitud decrece con el tiempo t.
    - Varianza (ancho de la campana) crece con el tiempo.
    - Simetría radial.
    """
    x = np.linspace(-100_000, 100_000, 51)
    y = np.linspace(-100_000, 100_000, 51)
    X, Y = np.meshgrid(x, y)

    alpha = 5000.0
    sigma0 = 20_000.0
    amp0 = 10.0
    base = 20.0

    T_0 = analytical_gaussian(X, Y, t=0.0, alpha=alpha, x0=0, y0=0, sigma0=sigma0, amplitude=amp0, base_temp=base)
    T_1h = analytical_gaussian(X, Y, t=3600.0, alpha=alpha, x0=0, y0=0, sigma0=sigma0, amplitude=amp0, base_temp=base)

    # El pico en (0, 0) debe decrecer
    assert np.isclose(T_0[25, 25], base + amp0)
    assert T_1h[25, 25] < T_0[25, 25]
    assert T_1h[25, 25] > base

    # La distribución conserva simetría
    assert np.isclose(T_1h[25, 20], T_1h[25, 30])
    assert np.isclose(T_1h[20, 25], T_1h[30, 25])


def test_spatial_convergence_second_order():
    """Verifica que el error L2 disminuya y el orden de convergencia sea ≈ 2."""
    study = run_convergence_study(
        resolutions=(21, 41, 81),
        domain_length=400_000.0,  # 400 km
        t_final=1800.0,           # 30 minutos
        alpha=5000.0,
        sigma0=40_000.0,
        r_target=0.02,
    )

    # 1. El error L2 debe decrecer estrictamente al refinar la malla
    assert len(study.errors_l2) == 3
    assert study.errors_l2[0] > study.errors_l2[1] > study.errors_l2[2]

    # 2. El orden de convergencia espacial observado debe estar muy cercano a 2 (entre 1.90 y 2.15)
    for order in study.orders_l2:
        assert 1.90 <= order <= 2.15, f"Orden de convergencia fuera de rango esperado: {order:.3f}"
