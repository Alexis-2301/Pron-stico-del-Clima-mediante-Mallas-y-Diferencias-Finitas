"""Módulo de malla y condiciones iniciales y de frontera para clima-app.

Define la representación de la malla 2D y utilidades para generar
distribuciones iniciales de temperatura y aplicar condiciones de frontera
(Dirichlet fija o periódica).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal
import numpy as np

BoundaryType = Literal["dirichlet", "periodic"]


@dataclass
class Grid:
    """Representa la malla espacial 2D y el campo térmico.

    Convención:
    - Fila i: dirección Norte-Sur (Norte = i + 1, Sur = i - 1)
    - Columna j: dirección Este-Oeste (Este = j + 1, Oeste = j - 1)
    """

    ny: int
    nx: int
    dx: float = 10_000.0  # metros (10 km por defecto)
    dy: float = 10_000.0  # metros (10 km por defecto)
    boundary_type: BoundaryType = "dirichlet"
    T: np.ndarray = field(default=None)  # type: ignore[assignment]
    _fixed_boundaries: np.ndarray | None = field(default=None, init=False, repr=False)

    def __post_init__(self) -> None:
        if self.ny < 3 or self.nx < 3:
            raise ValueError(f"La malla debe ser de al menos 3x3 nodos. Recibido: {self.ny}x{self.nx}")
        if self.dx <= 0 or self.dy <= 0:
            raise ValueError(f"Los espaciados dx y dy deben ser positivos. Recibido dx={self.dx}, dy={self.dy}")
        if self.boundary_type not in ("dirichlet", "periodic"):
            raise ValueError(f"Tipo de frontera no soportado: '{self.boundary_type}'. Use 'dirichlet' o 'periodic'.")

        if self.T is None:
            self.T = np.zeros((self.ny, self.nx), dtype=np.float64)
        else:
            self.T = np.asarray(self.T, dtype=np.float64)
            if self.T.shape != (self.ny, self.nx):
                raise ValueError(
                    f"Dimensiones de T {self.T.shape} no coinciden con (ny={self.ny}, nx={self.nx})"
                )

        if self.boundary_type == "dirichlet":
            self._fixed_boundaries = self.T.copy()

    @property
    def shape(self) -> tuple[int, int]:
        """Retorna (ny, nx)."""
        return self.ny, self.nx

    def apply_boundaries(self, T_arr: np.ndarray | None = None) -> np.ndarray:
        """Aplica las condiciones de frontera al arreglo dado (o a self.T)."""
        target = self.T if T_arr is None else T_arr
        apply_boundary_conditions(
            target,
            boundary_type=self.boundary_type,
            fixed_boundary=self._fixed_boundaries,
        )
        return target


def apply_boundary_conditions(
    T: np.ndarray,
    boundary_type: BoundaryType = "dirichlet",
    fixed_boundary: np.ndarray | None = None,
) -> np.ndarray:
    """Aplica condiciones de frontera en sitio sobre la matriz T.

    - Dirichlet (fija): mantiene los valores de los bordes externos iguales a
      `fixed_boundary` (o los que ya tenía si no se especifica).
    - Periódica: conecta los bordes opuestos (Sur con Norte, Oeste con Este).

    Args:
        T: Matriz 2D de temperaturas (ny, nx).
        boundary_type: 'dirichlet' o 'periodic'.
        fixed_boundary: Valores de referencia para frontera fija.

    Returns:
        np.ndarray: La misma matriz T modificada.
    """
    if boundary_type == "dirichlet":
        if fixed_boundary is not None:
            T[0, :] = fixed_boundary[0, :]
            T[-1, :] = fixed_boundary[-1, :]
            T[:, 0] = fixed_boundary[:, 0]
            T[:, -1] = fixed_boundary[:, -1]
        # Si no hay fixed_boundary, los bordes simplemente no se alteran
    elif boundary_type == "periodic":
        # Conexión periódica de celdas borde
        # Sur (fila 0) toma valor previo a Norte (fila -2)
        # Norte (fila -1) toma valor posterior a Sur (fila 1)
        T[0, 1:-1] = T[-2, 1:-1]
        T[-1, 1:-1] = T[1, 1:-1]
        # Oeste (columna 0) toma valor previo a Este (columna -2)
        # Este (columna -1) toma valor posterior a Oeste (columna 1)
        T[1:-1, 0] = T[1:-1, -2]
        T[1:-1, -1] = T[1:-1, 1]
        # Esquinas
        T[0, 0] = T[-2, -2]
        T[0, -1] = T[-2, 1]
        T[-1, 0] = T[1, -2]
        T[-1, -1] = T[1, 1]
    else:
        raise ValueError(f"boundary_type '{boundary_type}' desconocido.")

    return T


def create_uniform_grid(
    ny: int = 50,
    nx: int = 50,
    temp: float = 20.0,
    dx: float = 10_000.0,
    dy: float = 10_000.0,
    boundary_type: BoundaryType = "dirichlet",
) -> Grid:
    """Crea una malla con temperatura uniforme."""
    T = np.full((ny, nx), fill_value=temp, dtype=np.float64)
    return Grid(ny=ny, nx=nx, dx=dx, dy=dy, boundary_type=boundary_type, T=T)


def create_hotspot_grid(
    ny: int = 50,
    nx: int = 50,
    base_temp: float = 20.0,
    hot_spot_temp: float = 35.0,
    center: tuple[int, int] | None = None,
    sigma: float = 4.0,
    dx: float = 10_000.0,
    dy: float = 10_000.0,
    boundary_type: BoundaryType = "dirichlet",
) -> Grid:
    """Crea una malla con temperatura base y una perturbación térmica (gaussiana) central."""
    if center is None:
        ci, cj = ny // 2, nx // 2
    else:
        ci, cj = center

    i_indices, j_indices = np.indices((ny, nx))
    dist_sq = (i_indices - ci) ** 2 + (j_indices - cj) ** 2
    delta_t = hot_spot_temp - base_temp
    gaussian = delta_t * np.exp(-dist_sq / (2.0 * sigma**2))

    T = base_temp + gaussian
    return Grid(ny=ny, nx=nx, dx=dx, dy=dy, boundary_type=boundary_type, T=T)


def create_point_source_grid(
    ny: int = 5,
    nx: int = 5,
    center: tuple[int, int] = (2, 2),
    center_val: float = 100.0,
    base_val: float = 0.0,
    dx: float = 10_000.0,
    dy: float = 10_000.0,
    boundary_type: BoundaryType = "dirichlet",
) -> Grid:
    """Crea una malla para casos de prueba canónicos (ej. 5x5 centro=100 resto=0)."""
    T = np.full((ny, nx), fill_value=base_val, dtype=np.float64)
    ci, cj = center
    T[ci, cj] = center_val
    return Grid(ny=ny, nx=nx, dx=dx, dy=dy, boundary_type=boundary_type, T=T)
