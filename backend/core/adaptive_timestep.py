"""Control adaptativo de paso temporal para simulaciones estables y eficientes.

Ajusta automáticamente Δt según estabilidad, permitiendo pasos grandes sin errores.
"""

from __future__ import annotations
import numpy as np
from backend.core.stability import check_stability, calculate_dt_max


class AdaptiveTimestepper:
    """Controlador de paso temporal adaptativo basado en estabilidad CFL."""
    
    def __init__(
        self,
        alpha: float,
        u: float | np.ndarray,
        v: float | np.ndarray,
        dx: float,
        dy: float | None = None,
        safety_factor: float = 0.8,
        dt_min: float = 10.0,
        dt_max_override: float | None = None,
    ):
        """Inicializa el controlador.
        
        Args:
            alpha: Difusividad térmica
            u, v: Velocidades de viento
            dx, dy: Espaciado espacial
            safety_factor: Factor de seguridad (0.0-1.0) para dt_max
            dt_min: Paso mínimo permitido (segundos)
            dt_max_override: Máximo forzado (None = calculado)
        """
        self.alpha = alpha
        self.u = u
        self.v = v
        self.dx = dx
        self.dy = dy or dx
        self.safety_factor = np.clip(safety_factor, 0.1, 0.99)
        self.dt_min = dt_min
        
        # Calcular dt_max teórico
        dt_max_theoretical = calculate_dt_max(alpha, u, v, dx, self.dy)
        self.dt_max = dt_max_override or (self.safety_factor * dt_max_theoretical)
        
        # Variables internas
        self.current_dt = min(self.dt_max, 600.0)  # Comenzar conservador
        self.num_increases = 0
        self.num_decreases = 0
    
    def suggest_next_dt(self, error_estimate: float | None = None) -> float:
        """Sugiere el próximo paso temporal.
        
        Estrategia:
        1. Si error es pequeño, intenta aumentar dt (hasta dt_max)
        2. Si error es grande, reduce dt
        3. Nunca va por debajo de dt_min ni arriba de dt_max
        
        Args:
            error_estimate: Estimación de error relativo (0.0-1.0)
            
        Returns:
            dt sugerido para el próximo paso
        """
        if error_estimate is None:
            # Usar heurística simple basada en estabilidad
            return min(self.current_dt * 1.1, self.dt_max)
        
        # Basarse en error estimado
        if error_estimate < 0.001:  # Error muy pequeño
            factor = 1.2
            self.num_increases += 1
        elif error_estimate < 0.01:  # Error pequeño
            factor = 1.05
        elif error_estimate > 0.1:  # Error grande
            factor = 0.7
            self.num_decreases += 1
        else:
            factor = 1.0
        
        new_dt = np.clip(
            self.current_dt * factor,
            self.dt_min,
            self.dt_max
        )
        
        self.current_dt = new_dt
        return new_dt
    
    def enforce_stability(self, dt: float) -> float:
        """Ajusta dt para garantizar estabilidad CFL.
        
        Args:
            dt: Paso temporal propuesto
            
        Returns:
            dt ajustado para ser seguro
        """
        report = check_stability(self.alpha, self.u, self.v, self.dx, dt, self.dy)
        if not report.is_stable:
            safe_dt = report.dt_max * self.safety_factor
            self.current_dt = max(safe_dt, self.dt_min)
            self.num_decreases += 1
            return self.current_dt
        return dt
    
    def get_stats(self) -> dict:
        """Retorna estadísticas del adaptador."""
        return {
            'dt_current': self.current_dt,
            'dt_min': self.dt_min,
            'dt_max': self.dt_max,
            'num_increases': self.num_increases,
            'num_decreases': self.num_decreases,
            'efficiency_ratio': self.num_increases / max(1, self.num_decreases),
        }


def estimate_local_error(
    T_fine: np.ndarray,
    T_coarse: np.ndarray,
    method: str = 'linf'
) -> float:
    """Estima error local comparando dos mallas de diferentes resoluciones.
    
    Métodos de error:
    - 'linf': Error máximo (más conservador)
    - 'l2': Norma L2 (estándar)
    - 'l1': Promedio de errores absolutos
    
    Args:
        T_fine: Solución en malla fina
        T_coarse: Solución en malla gruesa
        method: Tipo de norma
        
    Returns:
        Error relativo (0.0-1.0)
    """
    # Para comparación, interpolar coarse a la resolución de fine
    diff = np.abs(T_fine - T_coarse)
    
    if method == 'linf':
        error_abs = np.max(diff)
    elif method == 'l2':
        error_abs = np.sqrt(np.mean(diff**2))
    elif method == 'l1':
        error_abs = np.mean(diff)
    else:
        raise ValueError(f"Método '{method}' desconocido")
    
    # Normalizar por rango de temperaturas
    T_range = np.max(T_fine) - np.min(T_fine)
    if T_range < 1e-10:
        T_range = 1.0
    
    return error_abs / T_range


def richardson_extrapolation(
    T_coarse: np.ndarray,
    T_fine: np.ndarray,
    order: int = 2
) -> np.ndarray:
    """Extrapolación de Richardson para mejorar precisión.
    
    Combina soluciones de dos mallas:
        T_improved = (2^order * T_fine - T_coarse) / (2^order - 1)
    
    Aumenta orden de precisión de O(h^order) a O(h^(2*order)).
    
    Args:
        T_coarse: Solución en malla gruesa
        T_fine: Solución en malla fina (2x más refinada)
        order: Orden teórico del esquema (típicamente 2)
        
    Returns:
        Solución mejorada con mejor precisión
    """
    factor = 2.0 ** order
    T_improved = (factor * T_fine - T_coarse) / (factor - 1.0)
    return T_improved
