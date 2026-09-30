"""SnapDev AI - Local RAG Subsystem.

Phase 4: Local RAG Foundation for Code Intelligence.
"""

from .context_builder import ContextBuilder
from .embedding import (
    DeterministicTestEmbeddingProvider,
    EmbeddingProvider,
    LocalEmbeddingProvider,
)
from .metadata_store import MetadataStore
from .models import (
    AIContextPackage,
    CodeChunk,
    ContextRequest,
    IndexProjectRequest,
    RAGStatusResponse,
    RetrievalResult,
    SearchRequest,
    SingleFileIndexRequest,
    VectorMetadata,
)
from .ranker import ResultRanker
from .retriever import HybridRetriever
from .service import RAGService, get_rag_service
from .vector_store import FAISSVectorStore, VectorStore

__all__ = [
    "AIContextPackage",
    "CodeChunk",
    "ContextBuilder",
    "ContextRequest",
    "DeterministicTestEmbeddingProvider",
    "EmbeddingProvider",
    "FAISSVectorStore",
    "HybridRetriever",
    "IndexProjectRequest",
    "LocalEmbeddingProvider",
    "MetadataStore",
    "RAGService",
    "RAGStatusResponse",
    "ResultRanker",
    "RetrievalResult",
    "SearchRequest",
    "SingleFileIndexRequest",
    "VectorMetadata",
    "VectorStore",
    "get_rag_service",
]
