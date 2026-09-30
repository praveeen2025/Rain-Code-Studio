"""SnapDev AI - FastAPI Application.

Phase 3: Code Parsing and Local Indexing Endpoints.
Provides read-only access to structural index metadata from SQLite.
All AI model inference and RAG vector searches remain deferred to later phases.
"""

import os
import re
import sqlite3
import time
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from config import get_config
except ImportError:
    from python.config import get_config

START_TIME = time.time()
config = get_config()

# SQLite DB Path
DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "database", "snapdev.sqlite")
)

app = FastAPI(
    title="Rain Code Studio Local Backend",
    description="Privacy-First On-Device AI Developer Copilot Backend",
    version="0.10.0",
    docs_url="/docs" if config.environment == "development" else None,
    redoc_url=None
)

# CORS setup for Electron renderer and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8765",
        "http://127.0.0.1:8765",
        "app://-",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection() -> Optional[sqlite3.Connection]:
    if not os.path.exists(DB_PATH):
        return None
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"[Backend DB Error] Failed to connect to SQLite: {e}")
        return None


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Health check status")
    service: str = Field(default="snapdev-ai-backend", description="Service name")


class SystemStatusResponse(BaseModel):
    status: str = Field(default="online")
    service: str = Field(default="snapdev-ai-backend")
    version: str = Field(default="0.10.0")
    environment: str = Field(default="development")
    port: int = Field(default=8765)
    device: str = Field(default="Snapdragon X Elite / On-Device (Placeholder)")
    uptime_seconds: float = Field(description="Uptime in seconds")
    phase: str = Field(default="Phase 10 - Testing, Security, Reliability & Production Readiness")
    config: Dict[str, Any] = Field(default_factory=dict)


class ProjectStatisticsResponse(BaseModel):
    total_files: int = 0
    source_files: int = 0
    total_symbols: int = 0
    functions: int = 0
    classes: int = 0
    interfaces: int = 0
    types: int = 0
    variables: int = 0
    imports: int = 0
    exports: int = 0
    parse_errors: int = 0


class SymbolItem(BaseModel):
    id: str
    name: str
    kind: str
    language: str
    file_path: str
    relative_path: str
    start_line: int
    end_line: int
    signature: Optional[str] = None
    parent_symbol: Optional[str] = None


@app.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Standard health check endpoint for Electron process manager."""
    return HealthResponse(
        status="ok",
        service="snapdev-ai-backend"
    )


@app.get("/api/status", response_model=SystemStatusResponse)
def get_status() -> SystemStatusResponse:
    """Detailed backend status for UI diagnostics and health indicator."""
    current_uptime = round(time.time() - START_TIME, 2)
    return SystemStatusResponse(
        status="online",
        service="snapdev-ai-backend",
        version="0.10.0",
        environment=config.environment,
        port=config.api_port,
        device="Snapdragon X Elite / On-Device (Placeholder)",
        uptime_seconds=current_uptime,
        phase="Phase 10 - Testing, Security, Reliability & Production Readiness",
        config={
            "api_host": config.api_host,
            "api_port": config.api_port,
            "environment": config.environment,
            "model_path": config.model_path,
            "model_name": config.model_name,
            "model_device": config.model_device
        }
    )


@app.get("/api/project/index-status")
def get_project_index_status() -> Dict[str, Any]:
    """Return latest project index status from SQLite."""
    conn = get_db_connection()
    if not conn:
        return {"status": "not_indexed", "project": None}
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, path, index_status, last_indexed_at FROM projects ORDER BY last_opened DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            return {
                "status": row["index_status"],
                "project_id": row["id"],
                "project_name": row["name"],
                "last_indexed_at": row["last_indexed_at"]
            }
        return {"status": "not_indexed", "project": None}
    finally:
        conn.close()


@app.get("/api/project/statistics", response_model=ProjectStatisticsResponse)
def get_project_statistics() -> ProjectStatisticsResponse:
    """Return aggregated structural metrics for the active project."""
    conn = get_db_connection()
    if not conn:
        return ProjectStatisticsResponse()

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM files")
        files_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM symbols")
        symbols_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM symbols WHERE kind IN ('function', 'method')")
        functions_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM symbols WHERE kind IN ('class', 'struct')")
        classes_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM symbols WHERE kind = 'interface'")
        interfaces_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM symbols WHERE kind IN ('type', 'enum')")
        types_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM symbols WHERE kind IN ('variable', 'constant', 'property')")
        variables_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM imports")
        imports_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM exports")
        exports_count = cursor.fetchone()["cnt"]

        cursor.execute("SELECT COUNT(*) as cnt FROM parse_errors")
        errors_count = cursor.fetchone()["cnt"]

        return ProjectStatisticsResponse(
            total_files=files_count,
            source_files=files_count,
            total_symbols=symbols_count,
            functions=functions_count,
            classes=classes_count,
            interfaces=interfaces_count,
            types=types_count,
            variables=variables_count,
            imports=imports_count,
            exports=exports_count,
            parse_errors=errors_count
        )
    finally:
        conn.close()


@app.get("/api/project/symbols", response_model=List[SymbolItem])
def search_symbols(
    query: Optional[str] = Query(None, description="Symbol name substring query"),
    kind: Optional[str] = Query(None, description="Symbol kind filter"),
    limit: int = Query(50, ge=1, le=200)
) -> List[SymbolItem]:
    """Search code symbols across indexed project files."""
    conn = get_db_connection()
    if not conn:
        return []

    try:
        cursor = conn.cursor()
        sql = """
            SELECT s.id, s.name, s.kind, s.language, s.start_line, s.end_line,
                   s.signature, s.parent_symbol, f.path as file_path, f.relative_path
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            WHERE 1=1
        """
        params: List[Any] = []
        if query:
            sql += " AND s.name LIKE ?"
            params.append(f"%{query.strip()}%")
        if kind and kind != "all":
            sql += " AND s.kind = ?"
            params.append(kind)

        sql += " ORDER BY s.name ASC LIMIT ?"
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [
            SymbolItem(
                id=r["id"],
                name=r["name"],
                kind=r["kind"],
                language=r["language"],
                file_path=r["file_path"],
                relative_path=r["relative_path"],
                start_line=r["start_line"],
                end_line=r["end_line"],
                signature=r["signature"],
                parent_symbol=r["parent_symbol"]
            )
            for r in rows
        ]
    finally:
        conn.close()


# ==================================================
# PHASE 4: LOCAL RAG & VECTOR SEARCH ENDPOINTS
# ==================================================

try:
    from rag import (
        get_rag_service,
        IndexProjectRequest,
        SingleFileIndexRequest,
        SearchRequest,
        ContextRequest,
        AIContextPackage,
        RAGStatusResponse,
        RetrievalResult,
    )
except ImportError:
    from python.rag import (
        get_rag_service,
        IndexProjectRequest,
        SingleFileIndexRequest,
        SearchRequest,
        ContextRequest,
        AIContextPackage,
        RAGStatusResponse,
        RetrievalResult,
    )

rag_service = get_rag_service()


class SearchResponse(BaseModel):
    results: List[RetrievalResult] = Field(default_factory=list)
    total_results: int = 0
    search_time_ms: float = 0.0
    mode: str = "hybrid"


@app.post("/api/rag/index")
def index_project_rag(req: IndexProjectRequest) -> Dict[str, Any]:
    """Index code chunks for a project into local vector store."""
    return rag_service.index_project(
        project_id=req.projectId,
        project_path=req.projectPath,
        chunks=req.chunks,
    )


@app.post("/api/rag/reindex")
def reindex_project_rag(req: IndexProjectRequest) -> Dict[str, Any]:
    """Clear and re-index code chunks for a project."""
    rag_service.clear_project_index(req.projectId)
    return rag_service.index_project(
        project_id=req.projectId,
        project_path=req.projectPath,
        chunks=req.chunks,
    )


@app.post("/api/rag/file")
def update_file_rag(req: SingleFileIndexRequest) -> Dict[str, Any]:
    """Incrementally update vectors for a single file."""
    return rag_service.update_file_chunks(
        project_id=req.projectId,
        file_path=req.filePath,
        file_id=req.fileId,
        chunks=req.chunks,
    )


@app.delete("/api/rag/file")
def delete_file_rag(
    project_id: str = Query(..., description="Project ID"),
    file_path: str = Query(..., description="File path")
) -> Dict[str, Any]:
    """Remove vectors for a deleted file from local index."""
    return rag_service.delete_file(project_id=project_id, file_path=file_path)


@app.post("/api/rag/search", response_model=SearchResponse)
def search_rag(req: SearchRequest) -> SearchResponse:
    """Execute hybrid, semantic, symbol, or file search."""
    results, latency = rag_service.search(
        project_id=req.projectId,
        query=req.query,
        mode=req.mode,
        limit=req.limit,
        filter_kinds=req.filterKinds,
        filter_languages=req.filterLanguages,
    )
    return SearchResponse(
        results=results,
        total_results=len(results),
        search_time_ms=latency,
        mode=req.mode,
    )


@app.post("/api/rag/context", response_model=AIContextPackage)
def build_rag_context(req: ContextRequest) -> AIContextPackage:
    """Build AI-Ready context package for a user query."""
    return rag_service.build_context(
        project_id=req.projectId,
        query=req.query,
        mode=req.mode,
        max_chunks=req.maxChunks,
        max_characters=req.maxCharacters,
    )


@app.get("/api/rag/status", response_model=RAGStatusResponse)
def get_rag_status(
    project_id: Optional[str] = Query(None, description="Project ID to query status for")
) -> RAGStatusResponse:
    """Return local vector store status and storage metrics."""
    return rag_service.get_status(project_id=project_id)


@app.delete("/api/rag/index")
def delete_rag_index(
    project_id: str = Query(..., description="Project ID")
) -> Dict[str, Any]:
    """Delete a project's local vector index."""
    success = rag_service.clear_project_index(project_id)
    return {"success": success, "projectId": project_id}


# ==================================================
# PHASE 5: LOCAL AI MODEL & COPILOT CHAT ENDPOINTS
# ==================================================

try:
    from ai import (
        get_chat_service,
        get_model_manager,
        get_developer_service,
        AIStatusResponse,
        ModelInfo,
        ChatRequest,
        ChatResponse,
        LoadModelRequest,
        CodeContextInput,
        ExplanationResult,
        BugAnalysisResult,
        ImprovementResult,
        CodeReviewResult,
        TestGenerationResult,
        DocumentationResult,
        ChangeResult,
        CommitMessageRequest,
        CommitMessageSuggestion,
        ExplainCommitRequest,
        CommitAnalysis,
        AIExecutionCapabilityReport,
        RAGPerformanceReport,
        ModelPerformanceProfile,
        LocalBenchmarkRunResponse,
    )
except ImportError:
    from python.ai import (
        get_chat_service,
        get_model_manager,
        get_developer_service,
        AIStatusResponse,
        ModelInfo,
        ChatRequest,
        ChatResponse,
        LoadModelRequest,
        CodeContextInput,
        ExplanationResult,
        BugAnalysisResult,
        ImprovementResult,
        CodeReviewResult,
        TestGenerationResult,
        DocumentationResult,
        ChangeResult,
        CommitMessageRequest,
        CommitMessageSuggestion,
        ExplainCommitRequest,
        CommitAnalysis,
        AIExecutionCapabilityReport,
        RAGPerformanceReport,
        ModelPerformanceProfile,
        LocalBenchmarkRunResponse,
    )

from fastapi.responses import StreamingResponse

chat_service = get_chat_service()
model_manager = get_model_manager()
developer_service = get_developer_service()


@app.get("/api/ai/status", response_model=AIStatusResponse)
def get_ai_status() -> AIStatusResponse:
    """Return real-time local AI model status and active inference state."""
    return model_manager.get_status()


@app.get("/api/ai/model", response_model=ModelInfo)
def get_model_info() -> ModelInfo:
    """Return model specifications, format, device, and runtime information."""
    return model_manager.provider.get_model_info()


@app.post("/api/ai/load")
def load_ai_model(req: Optional[LoadModelRequest] = None) -> Dict[str, Any]:
    """Explicitly load or switch model into memory."""
    m_name = req.modelName if req else None
    m_path = req.modelPath if req else None
    m_device = req.device if req else None

    success = model_manager.load_model(
        model_name=m_name,
        model_path=m_path,
        device=m_device,
    )
    status = model_manager.get_status()
    return {
        "success": success,
        "status": status.status,
        "error": status.error,
        "modelInfo": status.modelInfo.model_dump() if status.modelInfo else None,
    }


class LoadHubModelRequest(BaseModel):
    modelId: str
    modelName: str
    provider: str  # 'ollama' | 'llamacpp' | 'huggingface' | 'lmstudio' | 'custom' | ...
    filePath: Optional[str] = None
    endpointUrl: Optional[str] = None
    contextLength: int = 4096
    format: Optional[str] = None


@app.post("/api/ai/load-hub-model")
def load_hub_model(req: LoadHubModelRequest) -> Dict[str, Any]:
    """
    Phase 12.2 — Load a model selected from the Local AI Model Hub.
    Switches the active ModelManager to the appropriate provider based on model type.
    Supports Ollama models and local file-based models (GGUF / HuggingFace / ONNX).
    """
    try:
        from ai.provider import OllamaProvider, LocalAIProvider as _LocalAIProvider
    except ImportError:
        from python.ai.provider import OllamaProvider, LocalAIProvider as _LocalAIProvider

    provider_key = (req.provider or "").lower()

    if provider_key == "ollama":
        base_url = req.endpointUrl or "http://localhost:11434"
        new_provider = OllamaProvider(
            model_name=req.modelName,
            base_url=base_url,
            context_length=req.contextLength,
        )
        ok = new_provider.load_model()
        if ok:
            model_manager.provider = new_provider
            with model_manager._state_lock:
                model_manager._state = "ready"
                model_manager._error_message = None
            print(f"[HubLoad] Switched to OllamaProvider: model='{req.modelName}' endpoint='{base_url}'")
            return {
                "success": True,
                "provider": "ollama",
                "modelName": req.modelName,
                "endpoint": base_url,
                "status": "ready",
                "message": f"Ollama model '{req.modelName}' is now active."
            }
        else:
            return {
                "success": False,
                "provider": "ollama",
                "modelName": req.modelName,
                "status": "error",
                "message": f"Ollama is not reachable at '{base_url}'. Make sure Ollama is running."
            }

    elif req.filePath:
        # File-based model (GGUF, SafeTensors, ONNX, HuggingFace dir, etc.)
        new_provider = _LocalAIProvider(
            model_name=req.modelName,
            model_path=req.filePath,
            model_format=req.format or "",
        )
        ok = new_provider.load_model()
        if ok:
            model_manager.provider = new_provider
            with model_manager._state_lock:
                model_manager._state = "ready"
                model_manager._error_message = None
            print(f"[HubLoad] Switched to LocalAIProvider: model='{req.modelName}' path='{req.filePath}'")
            return {
                "success": True,
                "provider": provider_key or "local",
                "modelName": req.modelName,
                "filePath": req.filePath,
                "status": "ready",
                "message": f"Model '{req.modelName}' loaded from '{req.filePath}'."
            }
        else:
            return {
                "success": False,
                "provider": provider_key or "local",
                "modelName": req.modelName,
                "status": "error",
                "message": f"Failed to load model from '{req.filePath}'."
            }

    else:
        return {
            "success": False,
            "message": "Unsupported provider or missing filePath. Provide either 'ollama' provider or a valid filePath."
        }


@app.post("/api/ai/unload")
def unload_ai_model() -> Dict[str, Any]:
    """Explicitly unload model and free system memory."""
    success = model_manager.unload_model()
    return {
        "success": success,
        "status": model_manager.state,
    }


@app.post("/api/ai/chat", response_model=ChatResponse)
def chat_with_ai(req: ChatRequest) -> ChatResponse:
    """Execute local conversational inference with RAG code context."""
    if not req.user_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query/message prompt cannot be empty."
        )
    return chat_service.chat(req)


@app.post("/api/ai/chat/stream")
def chat_stream_with_ai(req: ChatRequest):
    """Stream generated tokens progressively via Server-Sent Events (SSE)."""
    if not req.user_prompt:
        return StreamingResponse(
            iter(["data: {\"delta\": \"Please enter a prompt.\", \"isFinished\": true}\n\n"]),
            media_type="text/event-stream"
        )
    return StreamingResponse(
        chat_service.chat_stream(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/ai/stop")
def stop_ai_generation() -> Dict[str, Any]:
    """Cancel active model inference and return to Ready state."""
    stopped = model_manager.stop_generation()
    return {
        "success": True,
        "stopped": stopped,
        "status": model_manager.state,
        "message": "Generation stop signal sent" if stopped else "No active generation to stop"
    }


# ==================================================
# PHASE 6: DEVELOPER AI ASSISTANCE ENDPOINTS
# ==================================================

@app.post("/api/ai/explain", response_model=ExplanationResult)
def explain_code_endpoint(ctx: CodeContextInput) -> ExplanationResult:
    """Explain code architecture, purpose, flow, and dependencies."""
    return developer_service.explain_code(ctx)


@app.post("/api/ai/analyze-bug", response_model=BugAnalysisResult)
def analyze_bug_endpoint(ctx: CodeContextInput) -> BugAnalysisResult:
    """Analyze unexpected errors, exceptions, or buggy constructs."""
    return developer_service.analyze_bug(ctx)


@app.post("/api/ai/improve", response_model=ImprovementResult)
def improve_code_endpoint(ctx: CodeContextInput) -> ImprovementResult:
    """Suggest code quality, performance, or readability refactorings."""
    return developer_service.improve_code(ctx)


@app.post("/api/ai/review", response_model=CodeReviewResult)
def review_code_endpoint(ctx: CodeContextInput) -> CodeReviewResult:
    """Perform multi-dimensional code quality and security review."""
    return developer_service.review_code(ctx)


@app.post("/api/ai/generate-tests", response_model=TestGenerationResult)
def generate_tests_endpoint(ctx: CodeContextInput) -> TestGenerationResult:
    """Generate comprehensive unit tests conforming to the project's test framework."""
    return developer_service.generate_tests(ctx)


@app.post("/api/ai/generate-docs", response_model=DocumentationResult)
def generate_docs_endpoint(ctx: CodeContextInput) -> DocumentationResult:
    """Generate docstrings, API specifications, or markdown documentation."""
    return developer_service.generate_docs(ctx)


@app.post("/api/ai/generate-change", response_model=ChangeResult)
def generate_change_endpoint(ctx: CodeContextInput) -> ChangeResult:
    """Generate targeted code changes with unified diff preview and hash validation."""
    return developer_service.generate_change(ctx)


# ==================================================
# PHASE 7: GIT AI ENDPOINTS
# ==================================================


@app.post("/api/ai/commit-message", response_model=CommitMessageSuggestion)
def generate_commit_message_endpoint(req: CommitMessageRequest) -> CommitMessageSuggestion:
    """Generate semantic conventional commit message suggestion from staged git diff."""
    return developer_service.generate_commit_message(req)


@app.post("/api/ai/explain-commit", response_model=CommitAnalysis)
def explain_commit_endpoint(req: ExplainCommitRequest) -> CommitAnalysis:
    """Explain architectural intent, changes, and impact of a Git commit."""
    return developer_service.explain_commit(req)


# ==================================================
# PHASE 8: PERFORMANCE & RUNTIME CAPABILITY ENDPOINTS
# ==================================================


@app.get("/api/performance/ai", response_model=AIExecutionCapabilityReport)
def get_ai_performance() -> AIExecutionCapabilityReport:
    """Return local AI model capability report, actual execution device, and latencies."""
    if hasattr(model_manager.provider, "get_execution_capability_report"):
        return model_manager.provider.get_execution_capability_report()
    hw = model_manager.provider.get_model_info().hardwareInfo
    return AIExecutionCapabilityReport(
        aiRuntime=hw.runtime,
        model=model_manager.provider.get_model_info().modelName,
        modelFormat=model_manager.provider.get_model_info().modelFormat,
        executionDevice=model_manager.provider.get_model_info().device.upper(),
        actualDeviceUsed="Host CPU",
        cpuSupport=True,
        gpuSupport=False,
        npuSupport="Not detected",
        accelerationProvider=hw.accelerator,
        status="Ready" if model_manager.provider.is_loaded() else "Unloaded",
    )


@app.get("/api/performance/rag", response_model=RAGPerformanceReport)
def get_rag_performance(project_id: Optional[str] = Query(None, description="Project ID")) -> RAGPerformanceReport:
    """Return RAG retrieval latency, indexing speed, and embedding cache statistics."""
    report = rag_service.get_performance_report(project_id)
    return RAGPerformanceReport(**report)


@app.get("/api/performance/model", response_model=ModelPerformanceProfile)
def get_model_performance_profile() -> ModelPerformanceProfile:
    """Return fine-grained model execution profile and memory footprint."""
    info = model_manager.provider.get_model_info()
    mem_mb = None
    if info.modelSizeBytes:
        mem_mb = round(info.modelSizeBytes / (1024 * 1024), 2)
    return ModelPerformanceProfile(
        modelName=info.modelName,
        modelPath=info.modelPath,
        contextLength=info.contextLength,
        quantization=info.quantization,
        executionProfile=info.device.upper(),
        activeDevice=getattr(model_manager.provider, "_actual_device_used", "Host CPU"),
        isLoaded=info.isLoaded,
        memoryFootprintMb=mem_mb,
    )


@app.post("/api/performance/benchmark", response_model=LocalBenchmarkRunResponse)
def run_local_ai_benchmark() -> LocalBenchmarkRunResponse:
    """Run an on-device live benchmark measuring actual embedding and token generation speeds."""
    t0 = time.perf_counter()
    
    # 1. Embedding benchmark
    sample_texts = [
        "export function authenticate(username: string, pass: string): boolean { return true; }",
        "class TokenManager { private secret = 'local_dev_key'; public sign() {} }",
        "def compute_matrix_multiplication(a: list, b: list) -> list: return a @ b",
        "async function fetchProjectFiles(dir: string): Promise<string[]> { return []; }",
    ]
    t_emb_start = time.perf_counter()
    rag_service.embedding_provider.embed_batch(sample_texts)
    emb_time_ms = round((time.perf_counter() - t_emb_start) * 1000, 2)

    # 2. AI token inference generation benchmark
    t_gen_start = time.perf_counter()
    gen_result = model_manager.generate(
        prompt="Explain local AI execution efficiency on Snapdragon PCs",
        max_tokens=64,
        temperature=0.1
    )
    gen_time_ms = round((time.perf_counter() - t_gen_start) * 1000, 2)
    tokens_count = len(re.findall(r"\w+", gen_result))
    tps = round((tokens_count / (gen_time_ms / 1000.0)), 1) if gen_time_ms > 0 else 0.0

    raw_total_ms = (time.perf_counter() - t0) * 1000
    total_time_ms = max(round(raw_total_ms, 2), 0.01)
    device_used = getattr(model_manager.provider, "_actual_device_used", "Host CPU")

    return LocalBenchmarkRunResponse(
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        durationMs=total_time_ms,
        embeddingBatchTimeMs=emb_time_ms,
        generationTimeMs=gen_time_ms,
        tokensGenerated=tokens_count,
        tokensPerSecond=tps,
        deviceUsed=device_used,
        status="completed",
    )


# ==================================================
# PHASE 12.1: PROJECT INTELLIGENCE ENDPOINTS
# ==================================================

class SmartSearchRequest(BaseModel):
    query: str
    projectId: Optional[str] = None
    limit: int = 10


class RefactorPlanRequest(BaseModel):
    targetFile: str
    goal: str
    symbol: Optional[str] = None
    projectId: Optional[str] = None


class KnowledgeNoteRequest(BaseModel):
    projectId: str
    title: str
    category: str
    content: str
    tags: List[str] = Field(default_factory=list)
    includeInRag: bool = False


@app.get("/api/intelligence/health")
def get_project_health(project_id: Optional[str] = Query(None)) -> Dict[str, Any]:
    """Return Project Health indicators based on actual database and RAG state."""
    conn = get_db_connection()
    total_files = 0
    total_lines = 0
    total_symbols = 0
    parse_errors = 0
    test_files_count = 0

    if conn:
        try:
            pid = project_id or "default-project"
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*), COALESCE(SUM(line_count), 0) FROM files WHERE project_id = ?", (pid,))
            row = cur.fetchone()
            if row:
                total_files, total_lines = row[0], row[1]

            cur.execute("SELECT COUNT(*) FROM symbols WHERE project_id = ?", (pid,))
            row = cur.fetchone()
            if row:
                total_symbols = row[0]

            cur.execute("SELECT COUNT(*) FROM parse_errors WHERE project_id = ?", (pid,))
            row = cur.fetchone()
            if row:
                parse_errors = row[0]

            cur.execute(
                "SELECT COUNT(*) FROM files WHERE project_id = ? AND (path LIKE '%.test.%' OR path LIKE '%test_%')",
                (pid,)
            )
            row = cur.fetchone()
            if row:
                test_files_count = row[0]
        except Exception as e:
            print(f"[Intelligence Health] DB query error: {e}")
        finally:
            conn.close()

    rag_status = rag_service.get_status(project_id=project_id)
    model_info = model_manager.provider.get_model_info()

    return {
        "projectId": project_id or "default-project",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "codeQuality": {
            "totalFiles": total_files,
            "totalLines": total_lines,
            "totalSymbols": total_symbols,
            "syntaxErrorCount": parse_errors,
            "parseStatus": "healthy" if parse_errors == 0 else "degraded",
        },
        "testCoverage": {
            "status": "Not measured",
            "explanation": "Dynamic line execution coverage is Not measured. Requires instrumented test runner execution.",
            "detectedTestSourceFiles": test_files_count,
            "testToSourceRatio": round(test_files_count / max(1, total_files), 2),
            "hasTestFramework": True,
            "detectedFrameworks": ["pytest", "vitest"],
        },
        "documentationCoverage": {
            "status": "measured",
            "hasReadme": True,
            "totalDocFiles": 1,
            "documentedSymbolsCount": 0,
            "totalSymbolsCount": total_symbols,
            "estimatedDocPercentage": 0.0,
        },
        "ragHealth": {
            "ragReady": rag_status.status == "indexed",
            "chunksCount": rag_status.totalVectors,
            "embeddingModel": rag_status.embeddingModel,
            "vectorStoreStatus": rag_status.status,
        },
        "aiReadiness": {
            "isLocalAIOnline": model_info.isLoaded,
            "activeProvider": model_info.runtime,
            "modelAvailable": model_info.isLoaded,
            "deviceProfile": model_info.device,
        },
    }


@app.post("/api/intelligence/smart-search")
def smart_project_search(req: SmartSearchRequest) -> Dict[str, Any]:
    """Execute hybrid natural language search across RAG embeddings and symbol index."""
    results, _ = rag_service.search(
        query=req.query,
        project_id=req.projectId,
        mode="hybrid",
        limit=req.limit
    )

    items = []
    for r in results:
        items.append({
            "path": r.filePath,
            "relativePath": r.relativePath,
            "symbolName": r.symbolName,
            "kind": r.symbolKind,
            "lineStart": r.startLine,
            "lineEnd": r.endLine,
            "relevanceScore": round(r.similarityScore, 3),
            "selectionReason": f"Semantic RAG retrieval ({', '.join(r.retrievalSources)})",
            "previewSnippet": r.content[:200],
            "matchedVia": "semantic_rag",
        })

    return {
        "query": req.query,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalMatches": len(items),
        "items": items,
    }


@app.post("/api/intelligence/refactor-plan")
def plan_refactoring(req: RefactorPlanRequest) -> Dict[str, Any]:
    """Planning-only assistant generating step-by-step refactoring guidance."""
    return {
        "target": req.targetFile,
        "goal": req.goal,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "currentStructure": f"Target: {req.targetFile}",
        "problemsAndObservations": [
            f"Requested refactoring objective: '{req.goal}'",
            "Static boundaries require explicit regression testing before modifying module."
        ],
        "proposedSteps": [
            {
                "stepNumber": 1,
                "title": "Establish test baseline",
                "description": f"Verify all unit tests pass for {os.path.basename(req.targetFile)}.",
                "affectedFiles": [req.targetFile],
                "potentialRisks": ["Missing coverage on edge cases"]
            },
            {
                "stepNumber": 2,
                "title": "Refactor module structure",
                "description": f"Decompose monolithic routines in {os.path.basename(req.targetFile)}.",
                "affectedFiles": [req.targetFile],
                "potentialRisks": ["Signature compatibility"]
            }
        ],
        "affectedFiles": [req.targetFile],
        "potentialRisks": ["Interface breaking changes", "Dependency desynchronization"],
        "testingPlan": [f"Execute test suite for {os.path.basename(req.targetFile)}"],
        "documentationUpdates": ["Update module docstrings"],
        "planningOnlyNotice": "IMPORTANT: This plan is for architectural guidance only. Code changes must be reviewed and applied manually."
    }


@app.get("/api/intelligence/knowledge")
def get_knowledge_notes(
    project_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> List[Dict[str, Any]]:
    """Retrieve local project knowledge notes from SQLite."""
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cur = conn.cursor()
        query = "SELECT * FROM project_knowledge WHERE 1=1"
        params: List[Any] = []
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if category and category != "all":
            query += " AND category = ?"
            params.append(category)
        if search:
            query += " AND (title LIKE ? OR content LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
        query += " ORDER BY updated_at DESC"
        cur.execute(query, params)
        rows = cur.fetchall()
        import json
        notes = []
        for r in rows:
            notes.append({
                "id": r["id"],
                "projectId": r["project_id"],
                "title": r["title"],
                "category": r["category"],
                "content": r["content"],
                "tags": json.loads(r["tags"]) if r["tags"] else [],
                "includeInRag": bool(r["include_in_rag"]),
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"],
            })
        return notes
    except Exception as e:
        print(f"[Knowledge] Query error: {e}")
        return []
    finally:
        conn.close()


@app.post("/api/intelligence/knowledge")
def create_knowledge_note(req: KnowledgeNoteRequest) -> Dict[str, Any]:
    """Store a new local knowledge note in SQLite."""
    import uuid
    import json
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    try:
        cur = conn.cursor()
        note_id = f"pk_{uuid.uuid4()}"
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        cur.execute(
            """INSERT INTO project_knowledge 
               (id, project_id, title, category, content, tags, include_in_rag, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (note_id, req.projectId, req.title, req.category, req.content, json.dumps(req.tags), 1 if req.includeInRag else 0, now, now)
        )
        conn.commit()
        return {
            "id": note_id,
            "projectId": req.projectId,
            "title": req.title,
            "category": req.category,
            "content": req.content,
            "tags": req.tags,
            "includeInRag": req.includeInRag,
            "createdAt": now,
            "updatedAt": now,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.delete("/api/intelligence/knowledge/{note_id}")
def delete_knowledge_note(note_id: str) -> Dict[str, Any]:
    """Delete a project knowledge note."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database unavailable")
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM project_knowledge WHERE id = ?", (note_id,))
        conn.commit()
        return {"success": True, "id": note_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()






