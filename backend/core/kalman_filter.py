"""Filtro de Kalman para asimilación de datos meteorológicos reales.

Combina predicciones numéricas con observaciones, mejorando precisión cercana
a estaciones meteorológicas.
"""

from __future__ import annotations
import numpy as np
from typing import Optional


class KalmanFilter1D:
    """Filtro de Kalman lineal simple para series temporales de temperatura."""
    
    def __init__(
        self,
        process_variance: float = 0.1,
        measurement_variance: float = 1.0,
        initial_value: float = 20.0,
        initial_estimate_error: float = 1.0,
    ):
        """Inicializa el filtro de Kalman.
        
        Args:
            process_variance: Varianza del ruido en el modelo (Q)
            measurement_variance: Varianza del ruido en observación (R)
            initial_value: Estimación inicial de estado
            initial_estimate_error: Incertidumbre inicial (P)
        """
        self.Q = process_variance  # Ruido del proceso
        self.R = measurement_variance  # Ruido de medición
        self.x = initial_value  # Estado
        self.P = initial_estimate_error  # Covarianza del error
        
    def predict(self, control_input: float = 0.0) -> float:
        """Paso de predicción del filtro de Kalman.
        
        Args:
            control_input: Entrada de control (típicamente 0)
            
        Returns:
            Predicción del estado
        """
        # x_pred = F * x + control
        # Asumimos F = 1 (el estado no cambia sin observación)
        self.x = self.x + control_input
        self.P = self.P + self.Q  # Aumentar incertidumbre
        
        return self.x
    
    def update(self, measurement: float) -> float:
        """Paso de actualización del filtro de Kalman.
        
        Incorpora una nueva observación.
        
        Args:
            measurement: Nueva observación del sistema
            
        Returns:
            Estimación mejorada del estado
        """
        # Ganancia de Kalman
        K = self.P / (self.P + self.R)
        
        # Actualizar estado
        self.x = self.x + K * (measurement - self.x)
        
        # Actualizar covarianza
        self.P = (1 - K) * self.P
        
        return self.x


class KalmanFilter2D:
    """Filtro de Kalman 2D espacial para campos de temperatura.
    
    Asimila observaciones puntuales (de estaciones) en el campo 2D.
    """
    
    def __init__(
        self,
        grid_shape: tuple[int, int],
        process_variance: float = 0.1,
        measurement_variance: float = 1.0,
        observation_radius: float = 50000.0,  # metros
    ):
        """Inicializa el filtro 2D.
        
        Args:
            grid_shape: Dimensiones de la malla (ny, nx)
            process_variance: Varianza del ruido del proceso
            measurement_variance: Varianza del ruido de observación
            observation_radius: Radio de influencia de observaciones (m)
        """
        self.ny, self.nx = grid_shape
        self.Q = process_variance
        self.R = measurement_variance
        self.obs_radius = observation_radius
        
        # Estado: el campo de temperatura actual
        self.x = np.zeros(grid_shape)
        
        # Matriz de covarianza: simplificada como escalar por celda
        self.P = np.ones(grid_shape) * 1.0
    
    def predict(self, increment: np.ndarray) -> np.ndarray:
        """Predicción: suma el incremento del modelo numérico.
        
        Args:
            increment: Cambio de temperatura del paso temporal (dT)
            
        Returns:
            Campo predicho
        """
        self.x = self.x + increment
        self.P = self.P + self.Q  # Aumentar incertidumbre
        
        return self.x
    
    def update_from_observation(
        self,
        obs_position: tuple[float, float],
        obs_value: float,
        dx: float,
    ) -> np.ndarray:
        """Actualiza el campo usando una observación puntual.
        
        Usa peso gaussiano basado en distancia.
        
        Args:
            obs_position: (lat, lon) o (y, x) en coordenadas grid
            obs_value: Valor observado (temperatura)
            dx: Espaciado del grid (metros)
            
        Returns:
            Campo actualizado
        """
        y_obs, x_obs = obs_position
        
        # Crear matriz de pesos gaussianos
        i_grid, j_grid = np.indices((self.ny, self.nx))
        
        # Distancia euclidiana a cada punto del grid
        dist = np.sqrt(
            ((i_grid - y_obs) * dx)**2 + ((j_grid - x_obs) * dx)**2
        )
        
        # Peso gaussiano (campana de influencia)
        sigma = self.obs_radius / (2.0 * dx)
        weights = np.exp(-(dist / sigma)**2)
        
        # Ganancia de Kalman (adaptada para 2D)
        K = self.P * weights / (self.P * weights + self.R)
        
        # Actualizar estado
        innovation = obs_value - self.x  # Diferencia predicción-observación
        self.x = self.x + K * innovation
        
        # Actualizar covarianza
        self.P = (1 - K) * self.P
        
        return self.x
    
    def assimilate_multiple_observations(
        self,
        observations: list[tuple[tuple[float, float], float]],
        dx: float,
    ) -> np.ndarray:
        """Asimila múltiples observaciones secuencialmente.
        
        Args:
            observations: Lista de ((y, x), value) tuplas
            dx: Espaciado del grid
            
        Returns:
            Campo actualizado
        """
        for (y, x), value in observations:
            self.update_from_observation((y, x), value, dx)
        
        return self.x


class EnsembleKalmanFilter:
    """Ensemble Kalman Filter (EnKF) para predicción probabilística.
    
    Mantiene múltiples miembros de ensamble para representar incertidumbre.
    Más flexible que KF lineal, maneja no-linealidades mejor.
    """
    
    def __init__(
        self,
        grid_shape: tuple[int, int],
        n_members: int = 20,
        measurement_variance: float = 1.0,
    ):
        """Inicializa el EnKF.
        
        Args:
            grid_shape: Dimensiones del grid
            n_members: Número de miembros del ensamble
            measurement_variance: Varianza de ruido de observación
        """
        self.ny, self.nx = grid_shape
        self.n_members = n_members
        self.R = measurement_variance
        
        # Ensamble: [n_members, ny, nx]
        self.ensemble = np.zeros((n_members, self.ny, self.nx))
        
        # Media del ensamble (análisis)
        self.x_mean = np.zeros(grid_shape)
    
    def predict(self, model_increments: list[np.ndarray]) -> None:
        """Predicción: avanza cada miembro del ensamble.
        
        Args:
            model_increments: Lista de [n_members] incrementos del modelo
        """
        for m in range(self.n_members):
            self.ensemble[m] += model_increments[m]
        
        # Calcular media
        self.x_mean = np.mean(self.ensemble, axis=0)
    
    def update_from_observation(
        self,
        obs_position: tuple[float, float],
        obs_value: float,
        dx: float,
    ) -> None:
        """Actualiza el ensamble con una observación.
        
        Args:
            obs_position: Posición de observación (y, x)
            obs_value: Valor observado
            dx: Espaciado del grid
        """
        y_obs, x_obs = obs_position
        
        # Extraer predicción en posición de observación para cada miembro
        predictions = []
        for m in range(self.n_members):
            # Interpolación bilineal en posición (y_obs, x_obs)
            y_idx = int(np.clip(y_obs, 0, self.ny - 1))
            x_idx = int(np.clip(x_obs, 0, self.nx - 1))
            pred = self.ensemble[m, y_idx, x_idx]
            predictions.append(pred)
        
        predictions = np.array(predictions)
        
        # Calcular estadísticas del ensamble en obs point
        pred_mean = np.mean(predictions)
        pred_std = np.std(predictions)
        
        # Ganancia del EnKF
        K = pred_std / (pred_std**2 + self.R)
        
        # Actualizar cada miembro
        innovation = obs_value - predictions
        for m in range(self.n_members):
            self.ensemble[m] += K * innovation[m]
        
        # Recalcular media
        self.x_mean = np.mean(self.ensemble, axis=0)
    
    def get_mean(self) -> np.ndarray:
        """Retorna la media del ensamble (mejor estimación)."""
        return self.x_mean
    
    def get_uncertainty(self) -> np.ndarray:
        """Retorna la desviación estándar del ensamble (incertidumbre)."""
        return np.std(self.ensemble, axis=0)
    
    def get_percentiles(self, percentiles: list[int]) -> dict[int, np.ndarray]:
        """Retorna percentiles del ensamble.
        
        Ejemplo: obtener intervalo de confianza 90% con percentiles=[5, 95]
        
        Args:
            percentiles: Lista de percentiles (0-100)
            
        Returns:
            Diccionario {percentil: array}
        """
        result = {}
        for p in percentiles:
            result[p] = np.percentile(self.ensemble, p, axis=0)
        return result
