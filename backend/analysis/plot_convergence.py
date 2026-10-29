"""Script para generar la gráfica de error L2 vs Δx para el informe de Métodos Numéricos."""

import os
import matplotlib.pyplot as plt
import numpy as np

from backend.analysis.convergence import run_convergence_study


def generate_convergence_plot(output_path: str = "docs/convergencia_L2.png") -> None:
    """Ejecuta el estudio y guarda la gráfica log-log de convergencia."""
    study = run_convergence_study(
        resolutions=(21, 41, 81, 161),
        domain_length=400_000.0,
        t_final=1800.0,
        alpha=5000.0,
        sigma0=40_000.0,
        r_target=0.02,
    )

    dx_km = [dx / 1000.0 for dx in study.dx_values]
    err_l2 = study.errors_l2

    # Línea teórica de pendiente 2 (O(Δx²))
    ref_x = np.array(dx_km)
    ref_y = err_l2[0] * (ref_x / ref_x[0]) ** 2

    plt.figure(figsize=(8, 6), dpi=150)
    plt.loglog(dx_km, err_l2, "o-", color="#ff7f0e", linewidth=2.5, markersize=8, label="Error $L_2$ numérico (FTCS)")
    plt.loglog(dx_km, ref_y, "--", color="#1f77b4", linewidth=2.0, label="Pendiente teórica $O(\\Delta x^2)$")

    plt.title("Estudio de Convergencia Espacial: Error $L_2$ vs $\\Delta x$\nDifusión Gaussiana 2D ($t = 1800$ s, $\\alpha = 5000$ m²/s)", fontsize=13, pad=12)
    plt.xlabel("Espaciado de malla $\\Delta x$ (km)", fontsize=12)
    plt.ylabel("Error $L_2$ (°C)", fontsize=12)
    plt.grid(True, which="both", linestyle=":", alpha=0.6)
    plt.legend(fontsize=11)

    # Anotar órdenes de convergencia observados
    for k in range(len(study.orders_l2)):
        mid_x = np.sqrt(dx_km[k] * dx_km[k + 1])
        mid_y = np.sqrt(err_l2[k] * err_l2[k + 1])
        order_val = study.orders_l2[k]
        plt.annotate(
            f"p = {order_val:.2f}",
            (mid_x, mid_y),
            textcoords="offset points",
            xytext=(12, -8),
            fontsize=10,
            fontweight="bold",
            color="#2ca02c",
        )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Gráfica guardada exitosamente en: {output_path}")


if __name__ == "__main__":
    generate_convergence_plot()
