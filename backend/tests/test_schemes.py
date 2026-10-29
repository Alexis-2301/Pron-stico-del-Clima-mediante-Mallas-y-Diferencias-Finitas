"""Pruebas unitarias para backend/core/schemes.py (Fase 3).

Valida los esquemas FTCS y Upwind contra los casos de prueba calculados a mano
de la Fase 1 (Casos A, B, C y D de docs/modelo.md).
"""

import numpy as np
import pytest

from backend.core.grid import create_hotspot_grid, create_point_source_grid, create_uniform_grid
from backend.core.schemes import step


def test_case_a_diffusion():
    """Caso A: r = 0.2, sin viento.

    Malla 5x5, centro (2,2) = 100, resto = 0.
    Resultado esperado:
    - Centro (2, 2) = 20.0
    - Vecinos directos (N, S, E, O) = 20.0
    - Suma total = 100.0 (conservación)
    """
    grid = create_point_source_grid(ny=5, nx=5, center=(2, 2), center_val=100.0, base_val=0.0)
    dx = 10_000.0
    dt = 600.0
    # r = alpha * dt / dx^2 = 0.2 => alpha = 0.2 * dx^2 / dt
    alpha = 0.2 * (dx**2) / dt

    T_next = step(grid.T, alpha=alpha, u=0.0, v=0.0, dx=dx, dt=dt)

    assert np.isclose(T_next[2, 2], 20.0)
    assert np.isclose(T_next[3, 2], 20.0)  # Norte
    assert np.isclose(T_next[1, 2], 20.0)  # Sur
    assert np.isclose(T_next[2, 3], 20.0)  # Este
    assert np.isclose(T_next[2, 1], 20.0)  # Oeste
    # Resto de nodos internos
    assert np.isclose(T_next[1, 1], 0.0)
    assert np.isclose(T_next[3, 3], 0.0)
    # Conservación
    assert np.isclose(np.sum(T_next), 100.0)


def test_case_b_pdf_average():
    """Caso B: r = 0.25 (promedio del PDF del proyecto), sin viento.

    Resultado esperado:
    - Centro = 0.0
    - Cada vecino directo = 25.0
    - Suma total = 100.0
    """
    grid = create_point_source_grid(ny=5, nx=5, center=(2, 2), center_val=100.0, base_val=0.0)
    dx = 10_000.0
    dt = 600.0
    alpha = 0.25 * (dx**2) / dt

    T_next = step(grid.T, alpha=alpha, u=0.0, v=0.0, dx=dx, dt=dt)

    assert np.isclose(T_next[2, 2], 0.0)
    assert np.isclose(T_next[3, 2], 25.0)  # Norte
    assert np.isclose(T_next[1, 2], 25.0)  # Sur
    assert np.isclose(T_next[2, 3], 25.0)  # Este
    assert np.isclose(T_next[2, 1], 25.0)  # Oeste
    assert np.isclose(np.sum(T_next), 100.0)


def test_case_c_advection_east():
    """Caso C: r = 0, cx = 0.5 (u > 0 hacia el Este), v = 0.

    Resultado esperado:
    - Centro = 50.0
    - Nodo Este (2, 3) = 50.0
    - Resto = 0.0
    - Suma total = 100.0
    """
    grid = create_point_source_grid(ny=5, nx=5, center=(2, 2), center_val=100.0, base_val=0.0)
    dx = 10_000.0
    dt = 600.0
    # cx = u * dt / dx = 0.5 => u = 0.5 * dx / dt
    u = 0.5 * dx / dt

    T_next = step(grid.T, alpha=0.0, u=u, v=0.0, dx=dx, dt=dt)

    assert np.isclose(T_next[2, 2], 50.0)
    assert np.isclose(T_next[2, 3], 50.0)  # Nodo Este
    assert np.isclose(T_next[2, 1], 0.0)   # Nodo Oeste
    assert np.isclose(T_next[3, 2], 0.0)   # Nodo Norte
    assert np.isclose(T_next[1, 2], 0.0)   # Nodo Sur
    assert np.isclose(np.sum(T_next), 100.0)


def test_case_c_advection_west():
    """Caso C con viento negativo (u < 0 hacia el Oeste): cx = -0.5."""
    grid = create_point_source_grid(ny=5, nx=5, center=(2, 2), center_val=100.0, base_val=0.0)
    dx = 10_000.0
    dt = 600.0
    u = -0.5 * dx / dt

    T_next = step(grid.T, alpha=0.0, u=u, v=0.0, dx=dx, dt=dt)

    assert np.isclose(T_next[2, 2], 50.0)
    assert np.isclose(T_next[2, 1], 50.0)  # Nodo Oeste recibe
    assert np.isclose(T_next[2, 3], 0.0)
    assert np.isclose(np.sum(T_next), 100.0)


def test_case_c_advection_north():
    """Caso C con viento hacia el Norte (v > 0): cy = 0.5."""
    grid = create_point_source_grid(ny=5, nx=5, center=(2, 2), center_val=100.0, base_val=0.0)
    dx = 10_000.0
    dt = 600.0
    v = 0.5 * dx / dt

    T_next = step(grid.T, alpha=0.0, u=0.0, v=v, dx=dx, dt=dt)

    assert np.isclose(T_next[2, 2], 50.0)
    assert np.isclose(T_next[3, 2], 50.0)  # Nodo Norte recibe
    assert np.isclose(T_next[1, 2], 0.0)
    assert np.isclose(np.sum(T_next), 100.0)


def test_case_d_uniform_field():
    """Caso D: T = 15.0 uniforme. No debe cambiar bajo ningún esquema estable."""
    grid = create_uniform_grid(ny=10, nx=10, temp=15.0)
    dx = 10_000.0
    dt = 600.0
    alpha = 5000.0
    u = 5.0
    v = 3.0

    T_next = step(grid.T, alpha=alpha, u=u, v=v, dx=dx, dt=dt)

    assert np.allclose(T_next, 15.0)


def test_diffusion_max_drops_and_energy_conserved():
    """Con difusión pura, la temperatura máxima debe disminuir y la media conservarse."""
    grid = create_hotspot_grid(ny=31, nx=31, base_temp=20.0, hot_spot_temp=35.0, sigma=3.0, boundary_type="periodic")
    dx = 10_000.0
    dt = 300.0
    alpha = 5000.0

    t_initial_max = np.max(grid.T)
    t_initial_mean = np.mean(grid.T)

    T_current = grid.T.copy()
    for _ in range(5):
        T_current = step(T_current, alpha=alpha, u=0.0, v=0.0, dx=dx, dt=dt, boundary_type="periodic")

    # La temperatura máxima debe bajar debido a la disipación térmica
    assert np.max(T_current) < t_initial_max
    # En dominio periódico con difusión pura, la media se conserva
    assert np.isclose(np.mean(T_current), t_initial_mean, atol=1e-10)


def test_invalid_parameters_raise_error():
    """Verifica que parámetros físicos inválidos generen ValueError."""
    T = np.zeros((5, 5))
    with pytest.raises(ValueError, match="alpha"):
        step(T, alpha=-1.0, u=0, v=0, dx=10, dt=1)
    with pytest.raises(ValueError, match="dx y dy"):
        step(T, alpha=1.0, u=0, v=0, dx=-10, dt=1)
    with pytest.raises(ValueError, match="dt"):
        step(T, alpha=1.0, u=0, v=0, dx=10, dt=0)
