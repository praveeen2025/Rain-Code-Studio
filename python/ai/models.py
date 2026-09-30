"""SnapDev AI - Phase 5 AI Data Models.

Defines Pydantic models for chat messages, source references, model configuration,
hardware diagnostics, model status, and streaming chunks.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SourceReference(BaseModel):
    """Clickable source code reference returned with AI responses."""
    filePath: str = Field(description="Absolute file path on host machine")
    relativePath: str = Field(description="Project-relative path")
    symbolName: Optional[str] = Field(default=None, description="Enclosing symbol name")
    symbolKind: Optional[str] = Field(default=None, description="Symbol kind (function, method, class, etc.)")
    startLine: int = Field(description="1-indexed starting line")
    endLine: int = Field(description="1-indexed ending line")
    snippet: str = Field(description="Source code snippet extracted from chunk")
    similarityScore: float = Field(default=0.0, description="RAG retrieval similarity score")


class ChatMessage(BaseModel):
    """A single conversational chat message."""
    id: str = Field(description="Unique message identifier")
    role: str = Field(description="Role: user | assistant | system")
    content: str = Field(description="Markdown content of message")
    timestamp: str = Field(description="ISO timestamp")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved source code references")
    status: str = Field(default="complete", description="sending | streaming | complete | error | cancelled")
    error: Optional[str] = Field(default=None, description="Error message if failed")


class AIHardwareInfo(BaseModel):
    """Hardware diagnostics detected on host device without speculation."""
    device: str = Field(default="cpu", description="Execution device (cpu, npu, etc.)")
    runtime: str = Field(default="Local Transformers / ONNXRuntime", description="Inference engine runtime")
    accelerator: str = Field(default="CPU Execution Provider", description="Active hardware accelerator")
    cpu: str = Field(default="Unknown", description="Processor model name")
    gpu: Optional[str] = Field(default=None, description="GPU device name if available")
    npu: Optional[str] = Field(default=None, description="NPU accelerator name if verified")
    memoryTotalMb: Optional[int] = Field(default=None, description="Available system RAM in megabytes")


class ModelInfo(BaseModel):
    """Descriptive model metadata."""
    modelName: str = Field(description="Configured model identifier")
    modelPath: str = Field(description="Local path to model weights")
    modelFormat: str = Field(default="safetensors", description="Weight format (safetensors, onnx, gguf)")
    quantization: str = Field(default="q4_k_m", description="Quantization scheme")
    contextLength: int = Field(default=4096, description="Maximum context window capacity in tokens")
    device: str = Field(default="cpu", description="Configured compute device")
    runtime: str = Field(default="transformers", description="Active runtime engine")
    modelSizeBytes: Optional[int] = Field(default=None, description="Total byte size of weights on disk")
    isLoaded: bool = Field(default=False, description="Whether model weights are loaded in memory")
    hardwareInfo: AIHardwareInfo = Field(default_factory=AIHardwareInfo)


class ChatRequest(BaseModel):
    """Incoming request for AI chat generation."""
    projectId: Optional[str] = Field(default=None, description="Target project ID for RAG context")
    message: Optional[str] = Field(default=None, description="User question or prompt")
    query: Optional[str] = Field(default=None, description="Alias for message")
    history: List[ChatMessage] = Field(default_factory=list, description="Prior conversational context")
    messages: Optional[List[ChatMessage]] = Field(default=None, description="Alias for history")
    searchMode: str = Field(default="hybrid", description="RAG search mode (hybrid, semantic, symbol, file)")
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    maxTokens: Optional[int] = Field(default=None, ge=1, le=4096)
    stream: bool = Field(default=False, description="Whether to stream response tokens")
    includeRagContext: bool = Field(default=True, description="Whether to include RAG context")
    maxRagChunks: int = Field(default=5, description="Max chunks to retrieve")

    @property
    def user_prompt(self) -> str:
        return (self.message or self.query or "").strip()



class ChatResponse(BaseModel):
    """Completed AI assistant chat response."""
    id: str = Field(description="Unique response message ID")
    role: str = Field(default="assistant")
    content: str = Field(description="Complete generated markdown answer")
    sources: List[SourceReference] = Field(default_factory=list, description="Retrieved code citations")
    promptTokens: int = Field(default=0, description="Tokens in compiled prompt")
    completionTokens: int = Field(default=0, description="Tokens generated by model")
    totalTimeMs: float = Field(default=0.0, description="Total latency in milliseconds")
    timeToFirstTokenMs: Optional[float] = Field(default=None, description="Latency to first generated token")
    tokensPerSecond: Optional[float] = Field(default=None, description="Generation velocity")


class StreamChunk(BaseModel):
    """Single token chunk streamed via Server-Sent Events."""
    id: str
    delta: str
    isFinished: bool = False
    sources: Optional[List[SourceReference]] = None
    error: Optional[str] = None


class AIStatusResponse(BaseModel):
    """Real-time local AI model lifecycle status."""
    status: str = Field(
        default="ready",
        description="not_configured | loading | ready | generating | stopping | error | unloading"
    )
    modelInfo: Optional[ModelInfo] = None
    activeGenerationId: Optional[str] = None
    error: Optional[str] = None
    backendVersion: str = "0.5.0"


class LoadModelRequest(BaseModel):
    """Request to explicitly load or switch models."""
    modelPath: Optional[str] = None
    modelName: Optional[str] = None
    device: Optional[str] = None


# ==================================================
# PHASE 8: PERFORMANCE & RUNTIME CAPABILITY MODELS
# ==================================================


class AIExecutionCapabilityReport(BaseModel):
    """Factual local AI runtime capability report."""
    aiRuntime: str = Field(description="Active runtime engine")
    model: str = Field(description="Loaded model name or architecture")
    modelFormat: str = Field(description="Weight format")
    executionDevice: str = Field(description="Configured device: CPU, GPU, NPU, AUTO, UNKNOWN")
    actualDeviceUsed: str = Field(description="Actual physical compute device currently handling inference")
    cpuSupport: bool = Field(default=True)
    gpuSupport: bool = Field(default=False)
    npuSupport: str = Field(default="Unknown", description="Verified | Not detected | Unknown")
    accelerationProvider: str = Field(description="Active acceleration backend")
    status: str = Field(description="Ready | Loading | Error | Unloaded")
    qualcommHubAvailable: bool = Field(default=False)
    qualcommHubStatus: str = Field(default="Preparation layer active")
    modelLoadTimeMs: Optional[float] = None
    firstTokenLatencyMs: Optional[float] = None
    generationTimeMs: Optional[float] = None
    tokensGenerated: Optional[int] = None
    tokensPerSecond: Optional[float] = None
    memoryUsageMb: Optional[float] = None


class RAGPerformanceReport(BaseModel):
    """Local RAG retrieval and vector store performance report."""
    indexedFiles: int = 0
    totalChunks: int = 0
    totalVectors: int = 0
    embeddingDimension: int = 256
    embeddingDevice: str = "cpu"
    lastRetrievalLatencyMs: Optional[float] = None
    avgRetrievalLatencyMs: Optional[float] = None
    lastEmbeddingTimeMs: Optional[float] = None
    cacheHits: int = 0
    cacheMisses: int = 0
    cacheSize: int = 0


class ModelPerformanceProfile(BaseModel):
    """Detailed configuration profile for local model execution."""
    modelName: str
    modelPath: str
    contextLength: int
    quantization: str
    executionProfile: str
    activeDevice: str
    isLoaded: bool
    memoryFootprintMb: Optional[float] = None


class LocalBenchmarkRunResponse(BaseModel):
    """Results from on-device live benchmark execution."""
    timestamp: str
    durationMs: float
    embeddingBatchTimeMs: float
    generationTimeMs: float
    tokensGenerated: int
    tokensPerSecond: float
    deviceUsed: str
    status: str

