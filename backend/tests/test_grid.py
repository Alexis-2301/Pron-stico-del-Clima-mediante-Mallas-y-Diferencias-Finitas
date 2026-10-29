"""Pruebas unitarias para backend/core/grid.py (Fase 2)."""

import numpy as np
import pytest

from backend.core.grid import (
    Grid,
    apply_boundary_conditions,
    create_hotspot_grid,
    create_point_source_grid,
    create_uniform_grid,
)


def test_grid_shape_and_initialization():
    """Verifica forma, tipos y restricciones de inicialización."""
    grid = Grid(ny=50, nx=60, dx=10_000.0, dy=10_000.0)
    assert grid.shape == (50, 60)
    assert grid.T.shape == (50, 60)
    assert grid.T.dtype == np.float64
    assert np.all(grid.T == 0.0)

    # Validación de dimensiones mínimas
    with pytest.raises(ValueError, match="al menos 3x3"):
        Grid(ny=2, nx=50)

    # Validación de espaciados positivos
    with pytest.raises(ValueError, match="positivos"):
        Grid(ny=10, nx=10, dx=-100)

    # Validación de tipo de frontera
    with pytest.raises(ValueError, match="no soportado"):
        Grid(ny=10, nx=10, boundary_type="invalid")  # type: ignore[arg-type]


def test_uniform_grid():
    """Verifica que la malla uniforme tenga el valor correcto en todos los nodos."""
    val = 15.0
    grid = create_uniform_grid(ny=20, nx=30, temp=val)
    assert grid.shape == (20, 30)
    assert np.allclose(grid.T, val)


def test_hotspot_grid():
    """Verifica que el punto caliente tenga su máximo en el centro y decaiga."""
    base = 18.0
    peak = 32.0
    grid = create_hotspot_grid(ny=31, nx=31, base_temp=base, hot_spot_temp=peak, center=(15, 15))
    assert grid.shape == (31, 31)
    assert np.isclose(grid.T[15, 15], peak)
    assert grid.T[0, 0] < peak
    assert grid.T[0, 0] >= base
    # Simetría radial alrededor del centro
    assert np.isclose(grid.T[15, 10], grid.T[15, 20])
    assert np.isclose(grid.T[10, 15], grid.T[20, 15])


def test_point_source_grid():
    """Verifica la malla de prueba canónica 5x5: centro (2,2)=100, resto=0."""
    grid = create_point_source_grid(ny=5, nx=5, center=(2, 2), center_val=100.0, base_val=0.0)
    assert grid.shape == (5, 5)
    assert grid.T[2, 2] == 100.0
    # Todos los demás son cero
    assert np.sum(grid.T) == 100.0
    assert grid.T[0, 0] == 0.0
    assert grid.T[2, 3] == 0.0


def test_dirichlet_boundaries():
    """Verifica que las fronteras de Dirichlet mantengan sus valores originales."""
    grid = create_uniform_grid(ny=5, nx=5, temp=10.0, boundary_type="dirichlet")
    # Modificar valores internos y bordes
    grid.T += 5.0
    # Al aplicar fronteras, los bordes deben restaurarse al valor original (10.0)
    grid.apply_boundaries()
    assert np.all(grid.T[0, :] == 10.0)
    assert np.all(grid.T[-1, :] == 10.0)
    assert np.all(grid.T[:, 0] == 10.0)
    assert np.all(grid.T[:, -1] == 10.0)
    # Los nodos interiores deben mantener el valor modificado (15.0)
    assert np.all(grid.T[1:-1, 1:-1] == 15.0)


def test_periodic_boundaries():
    """Verifica que las fronteras periódicas intercambien celdas opuestas."""
    T = np.zeros((5, 5))
    # Asignar valores internos
    T[1, 2] = 42.0  # Fila cerca del Sur
    T[3, 2] = 84.0  # Fila cerca del Norte
    T[2, 1] = 11.0  # Columna cerca del Oeste
    T[2, 3] = 99.0  # Columna cerca del Este

    apply_boundary_conditions(T, boundary_type="periodic")

    # Sur (fila 0) debe recibir de fila -2 (fila 3)
    assert T[0, 2] == 84.0
    # Norte (fila -1) debe recibir de fila 1
    assert T[-1, 2] == 42.0
    # Oeste (columna 0) debe recibir de columna -2 (columna 3)
    assert T[2, 0] == 99.0
    # Este (columna -1) debe recibir de columna 1
    assert T[2, -1] == 11.0
