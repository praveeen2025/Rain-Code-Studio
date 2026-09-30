"""SnapDev AI - Metadata Store for Vector Index Tracing.

Phase 4: Local RAG Foundation.
Maintains bi-directional mappings between FAISS vector IDs and rich code chunk metadata.
Enables instant source tracing, incremental updates, symbol search, and file filtering.
"""

import json
import os
import re
from typing import Dict, List, Optional, Set, Tuple
from .models import CodeChunk, VectorMetadata


class MetadataStore:
    """Manages metadata associated with each vector in a project index."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self._next_vector_id: int = 1
        # vectorId -> VectorMetadata
        self._vectors: Dict[int, VectorMetadata] = {}
        # chunkId -> vectorId
        self._chunk_to_vector: Dict[str, int] = {}
        # filePath -> Set of vectorIds
        self._file_to_vectors: Dict[str, Set[int]] = {}
        # filePath -> fileHash for caching
        self._file_hashes: Dict[str, str] = {}

    @property
    def total_vectors(self) -> int:
        return len(self._vectors)

    @property
    def total_files(self) -> int:
        return len(self._file_to_vectors)

    def is_file_unchanged(self, file_path: str, file_hash: Optional[str]) -> bool:
        """Check if file hash matches existing indexed hash for embedding cache."""
        if not file_hash or file_path not in self._file_hashes:
            return False
        return self._file_hashes[file_path] == file_hash

    def allocate_metadata(
        self, chunks: List[CodeChunk]
    ) -> Tuple[List[int], List[CodeChunk], List[VectorMetadata]]:
        """Allocate vector IDs and prepare metadata records for incoming chunks."""
        allocated_ids: List[int] = []
        chunks_to_embed: List[CodeChunk] = []
        metadata_list: List[VectorMetadata] = []

        for chunk in chunks:
            # Check if chunk already has an assigned vector
            if chunk.id in self._chunk_to_vector:
                vid = self._chunk_to_vector[chunk.id]
            else:
                vid = self._next_vector_id
                self._next_vector_id += 1

            meta = VectorMetadata(
                vectorId=vid,
                chunkId=chunk.id,
                projectId=chunk.projectId,
                fileId=chunk.fileId,
                symbolId=chunk.symbolId,
                filePath=chunk.filePath,
                relativePath=chunk.relativePath or os.path.basename(chunk.filePath),
                symbolName=chunk.symbolName,
                symbolKind=chunk.symbolKind,
                language=chunk.language,
                startLine=chunk.startLine,
                endLine=chunk.endLine,
                content=chunk.content,
                parentSymbol=chunk.parentSymbol,
                imports=chunk.imports,
                fileHash=chunk.fileHash,
            )

            # Store mapping
            self._vectors[vid] = meta
            self._chunk_to_vector[chunk.id] = vid
            if chunk.filePath not in self._file_to_vectors:
                self._file_to_vectors[chunk.filePath] = set()
            self._file_to_vectors[chunk.filePath].add(vid)

            if chunk.fileHash:
                self._file_hashes[chunk.filePath] = chunk.fileHash

            allocated_ids.append(vid)
            chunks_to_embed.append(chunk)
            metadata_list.append(meta)

        return allocated_ids, chunks_to_embed, metadata_list

    def get_by_vector_id(self, vector_id: int) -> Optional[VectorMetadata]:
        return self._vectors.get(vector_id)

    def get_all(self) -> List[VectorMetadata]:
        return list(self._vectors.values())

    def delete_by_file_path(self, file_path: str) -> List[int]:
        """Remove all vector metadata for a specific file path. Returns deleted vector IDs."""
        vids = self._file_to_vectors.pop(file_path, set())
        deleted_ids: List[int] = []

        for vid in vids:
            if vid in self._vectors:
                meta = self._vectors.pop(vid)
                self._chunk_to_vector.pop(meta.chunkId, None)
                deleted_ids.append(vid)

        self._file_hashes.pop(file_path, None)
        return deleted_ids

    def search_symbols(
        self, query: str, limit: int = 20
    ) -> List[Tuple[VectorMetadata, float, str]]:
        """Exact, prefix, and substring symbol matching."""
        if not query or not query.strip():
            return []

        q = query.strip().lower()
        # Extract individual identifier tokens from query
        q_tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9_]+", q)]
        results: List[Tuple[VectorMetadata, float, str]] = []

        for meta in self._vectors.values():
            if not meta.symbolName:
                continue

            name = meta.symbolName.lower()
            score = 0.0
            reasons = []

            # 1. Exact symbol match
            if name == q or any(t == name for t in q_tokens):
                score = 1.0
                reasons.append("Exact symbol match")
            # 2. Symbol prefix match
            elif name.startswith(q) or any(name.startswith(t) for t in q_tokens if len(t) >= 3):
                score = 0.85
                reasons.append("Symbol prefix match")
            # 3. Substring match
            elif q in name or any(t in name for t in q_tokens if len(t) >= 3):
                score = 0.70
                reasons.append("Symbol substring match")

            if score > 0:
                results.append((meta, score, ", ".join(reasons)))

        # Sort descending by score
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]

    def search_files(
        self, query: str, limit: int = 20
    ) -> List[Tuple[VectorMetadata, float, str]]:
        """Path and filename matching."""
        if not query or not query.strip():
            return []

        q = query.strip().lower()
        q_tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9_]+", q)]
        results: List[Tuple[VectorMetadata, float, str]] = []

        for meta in self._vectors.values():
            path_str = meta.filePath.lower().replace("\\", "/")
            base_name = os.path.basename(path_str)
            score = 0.0
            reasons = []

            # Exact file name match
            if any(t == base_name or t in base_name for t in q_tokens if len(t) >= 3):
                score = 0.75
                reasons.append("Filename match")
            elif any(t in path_str for t in q_tokens if len(t) >= 4):
                score = 0.50
                reasons.append("Path match")

            if score > 0:
                results.append((meta, score, ", ".join(reasons)))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]

    def save(self, path: str) -> None:
        """Persist metadata to JSON file."""
        parent_dir = os.path.dirname(path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)

        data = {
            "projectId": self.project_id,
            "nextVectorId": self._next_vector_id,
            "vectors": {str(k): v.model_dump() for k, v in self._vectors.items()},
            "fileHashes": self._file_hashes,
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self, path: str) -> None:
        """Load metadata from JSON file."""
        if not os.path.exists(path):
            raise FileNotFoundError(f"Metadata file not found: {path}")

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.project_id = data.get("projectId", self.project_id)
            self._next_vector_id = data.get("nextVectorId", 1)
            self._vectors.clear()
            self._chunk_to_vector.clear()
            self._file_to_vectors.clear()
            self._file_hashes = data.get("fileHashes", {})

            for k_str, v_dict in data.get("vectors", {}).items():
                vid = int(k_str)
                meta = VectorMetadata(**v_dict)
                self._vectors[vid] = meta
                self._chunk_to_vector[meta.chunkId] = vid
                if meta.filePath not in self._file_to_vectors:
                    self._file_to_vectors[meta.filePath] = set()
                self._file_to_vectors[meta.filePath].add(vid)
        except Exception as e:
            raise RuntimeError(f"Corrupted or invalid metadata at {path}: {e}")

    def clear(self) -> None:
        self._next_vector_id = 1
        self._vectors.clear()
        self._chunk_to_vector.clear()
        self._file_to_vectors.clear()
        self._file_hashes.clear()
