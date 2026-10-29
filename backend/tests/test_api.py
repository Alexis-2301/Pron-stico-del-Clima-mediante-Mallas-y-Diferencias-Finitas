"""Pruebas de integración para la API FastAPI de clima-app (Fase 7)."""

from fastapi.testclient import TestClient
import pytest

from backend.api.app import app

client = TestClient(app)


def test_root_endpoint():
    """Verifica que la raíz responda 200 con estado online."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "docs_url" in data


def test_get_stability_stable():
    """Verifica GET /stability con valores de referencia estables."""
    response = client.get(
        "/stability",
        params={
            "alpha": 5000.0,
            "u": 5.0,
            "v": 0.0,
            "dx": 10000.0,
            "dt": 600.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_stable"] is True
    assert data["combined_factor"] <= 1.0
    assert data["dt_max"] > 600.0


def test_get_stability_unstable():
    """Verifica GET /stability con dt = 3600 s (inestable)."""
    response = client.get(
        "/stability",
        params={
            "alpha": 5000.0,
            "u": 5.0,
            "v": 0.0,
            "dx": 10000.0,
            "dt": 3600.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_stable"] is False
    assert data["combined_factor"] > 1.0


def test_post_simulate_success():
    """Verifica POST /simulate con parámetros válidos."""
    payload = {
        "ny": 15,
        "nx": 15,
        "dx": 10000.0,
        "alpha": 5000.0,
        "u": 5.0,
        "v": 0.0,
        "dt": 600.0,
        "total_time": 1800.0,  # 3 pasos
        "save_interval": 600.0,
        "base_temp": 20.0,
        "hot_spot_temp": 35.0,
        "boundary_type": "dirichlet",
        "enforce_stability": True,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "snapshots" in data
    assert len(data["snapshots"]) == 4  # t=0, 600, 1200, 1800
    assert len(data["timestamps"]) == 4
    assert data["steps_executed"] == 3
    assert data["grid_shape"] == [15, 15]
    assert data["stability"]["is_stable"] is True


def test_post_simulate_rejects_unstable():
    """Verifica que POST /simulate rechace pasos inestables cuando enforce_stability=True."""
    payload = {
        "ny": 15,
        "nx": 15,
        "dx": 10000.0,
        "alpha": 5000.0,
        "u": 5.0,
        "v": 0.0,
        "dt": 3600.0,  # Inestable
        "total_time": 7200.0,
        "enforce_stability": True,
    }

    response = client.post("/simulate", json=payload)
    # Pydantic model validator lanza error en 422 Unprocessable Entity
    assert response.status_code == 422
    err_detail = str(response.json()["detail"])
    assert "inestable" in err_detail.lower() or "excede" in err_detail.lower()


def test_post_simulate_allows_unstable_when_disabled():
    """Verifica que si enforce_stability=False, permita ejecutar el caso inestable (para demos de error)."""
    payload = {
        "ny": 15,
        "nx": 15,
        "dx": 10000.0,
        "alpha": 5000.0,
        "u": 5.0,
        "v": 0.0,
        "dt": 3600.0,
        "total_time": 7200.0,
        "enforce_stability": False,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["stability"]["is_stable"] is False


def test_post_simulate_with_custom_initial_grid():
    """Verifica que POST /simulate acepte una matriz inicial personalizada (datos reales)."""
    custom_matrix = [
        [20.0, 21.0, 22.0, 23.0, 24.0],
        [21.0, 25.0, 28.0, 26.0, 23.0],
        [20.0, 24.0, 32.0, 25.0, 22.0],
        [19.0, 22.0, 24.0, 22.0, 21.0],
        [18.0, 19.0, 20.0, 20.0, 19.0],
    ]
    payload = {
        "ny": 5,
        "nx": 5,
        "dx": 10000.0,
        "alpha": 5000.0,
        "u": 2.0,
        "v": 1.0,
        "dt": 600.0,
        "total_time": 1200.0,
        "save_interval": 600.0,
        "initial_grid": custom_matrix,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["grid_shape"] == [5, 5]
    assert data["snapshots"][0][2][2] == pytest.approx(32.0)
