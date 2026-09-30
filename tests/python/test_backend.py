"""Unit tests for SnapDev AI Python FastAPI Backend.

Validates /health, /api/status, and Phase 3 Code Intelligence endpoints.
"""

import sys
import os
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from python.api import app
from python.config import get_config

client = TestClient(app)


def test_health_endpoint():
    """Verify /health endpoint returns 200 OK and expected payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "snapdev-ai-backend"


def test_api_status_endpoint():
    """Verify /api/status endpoint returns backend details and phase info."""
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "snapdev-ai-backend"
    assert any(p in data["phase"] for p in ("Phase 10", "Phase 5", "Phase 4", "Phase 3"))
    assert "uptime_seconds" in data
    assert data["uptime_seconds"] >= 0
    assert "config" in data
    assert data["config"]["model_device"] in ("cpu", "npu")


def test_configuration_defaults():
    """Verify backend configuration defaults."""
    cfg = get_config()
    assert cfg.api_host in ("127.0.0.1", "localhost")
    assert cfg.api_port == 8765
    assert cfg.environment == "development"
    assert cfg.model_device in ("cpu", "npu")


def test_index_status_endpoint():
    """Verify /api/project/index-status returns valid index status."""
    response = client.get("/api/project/index-status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_statistics_endpoint():
    """Verify /api/project/statistics returns structured statistics."""
    response = client.get("/api/project/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "total_files" in data
    assert "total_symbols" in data
    assert "functions" in data
    assert "classes" in data
    assert "interfaces" in data


def test_symbols_search_endpoint():
    """Verify /api/project/symbols returns list of symbols."""
    response = client.get("/api/project/symbols?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
