"""SnapDev AI - RAG Service Orchestrator.

Phase 4: Local RAG Foundation.
Encapsulates all embedding, vector indexing, incremental file updates, retrieval,
ranking, and context building logic outside FastAPI route handlers.
Manages project-isolated vector indices stored under indexes/<project_id>/.
"""

import json
import os
import shutil
import time
from typing import Any, Dict, List, Optional, Tuple

try:
    from config import get_config
except ImportError:
    from python.config import get_config

from .context_builder import ContextBuilder
from .embedding import EmbeddingProvider, LocalEmbeddingProvider
from .metadata_store import MetadataStore
from .models import (
    AIContextPackage,
    CodeChunk,
    RAGStatusResponse,
    RetrievalResult,
)
from .retriever import HybridRetriever
from .vector_store import FAISSVectorStore, VectorStore


class RAGService:
    """Core local RAG service orchestrating project vector stores, incremental updates, and search."""

    def __init__(
        self,
        embedding_provider: Optional[EmbeddingProvider] = None,
        indexes_base_dir: Optional[str] = None,
    ):
        cfg = get_config()
        self.embedding_provider = embedding_provider or LocalEmbeddingProvider()
        
        # Base directory for indexes: project root / indexes
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.base_dir = indexes_base_dir or os.path.join(root_dir, cfg.vector_indexes_path)
        os.makedirs(self.base_dir, exist_ok=True)

        # In-memory cache: project_id -> (VectorStore, MetadataStore, HybridRetriever)
        self._stores: Dict[str, Tuple[VectorStore, MetadataStore, HybridRetriever]] = {}
        # Project status cache
        self._project_statuses: Dict[str, Dict] = {}

        # Performance telemetry
        self._last_retrieval_latency_ms: Optional[float] = None
        self._retrieval_latencies: List[float] = []
        self._last_embedding_time_ms: Optional[float] = None

    def _get_project_dir(self, project_id: str) -> str:
        # Sanitize project_id for directory path
        safe_id = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in project_id)
        pdir = os.path.join(self.base_dir, safe_id)
        os.makedirs(pdir, exist_ok=True)
        return pdir

    def _get_or_load_store(
        self, project_id: str
    ) -> Tuple[VectorStore, MetadataStore, HybridRetriever]:
        """Retrieve in-memory or load persisted vector and metadata store for a project."""
        if project_id in self._stores:
            return self._stores[project_id]

        pdir = self._get_project_dir(project_id)
        index_file = os.path.join(pdir, "faiss.index")
        metadata_file = os.path.join(pdir, "metadata.json")

        vstore = FAISSVectorStore(self.embedding_provider.dimension)
        mstore = MetadataStore(project_id)

        if os.path.exists(index_file) and os.path.exists(metadata_file):
            try:
                vstore.load(index_file)
                mstore.load(metadata_file)
                print(f"[RAGService] Loaded existing vector index for {project_id}: {vstore.size()} vectors")
            except Exception as e:
                print(f"[RAGService] Failed to load existing index at {pdir}, reinitializing: {e}")
                vstore.clear()
                mstore.clear()

        retriever = HybridRetriever(self.embedding_provider, vstore, mstore)
        self._stores[project_id] = (vstore, mstore, retriever)
        return self._stores[project_id]

    def _save_store(self, project_id: str) -> None:
        """Persist vector index and metadata store to disk."""
        if project_id not in self._stores:
            return
        vstore, mstore, _ = self._stores[project_id]
        pdir = self._get_project_dir(project_id)

        index_file = os.path.join(pdir, "faiss.index")
        metadata_file = os.path.join(pdir, "metadata.json")
        manifest_file = os.path.join(pdir, "manifest.json")

        vstore.save(index_file)
        mstore.save(metadata_file)

        # Write manifest
        manifest = {
            "projectId": project_id,
            "totalVectors": vstore.size(),
            "totalChunks": vstore.size(),
            "totalFiles": mstore.total_files,
            "embeddingModel": self.embedding_provider.model_name,
            "embeddingDimension": self.embedding_provider.dimension,
            "embeddingDevice": self.embedding_provider.device,
            "lastIndexedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "indexed",
        }
        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

    def index_project(
        self, project_id: str, project_path: str, chunks: List[CodeChunk]
    ) -> Dict:
        """Perform full vector indexing for a project's code chunks."""
        t0 = time.time()
        print(f"[RAGService] Indexing project {project_id} ({len(chunks)} chunks)...")

        pdir = self._get_project_dir(project_id)
        vstore = FAISSVectorStore(self.embedding_provider.dimension)
        mstore = MetadataStore(project_id)

        if not chunks:
            self._stores[project_id] = (vstore, mstore, HybridRetriever(self.embedding_provider, vstore, mstore))
            self._save_store(project_id)
            return {
                "success": True,
                "chunks_indexed": 0,
                "vectors_count": 0,
                "indexing_time_ms": round((time.time() - t0) * 1000, 2),
                "status": "indexed",
            }

        # 1. Allocate metadata and extract text to embed
        allocated_ids, chunks_to_embed, _ = mstore.allocate_metadata(chunks)

        # 2. Extract content texts
        # Enrich content with contextual prefix (symbol, parent, path) for higher semantic quality
        embedding_texts: List[str] = []
        for c in chunks_to_embed:
            header = f"// File: {c.relativePath or os.path.basename(c.filePath)}\n"
            if c.symbolName:
                header += f"// {c.symbolKind or 'symbol'}: {c.symbolName}\n"
            if c.parentSymbol:
                header += f"// parent: {c.parentSymbol}\n"
            embedding_texts.append(header + c.content)

        # 3. Batch generate local embeddings
        t_embed_start = time.time()
        vectors = self.embedding_provider.embed_batch(embedding_texts)
        embed_time = round((time.time() - t_embed_start) * 1000, 2)

        # 4. Add to vector store
        vstore.add(vectors, allocated_ids)

        retriever = HybridRetriever(self.embedding_provider, vstore, mstore)
        self._stores[project_id] = (vstore, mstore, retriever)

        # 5. Persist to disk
        self._save_store(project_id)

        total_time = round((time.time() - t0) * 1000, 2)
        self._last_embedding_time_ms = embed_time
        print(
            f"[RAGService] Successfully indexed {project_id}: {vstore.size()} vectors in {total_time}ms (embedding: {embed_time}ms)"
        )

        return {
            "success": True,
            "chunks_indexed": len(chunks),
            "vectors_count": vstore.size(),
            "indexing_time_ms": total_time,
            "embedding_time_ms": embed_time,
            "status": "indexed",
        }

    def update_file_chunks(
        self, project_id: str, file_path: str, file_id: str, chunks: List[CodeChunk]
    ) -> Dict:
        """Incrementally update vector index when a source file is modified or added."""
        t0 = time.time()
        vstore, mstore, _ = self._get_or_load_store(project_id)

        # Delete existing vectors for this file
        deleted_ids = mstore.delete_by_file_path(file_path)
        if deleted_ids:
            vstore.delete(deleted_ids)
            print(f"[RAGService] Incremental: removed {len(deleted_ids)} old vectors for {file_path}")

        # Add new chunks if any
        if chunks:
            allocated_ids, chunks_to_embed, _ = mstore.allocate_metadata(chunks)
            embedding_texts = []
            for c in chunks_to_embed:
                header = f"// File: {c.relativePath or os.path.basename(c.filePath)}\n"
                if c.symbolName:
                    header += f"// {c.symbolKind or 'symbol'}: {c.symbolName}\n"
                embedding_texts.append(header + c.content)

            vectors = self.embedding_provider.embed_batch(embedding_texts)
            vstore.add(vectors, allocated_ids)

        self._save_store(project_id)
        elapsed = round((time.time() - t0) * 1000, 2)
        print(
            f"[RAGService] Incremental update complete for {file_path}: added {len(chunks)} chunks ({elapsed}ms)"
        )

        return {
            "success": True,
            "deleted_vectors": len(deleted_ids),
            "added_vectors": len(chunks),
            "total_vectors": vstore.size(),
            "latency_ms": elapsed,
        }

    def delete_file(self, project_id: str, file_path: str) -> Dict:
        """Remove all vectors associated with a deleted source file."""
        vstore, mstore, _ = self._get_or_load_store(project_id)
        deleted_ids = mstore.delete_by_file_path(file_path)
        if deleted_ids:
            vstore.delete(deleted_ids)
            self._save_store(project_id)
            print(f"[RAGService] Deleted {len(deleted_ids)} vectors for file: {file_path}")

        return {
            "success": True,
            "deleted_vectors": len(deleted_ids),
            "total_vectors": vstore.size(),
        }

    def search(
        self,
        project_id: str,
        query: str,
        mode: str = "hybrid",
        limit: int = 10,
        filter_kinds: Optional[List[str]] = None,
        filter_languages: Optional[List[str]] = None,
    ) -> Tuple[List[RetrievalResult], float]:
        """Execute search query across requested retrieval streams. Returns (results, latency_ms)."""
        t0 = time.time()
        _, _, retriever = self._get_or_load_store(project_id)

        results = retriever.retrieve(
            query=query,
            mode=mode,
            limit=limit,
            filter_kinds=filter_kinds,
            filter_languages=filter_languages,
        )

        latency = round((time.time() - t0) * 1000, 2)
        self._last_retrieval_latency_ms = latency
        self._retrieval_latencies.append(latency)
        if len(self._retrieval_latencies) > 50:
            self._retrieval_latencies.pop(0)
        return results, latency

    def build_context(
        self,
        project_id: str,
        query: str,
        mode: str = "hybrid",
        max_chunks: Optional[int] = None,
        max_characters: Optional[int] = None,
    ) -> AIContextPackage:
        """Search and compile AI-Ready Context package."""
        t0 = time.time()
        results, _ = self.search(project_id, query, mode=mode, limit=12)

        builder = ContextBuilder(
            max_chunks=max_chunks,
            max_characters=max_characters,
        )
        return builder.build_context(
            project_id=project_id,
            query=query,
            retrieved_results=results,
            mode=mode,
            start_time_epoch=t0,
        )

    def get_status(self, project_id: Optional[str] = None) -> RAGStatusResponse:
        """Retrieve vector index status and storage metrics for a project."""
        if not project_id:
            return RAGStatusResponse(
                status="not_indexed",
                embeddingModel=self.embedding_provider.model_name,
                embeddingDimension=self.embedding_provider.dimension,
                embeddingDevice=self.embedding_provider.device,
            )

        pdir = self._get_project_dir(project_id)
        manifest_file = os.path.join(pdir, "manifest.json")
        index_file = os.path.join(pdir, "faiss.index")

        # In-memory store available
        if project_id in self._stores:
            vstore, mstore, _ = self._stores[project_id]
            size_bytes = 0
            if os.path.exists(index_file):
                size_bytes += os.path.getsize(index_file)
            metadata_file = os.path.join(pdir, "metadata.json")
            if os.path.exists(metadata_file):
                size_bytes += os.path.getsize(metadata_file)

            return RAGStatusResponse(
                status="indexed" if vstore.size() > 0 else "not_indexed",
                projectId=project_id,
                totalChunks=vstore.size(),
                totalVectors=vstore.size(),
                totalFiles=mstore.total_files,
                embeddingModel=self.embedding_provider.model_name,
                embeddingDimension=self.embedding_provider.dimension,
                embeddingDevice=self.embedding_provider.device,
                lastIndexedAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                indexSizeBytes=size_bytes,
            )

        # Check persisted manifest
        if os.path.exists(manifest_file):
            try:
                with open(manifest_file, "r", encoding="utf-8") as f:
                    manifest = json.load(f)

                size_bytes = 0
                if os.path.exists(index_file):
                    size_bytes += os.path.getsize(index_file)
                metadata_file = os.path.join(pdir, "metadata.json")
                if os.path.exists(metadata_file):
                    size_bytes += os.path.getsize(metadata_file)

                return RAGStatusResponse(
                    status=manifest.get("status", "indexed"),
                    projectId=project_id,
                    totalChunks=manifest.get("totalChunks", 0),
                    totalVectors=manifest.get("totalVectors", 0),
                    totalFiles=manifest.get("totalFiles", 0),
                    embeddingModel=manifest.get("embeddingModel", self.embedding_provider.model_name),
                    embeddingDimension=manifest.get("embeddingDimension", self.embedding_provider.dimension),
                    embeddingDevice=manifest.get("embeddingDevice", self.embedding_provider.device),
                    lastIndexedAt=manifest.get("lastIndexedAt"),
                    indexSizeBytes=size_bytes,
                )
            except Exception as e:
                print(f"[RAGService] Error reading manifest: {e}")

        return RAGStatusResponse(
            status="not_indexed",
            projectId=project_id,
            embeddingModel=self.embedding_provider.model_name,
            embeddingDimension=self.embedding_provider.dimension,
            embeddingDevice=self.embedding_provider.device,
        )

    def clear_project_index(self, project_id: str) -> bool:
        """Remove persisted vector index and clear memory store for a project."""
        self._stores.pop(project_id, None)
        pdir = self._get_project_dir(project_id)
        if os.path.exists(pdir):
            try:
                shutil.rmtree(pdir)
                print(f"[RAGService] Cleared index directory for project {project_id}")
                return True
            except Exception as e:
                print(f"[RAGService] Failed to clear index directory: {e}")
                return False
        return True

    def get_performance_report(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Return RAG performance metrics, latency benchmarks, and cache efficiency."""
        status = self.get_status(project_id)
        cache_stats = {}
        if hasattr(self.embedding_provider, "get_cache_stats"):
            cache_stats = self.embedding_provider.get_cache_stats()

        avg_latency = None
        if self._retrieval_latencies:
            avg_latency = round(sum(self._retrieval_latencies) / len(self._retrieval_latencies), 2)

        return {
            "indexedFiles": status.totalFiles,
            "totalChunks": status.totalChunks,
            "totalVectors": status.totalVectors,
            "embeddingDimension": self.embedding_provider.dimension,
            "embeddingDevice": self.embedding_provider.device,
            "lastRetrievalLatencyMs": self._last_retrieval_latency_ms,
            "avgRetrievalLatencyMs": avg_latency,
            "lastEmbeddingTimeMs": self._last_embedding_time_ms,
            "cacheHits": cache_stats.get("cacheHits", 0),
            "cacheMisses": cache_stats.get("cacheMisses", 0),
            "cacheSize": cache_stats.get("cacheSize", 0),
        }


# Global Singleton instance
rag_service = RAGService()


def get_rag_service() -> RAGService:
    return rag_service
