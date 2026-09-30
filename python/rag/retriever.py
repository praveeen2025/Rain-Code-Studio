"""SnapDev AI - Hybrid Retrieval Pipeline.

Phase 4: Local RAG Foundation.
Coordinates Semantic Vector Search, Symbol Search, File Path matching, and Metadata filtering.
Returns deterministic, ranked code retrieval results without using an LLM.
"""

from typing import List, Optional
from .embedding import EmbeddingProvider
from .metadata_store import MetadataStore
from .models import RetrievalResult
from .ranker import ResultRanker
from .vector_store import VectorStore


class HybridRetriever:
    """Orchestrates multi-channel retrieval across vector store and structural metadata."""

    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store: VectorStore,
        metadata_store: MetadataStore,
    ):
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.metadata_store = metadata_store

    def retrieve(
        self,
        query: str,
        mode: str = "hybrid",
        limit: int = 10,
        filter_kinds: Optional[List[str]] = None,
        filter_languages: Optional[List[str]] = None,
    ) -> List[RetrievalResult]:
        """Execute retrieval pipeline according to selected mode."""
        clean_query = query.strip()
        if not clean_query:
            return []

        semantic_candidates = []
        symbol_candidates = []
        file_candidates = []

        candidate_limit = max(limit * 3, 20)

        # 1. Semantic Search
        if mode in ("hybrid", "semantic") and self.vector_store.size() > 0:
            query_vector = self.embedding_provider.embed_query(clean_query)
            vec_ids, scores = self.vector_store.search(query_vector, top_k=candidate_limit)

            for vid, score in zip(vec_ids, scores):
                meta = self.metadata_store.get_by_vector_id(vid)
                if meta:
                    semantic_candidates.append((meta, score))

        # 2. Structural Symbol Search
        if mode in ("hybrid", "symbol"):
            symbol_candidates = self.metadata_store.search_symbols(
                clean_query, limit=candidate_limit
            )

        # 3. File Path Search
        if mode in ("hybrid", "file"):
            file_candidates = self.metadata_store.search_files(
                clean_query, limit=candidate_limit
            )

        # 4. Rank candidates
        if mode == "semantic":
            # Semantic only
            return ResultRanker.rank_hybrid(
                semantic_candidates=semantic_candidates,
                symbol_candidates=[],
                file_candidates=[],
                limit=limit,
                filter_kinds=filter_kinds,
                filter_languages=filter_languages,
            )
        elif mode == "symbol":
            # Symbol only
            return ResultRanker.rank_hybrid(
                semantic_candidates=[],
                symbol_candidates=symbol_candidates,
                file_candidates=[],
                limit=limit,
                filter_kinds=filter_kinds,
                filter_languages=filter_languages,
            )
        elif mode == "file":
            # File only
            return ResultRanker.rank_hybrid(
                semantic_candidates=[],
                symbol_candidates=[],
                file_candidates=file_candidates,
                limit=limit,
                filter_kinds=filter_kinds,
                filter_languages=filter_languages,
            )
        else:
            # Default: Hybrid Search
            return ResultRanker.rank_hybrid(
                semantic_candidates=semantic_candidates,
                symbol_candidates=symbol_candidates,
                file_candidates=file_candidates,
                limit=limit,
                filter_kinds=filter_kinds,
                filter_languages=filter_languages,
            )
