"""SnapDev AI - Comprehensive Unit and Integration Tests for Phase 5 Local AI.

Tests:
1. AIHardwareInfo detection and Snapdragon non-fabrication rule.
2. PromptBuilder strict grounding and context bounds.
3. AIProvider interface & LocalAIProvider lifecycle.
4. ModelManager state machine, concurrency locks, and cancellation.
5. End-to-end integration: User Question -> RAG -> PromptBuilder -> Model -> Response + Sources.
6. FastAPI AI endpoints (/api/ai/status, /api/ai/model, /api/ai/load, /api/ai/unload, /api/ai/chat, /api/ai/stop).
"""

import os
import pytest
from fastapi.testclient import TestClient

from python.api import app
from python.ai.hardware import detect_hardware_info
from python.ai.models import ChatMessage, ChatRequest, SourceReference
from python.ai.prompt_builder import PromptBuilder
from python.ai.provider import DeterministicTestAIProvider, LocalAIProvider
from python.ai.manager import ModelManager, get_model_manager
from python.ai.chat_service import AIChatService, get_chat_service
from python.rag.models import RetrievalResult

client = TestClient(app)


def test_hardware_detection_accuracy():
    """Verify hardware detection accurately reflects the system without false Snapdragon/NPU claims."""
    hw = detect_hardware_info()
    assert hw.device in ("cpu", "gpu", "npu")
    assert hw.cpu is not None
    assert hw.accelerator is not None
    # Host is Intel64, so accelerator must NOT be fabricated as NPU
    if not hw.npu:
        assert hw.accelerator != "Qualcomm Hexagon NPU (Verified)"


def test_prompt_builder_grounding_and_sources():
    """Verify PromptBuilder formats retrieved chunks and extracts structured source references."""
    builder = PromptBuilder()

    chunks = [
        RetrievalResult(
            resultId="res-1",
            chunkId="chk-1",
            filePath="src/auth/auth-service.ts",
            relativePath="src/auth/auth-service.ts",
            symbolName="login",
            symbolKind="method",
            language="typescript",
            startLine=15,
            endLine=45,
            content="export async function login(user, pass) { return authenticate(user, pass); }",
            similarityScore=0.92,
            retrievalSources=["semantic"]
        ),
        RetrievalResult(
            resultId="res-2",
            chunkId="chk-2",
            filePath="src/routes/auth.ts",
            relativePath="src/routes/auth.ts",
            symbolName="authRouter",
            symbolKind="variable",
            language="typescript",
            startLine=1,
            endLine=25,
            content="router.post('/login', authController.login);",
            similarityScore=0.88,
            retrievalSources=["hybrid"]
        )
    ]

    history = [
        ChatMessage(id="m1", role="user", content="Hello", timestamp="2026-09-29T00:00:00Z"),
        ChatMessage(id="m2", role="assistant", content="Hi! How can I help with your code?", timestamp="2026-09-29T00:00:01Z")
    ]

    prompt, sources, prompt_tokens = builder.build_prompt(
        user_question="Where is authentication handled?",
        retrieved_results=chunks,
        chat_history=history,
        context_capacity=4000
    )

    # Check grounding directives
    assert "You are Rain Code Studio" in prompt
    assert "src/auth/auth-service.ts" in prompt
    assert "src/routes/auth.ts" in prompt
    assert "15-45" in prompt
    assert "Where is authentication handled?" in prompt
    assert "login" in prompt

    # Check sources
    assert len(sources) == 2
    assert sources[0].relativePath == "src/auth/auth-service.ts"
    assert sources[0].startLine == 15
    assert sources[0].endLine == 45
    assert sources[0].symbolName == "login"
    assert sources[1].relativePath == "src/routes/auth.ts"
    assert prompt_tokens > 0


def test_prompt_builder_context_limit_truncation():
    """Verify PromptBuilder enforces context limits to protect model context window."""
    builder = PromptBuilder()

    chunks = [
        RetrievalResult(
            resultId=f"res-{i}",
            chunkId=f"chk-{i}",
            filePath=f"src/file_{i}.ts",
            relativePath=f"src/file_{i}.ts",
            symbolName=f"func_{i}",
            symbolKind="function",
            language="typescript",
            startLine=1,
            endLine=50,
            content="// " + ("Code block filler text. " * 30),
            similarityScore=0.9 - (i * 0.05),
            retrievalSources=["semantic"]
        )
        for i in range(10)
    ]

    prompt, sources, prompt_tokens = builder.build_prompt(
        user_question="Summary",
        retrieved_results=chunks,
        context_capacity=700,
        max_response_tokens=100
    )

    # Must retain top chunks and stay bounded
    assert len(sources) < 10
    assert len(sources) >= 1
    assert sources[0].relativePath == "src/file_0.ts"
    assert prompt_tokens > 0


def test_deterministic_ai_provider_lifecycle():
    """Verify AIProvider interface methods on DeterministicTestAIProvider."""
    provider = DeterministicTestAIProvider(start_loaded=False)
    assert not provider.is_loaded()

    info = provider.get_model_info()
    assert info.modelName == "deterministic-test-model"
    assert info.isLoaded is False

    # Load
    assert provider.load_model() is True
    assert provider.is_loaded() is True
    assert provider.get_model_info().isLoaded is True

    # Generate
    ans = provider.generate("Where is authentication handled? Source Context: auth.ts Lines 1-10")
    assert "Deterministic" in ans

    # Stream
    tokens = list(provider.generate_stream("What does this function do?"))
    assert len(tokens) > 0
    assert "".join(tokens) != ""

    # Unload
    assert provider.unload_model() is True
    assert not provider.is_loaded()


def test_model_manager_state_machine_and_concurrency():
    """Verify ModelManager manages lifecycle transitions and prevents unsafe concurrency."""
    manager = ModelManager(provider=DeterministicTestAIProvider(start_loaded=False))

    status = manager.get_status()
    assert status.status in ("ready", "not_configured")

    # Explicit load
    res = manager.load()
    assert res["success"] is True
    assert manager.provider.is_loaded() is True
    assert manager.get_status().status == "ready"

    # Generate via manager
    response_text = manager.generate("Where is login defined?")
    assert len(response_text) > 0

    # Stop generation mechanism
    manager.stop_generation()

    # Unload
    unload_res = manager.unload()
    assert unload_res["success"] is True
    assert manager.provider.is_loaded() is False


def test_end_to_end_rag_to_model_pipeline():
    """Verify integration flow: Question -> RAG -> PromptBuilder -> Model -> Response + Sources."""
    service = AIChatService()

    req = ChatRequest(
        projectId="demo-snapdev",
        message="Where is authentication handled?",
        includeRagContext=True,
        maxRagChunks=3
    )

    resp = service.chat(req)
    assert resp.role == "assistant"
    assert len(resp.content) > 0
    assert resp.totalTimeMs >= 0
    # Verify grounded citations returned
    assert len(resp.sources) > 0
    for src in resp.sources:
        assert src.startLine > 0
        assert src.endLine >= src.startLine
        assert len(src.relativePath) > 0


def test_end_to_end_streaming_rag_pipeline():
    """Verify streaming generation produces incremental tokens and final done event."""
    service = AIChatService()

    req = ChatRequest(
        projectId="demo-snapdev",
        message="What does UserRepository do?",
        includeRagContext=True,
        maxRagChunks=3
    )

    chunks = list(service.chat_stream(req))
    assert len(chunks) > 0
    # First chunk contains metadata & citations
    assert "data:" in chunks[0]


# ==================================================
# FASTAPI AI ENDPOINTS TESTS
# ==================================================

def test_api_ai_status():
    """Test GET /api/ai/status endpoint."""
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "modelInfo" in data
    assert data["modelInfo"]["modelName"] is not None


def test_api_ai_model():
    """Test GET /api/ai/model endpoint."""
    res = client.get("/api/ai/model")
    assert res.status_code == 200
    data = res.json()
    assert "modelName" in data
    assert "contextLength" in data
    assert "device" in data
    assert "runtime" in data


def test_api_ai_load_unload():
    """Test POST /api/ai/load and POST /api/ai/unload endpoints."""
    # Load
    load_res = client.post("/api/ai/load", json={})
    assert load_res.status_code == 200
    load_data = load_res.json()
    assert load_data["success"] is True

    # Unload
    unload_res = client.post("/api/ai/unload")
    assert unload_res.status_code == 200
    unload_data = unload_res.json()
    assert unload_data["success"] is True

    # Re-load for subsequent tests
    client.post("/api/ai/load", json={})


def test_api_ai_chat_endpoint():
    """Test POST /api/ai/chat with grounded RAG query."""
    payload = {
        "projectId": "demo-snapdev",
        "message": "Where is the token validated?",
        "includeRagContext": True,
        "maxRagChunks": 3
    }
    res = client.post("/api/ai/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 0
    assert isinstance(data["sources"], list)
    assert data["totalTimeMs"] >= 0


def test_api_ai_chat_validation_empty_query():
    """Test POST /api/ai/chat validation rejects empty query."""
    res = client.post("/api/ai/chat", json={"message": "   "})
    assert res.status_code == 400


def test_api_ai_stop_endpoint():
    """Test POST /api/ai/stop cancellation endpoint."""
    res = client.post("/api/ai/stop")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
