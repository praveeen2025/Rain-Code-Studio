"""SnapDev AI - Phase 4 RAG Data Models.

Defines Pydantic models for code chunks, vector metadata, retrieval queries,
results, AI-ready context packages, and RAG status.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CodeChunk(BaseModel):
    """Retrieval-ready code chunk retaining structural and contextual information."""
    id: str = Field(description="Unique chunk ID")
    projectId: str = Field(description="Associated project ID")
    fileId: str = Field(description="Associated file ID")
    symbolId: Optional[str] = Field(default=None, description="Associated symbol ID if symbol-based")
    filePath: str = Field(description="Full filesystem path")
    relativePath: Optional[str] = Field(default="", description="Workspace-relative path")
    language: str = Field(description="Programming language (e.g. typescript, python)")
    symbolName: Optional[str] = Field(default=None, description="Symbol name if applicable")
    symbolKind: Optional[str] = Field(default=None, description="Symbol kind (function, class, method, etc.)")
    startLine: int = Field(description="1-indexed starting line")
    endLine: int = Field(description="1-indexed ending line")
    content: str = Field(description="Exact source code lines for this chunk")
    parentSymbol: Optional[str] = Field(default=None, description="Parent class or namespace name")
    imports: List[str] = Field(default_factory=list, description="File import statements for context")
    fileHash: Optional[str] = Field(default=None, description="SHA256 content hash of source file")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional contextual metadata")


class VectorMetadata(BaseModel):
    """Mapping stored alongside FAISS vector indices for source tracing."""
    vectorId: int
    chunkId: str
    projectId: str
    fileId: str
    symbolId: Optional[str] = None
    filePath: str
    relativePath: str = ""
    symbolName: Optional[str] = None
    symbolKind: Optional[str] = None
    language: str
    startLine: int
    endLine: int
    content: str
    parentSymbol: Optional[str] = None
    imports: List[str] = Field(default_factory=list)
    fileHash: Optional[str] = None


class RetrievalResult(BaseModel):
    """Ranked retrieval result combining semantic, structural, and symbol signals."""
    resultId: str
    chunkId: str
    filePath: str
    relativePath: str
    symbolName: Optional[str] = None
    symbolKind: Optional[str] = None
    language: str
    startLine: int
    endLine: int
    content: str
    similarityScore: float = 0.0
    retrievalSources: List[str] = Field(default_factory=list)
    parentSymbol: Optional[str] = None


class AIContextPackage(BaseModel):
    """AI-ready context bundle prepared for Phase 5 local LLM copilot inference."""
    projectId: str
    query: str
    retrievalMode: str
    totalChunks: int
    totalCharacters: int
    estimatedTokens: int
    formattedPromptContext: str
    chunks: List[RetrievalResult] = Field(default_factory=list)
    generationTimeMs: float = 0.0


class RAGStatusResponse(BaseModel):
    """Current state of local vector store and index metrics."""
    status: str = "not_indexed"  # not_indexed | indexing | indexed | updating | error
    projectId: Optional[str] = None
    totalChunks: int = 0
    totalVectors: int = 0
    totalFiles: int = 0
    embeddingModel: str = "local-code-mini-384"
    embeddingDimension: int = 384
    embeddingDevice: str = "cpu"
    lastIndexedAt: Optional[str] = None
    indexSizeBytes: int = 0
    searchLatencyMs: Optional[float] = None
    indexingTimeMs: Optional[float] = None


class IndexProjectRequest(BaseModel):
    """Payload for indexing a project's extracted code chunks."""
    projectId: str
    projectPath: str
    chunks: List[CodeChunk]


class SingleFileIndexRequest(BaseModel):
    """Payload for incremental single-file vector update."""
    projectId: str
    filePath: str
    fileId: str
    chunks: List[CodeChunk]


class SearchRequest(BaseModel):
    """Retrieval query request supporting multiple search modes."""
    projectId: str
    query: str
    mode: str = "hybrid"  # hybrid | semantic | symbol | file
    limit: int = 10
    filterKinds: Optional[List[str]] = None
    filterLanguages: Optional[List[str]] = None


class ContextRequest(BaseModel):
    """Request for compiling an AI-ready context package."""
    projectId: str
    query: str
    mode: str = "hybrid"
    maxChunks: Optional[int] = None
    maxCharacters: Optional[int] = None
