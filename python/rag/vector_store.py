"""SnapDev AI - Vector Store Abstraction & FAISS Implementation.

Phase 4: Local Vector Database.
Abstracts vector indexing and similarity search from direct FAISS dependencies.
Provides add, update, delete, search, save, load, and clear operations.
"""

from abc import ABC, abstractmethod
import os
from typing import List, Tuple
import faiss
import numpy as np


class VectorStore(ABC):
    """Abstract base class for local vector database implementations."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector embedding dimensionality."""
        pass

    @abstractmethod
    def size(self) -> int:
        """Current number of vectors in index."""
        pass

    @abstractmethod
    def add(self, vectors: np.ndarray, ids: List[int]) -> None:
        """Add dense vectors with explicit integer identifiers."""
        pass

    @abstractmethod
    def update(self, vector: np.ndarray, vector_id: int) -> None:
        """Update or replace vector with given ID."""
        pass

    @abstractmethod
    def delete(self, ids: List[int]) -> int:
        """Remove vectors by ID list. Returns count removed."""
        pass

    @abstractmethod
    def search(self, query_vector: np.ndarray, top_k: int = 10) -> Tuple[List[int], List[float]]:
        """Search nearest vectors using cosine similarity. Returns (ids, scores)."""
        pass

    @abstractmethod
    def save(self, path: str) -> None:
        """Persist vector index to disk."""
        pass

    @abstractmethod
    def load(self, path: str) -> None:
        """Load vector index from disk."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Remove all vectors from the index."""
        pass


class FAISSVectorStore(VectorStore):
    """Concrete VectorStore implementation backed by FAISS IndexIDMap2 and IndexFlatIP.
    
    Uses Inner Product (IP) on L2-normalized vectors to provide exact Cosine Similarity.
    Supports granular vector deletion and ID mapping for incremental indexing.
    """

    def __init__(self, dimension: int = 384):
        self._dimension = dimension
        self._init_index()

    def _init_index(self) -> None:
        """Create fresh FAISS index with ID mapping."""
        sub_index = faiss.IndexFlatIP(self._dimension)
        self.index = faiss.IndexIDMap2(sub_index)

    @property
    def dimension(self) -> int:
        return self._dimension

    def size(self) -> int:
        return int(self.index.ntotal)

    def add(self, vectors: np.ndarray, ids: List[int]) -> None:
        if len(ids) == 0:
            return
        if len(vectors) != len(ids):
            raise ValueError(f"Vectors count ({len(vectors)}) != IDs count ({len(ids)})")

        vecs = np.ascontiguousarray(vectors, dtype=np.float32)
        if vecs.ndim == 1:
            vecs = vecs.reshape(1, -1)

        # Ensure L2 normalized
        faiss.normalize_L2(vecs)
        id_array = np.array(ids, dtype=np.int64)
        self.index.add_with_ids(vecs, id_array)

    def update(self, vector: np.ndarray, vector_id: int) -> None:
        self.delete([vector_id])
        vec = np.ascontiguousarray(vector, dtype=np.float32)
        if vec.ndim == 1:
            vec = vec.reshape(1, -1)
        self.add(vec, [vector_id])

    def delete(self, ids: List[int]) -> int:
        if not ids or self.size() == 0:
            return 0
        id_array = np.array(ids, dtype=np.int64)
        count_before = self.size()
        removed = self.index.remove_ids(id_array)
        return int(removed) if removed >= 0 else max(0, count_before - self.size())

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> Tuple[List[int], List[float]]:
        if self.size() == 0 or top_k <= 0:
            return [], []

        k = min(top_k, self.size())
        q = np.ascontiguousarray(query_vector, dtype=np.float32)
        if q.ndim == 1:
            q = q.reshape(1, -1)

        faiss.normalize_L2(q)
        scores_arr, ids_arr = self.index.search(q, k)

        result_ids: List[int] = []
        result_scores: List[float] = []

        for vec_id, score in zip(ids_arr[0], scores_arr[0]):
            if vec_id != -1:  # FAISS uses -1 for unfilled slots
                result_ids.append(int(vec_id))
                # Clamp score to [-1.0, 1.0] for cosine similarity
                result_scores.append(round(max(-1.0, min(1.0, float(score))), 4))

        return result_ids, result_scores

    def save(self, path: str) -> None:
        parent_dir = os.path.dirname(path)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
        faiss.write_index(self.index, path)

    def load(self, path: str) -> None:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Vector index not found at: {path}")
        try:
            self.index = faiss.read_index(path)
            self._dimension = self.index.d
        except Exception as e:
            raise RuntimeError(f"Corrupted or invalid vector index at {path}: {e}")

    def clear(self) -> None:
        self._init_index()
