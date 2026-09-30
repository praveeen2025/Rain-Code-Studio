"""SnapDev AI - Python Performance & Optimization Unit Tests.

Phase 8: Snapdragon Optimisation & Performance.
Tests:
- /api/performance/ai
- /api/performance/rag
- /api/performance/model
- /api/performance/benchmark
- Qualcomm AI Hub preparation and detection layer
- LocalEmbeddingProvider bounded LRU cache
- LocalAIProvider device selection and execution report
"""

import pytest
from fastapi.testclient import TestClient
from python.api import app
from python.ai import get_qualcomm_hub_service, get_model_manager
from python.rag import get_rag_service


@pytest.fixture
def client():
    return TestClient(app)


class TestPerformanceEndpoints:
    """Test FastAPI performance and telemetry endpoints."""

    def test_get_ai_performance_endpoint(self, client):
        response = client.get("/api/performance/ai")
        assert response.status_code == 200
        data = response.json()
        assert "aiRuntime" in data
        assert "executionDevice" in data
        assert "actualDeviceUsed" in data
        assert "cpuSupport" in data
        assert data["cpuSupport"] is True
        assert data["npuSupport"] in ("Verified", "Not detected", "Unknown")
        assert "qualcommHubAvailable" in data

    def test_get_rag_performance_endpoint(self, client):
        response = client.get("/api/performance/rag")
        assert response.status_code == 200
        data = response.json()
        assert "embeddingDimension" in data
        assert data["embeddingDimension"] > 0
        assert "cacheHits" in data
        assert "cacheMisses" in data
        assert "cacheSize" in data

    def test_get_model_performance_profile(self, client):
        response = client.get("/api/performance/model")
        assert response.status_code == 200
        data = response.json()
        assert "modelName" in data
        assert "contextLength" in data
        assert "executionProfile" in data
        assert "activeDevice" in data
        assert "isLoaded" in data

    def test_run_local_benchmark_endpoint(self, client):
        response = client.post("/api/performance/benchmark")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["durationMs"] > 0
        assert data["embeddingBatchTimeMs"] >= 0
        assert data["generationTimeMs"] >= 0
        assert data["tokensGenerated"] > 0
        assert data["tokensPerSecond"] >= 0
        assert "deviceUsed" in data


class TestQualcommAIHubIntegration:
    """Test Qualcomm AI Hub preparation layer without hallucinated acceleration."""

    def test_hub_status_is_honest(self):
        hub = get_qualcomm_hub_service()
        status = hub.get_hub_status()
        assert "isInstalled" in status
        assert "status" in status
        assert "supportedDevices" in status
        assert len(status["supportedDevices"]) > 0

    def test_prepare_model_fallback_when_sdk_not_installed(self):
        hub = get_qualcomm_hub_service()
        # When qai_hub is not present in standard dev environment
        if not hub.is_hub_installed:
            res = hub.prepare_model_for_npu("test-model")
            assert res["success"] is False
            assert "not installed" in res["error"].lower()
            assert "fallback" in res


class TestEmbeddingCache:
    """Test LocalEmbeddingProvider LRU cache and memory efficiency."""

    def test_embedding_cache_hit_and_miss(self):
        rag = get_rag_service()
        provider = rag.embedding_provider

        # Reset cache
        if hasattr(provider, "clear_cache"):
            provider.clear_cache()

        sample_code = "export function calculateTotal(a: number, b: number): number { return a + b; }"

        # First call: miss
        vec1 = provider.embed_text(sample_code)
        assert vec1 is not None

        if hasattr(provider, "get_cache_stats"):
            stats1 = provider.get_cache_stats()
            assert stats1["cacheMisses"] == 1
            assert stats1["cacheHits"] == 0
            assert stats1["cacheSize"] == 1

            # Second call: hit!
            vec2 = provider.embed_text(sample_code)
            stats2 = provider.get_cache_stats()
            assert stats2["cacheHits"] == 1
            assert stats2["cacheSize"] == 1
            assert (vec1 == vec2).all()


class TestLocalAIProviderDeviceSelection:
    """Test auto device selection and capability reporting."""

    def test_execution_capability_report(self):
        mgr = get_model_manager()
        report = mgr.provider.get_execution_capability_report()
        assert report.cpuSupport is True
        assert report.executionDevice in ("CPU", "GPU", "NPU", "AUTO", "UNKNOWN")
        assert report.status in ("Ready", "Unloaded")
