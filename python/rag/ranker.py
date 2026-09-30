"""SnapDev AI - Deterministic Result Ranking Layer.

Phase 4: Local RAG Foundation.
Combines semantic vector similarity, symbol exact/partial match, file path signals,
and structural symbol weights into a deterministic, documented relevance score.
"""

from typing import Dict, List, Optional
from .models import RetrievalResult, VectorMetadata


class ResultRanker:
    """Ranks and deduplicates candidate retrieval results using deterministic weighting."""

    # Configurable deterministic scoring weights for hybrid retrieval
    WEIGHT_SEMANTIC = 0.55
    WEIGHT_SYMBOL = 0.30
    WEIGHT_PATH = 0.15

    # Structural kind modifiers: prioritizes actionable executable blocks
    KIND_MODIFIERS: Dict[str, float] = {
        "function": 0.05,
        "method": 0.05,
        "class": 0.04,
        "struct": 0.04,
        "interface": 0.03,
        "type": 0.02,
        "variable": 0.01,
    }

    @classmethod
    def rank_hybrid(
        cls,
        semantic_candidates: List[tuple[VectorMetadata, float]],
        symbol_candidates: List[tuple[VectorMetadata, float, str]],
        file_candidates: List[tuple[VectorMetadata, float, str]],
        limit: int = 10,
        filter_kinds: Optional[List[str]] = None,
        filter_languages: Optional[List[str]] = None,
    ) -> List[RetrievalResult]:
        """Merge, score, and rank candidates from multiple retrieval streams.
        
        Formula:
            FinalScore = min(1.0, w_sem * S_sem + w_sym * S_sym + w_path * S_path + KindBonus)
        """
        # Map by chunkId to merge signals
        merged: Dict[str, Dict] = {}

        # 1. Process Semantic candidates
        for meta, sim_score in semantic_candidates:
            cid = meta.chunkId
            # Normalize cosine score from [-1, 1] to [0, 1]
            norm_score = max(0.0, min(1.0, (sim_score + 1.0) / 2.0))
            if cid not in merged:
                merged[cid] = {
                    "meta": meta,
                    "sem_score": norm_score,
                    "sym_score": 0.0,
                    "path_score": 0.0,
                    "sources": [f"Semantic similarity ({round(norm_score, 2)})"],
                }
            else:
                merged[cid]["sem_score"] = max(merged[cid]["sem_score"], norm_score)
                merged[cid]["sources"].append(f"Semantic similarity ({round(norm_score, 2)})")

        # 2. Process Symbol candidates
        for meta, sym_score, reason in symbol_candidates:
            cid = meta.chunkId
            if cid not in merged:
                merged[cid] = {
                    "meta": meta,
                    "sem_score": 0.0,
                    "sym_score": sym_score,
                    "path_score": 0.0,
                    "sources": [reason],
                }
            else:
                merged[cid]["sym_score"] = max(merged[cid]["sym_score"], sym_score)
                if reason not in merged[cid]["sources"]:
                    merged[cid]["sources"].append(reason)

        # 3. Process File candidates
        for meta, path_score, reason in file_candidates:
            cid = meta.chunkId
            if cid not in merged:
                merged[cid] = {
                    "meta": meta,
                    "sem_score": 0.0,
                    "sym_score": 0.0,
                    "path_score": path_score,
                    "sources": [reason],
                }
            else:
                merged[cid]["path_score"] = max(merged[cid]["path_score"], path_score)
                if reason not in merged[cid]["sources"]:
                    merged[cid]["sources"].append(reason)

        # 4. Calculate Final Composite Score
        ranked_results: List[RetrievalResult] = []

        for cid, data in merged.items():
            meta: VectorMetadata = data["meta"]

            # Filter by symbol kind if requested
            if filter_kinds and meta.symbolKind and meta.symbolKind.lower() not in [k.lower() for k in filter_kinds]:
                continue

            # Filter by language if requested
            if filter_languages and meta.language.lower() not in [l.lower() for l in filter_languages]:
                continue

            sem = data["sem_score"]
            sym = data["sym_score"]
            path = data["path_score"]

            kind_bonus = cls.KIND_MODIFIERS.get((meta.symbolKind or "").lower(), 0.0)

            # Deterministic weighted combination
            composite = (
                cls.WEIGHT_SEMANTIC * sem
                + cls.WEIGHT_SYMBOL * sym
                + cls.WEIGHT_PATH * path
                + kind_bonus
            )
            final_score = round(min(1.0, max(0.0, composite)), 4)

            ranked_results.append(
                RetrievalResult(
                    resultId=f"res_{cid}",
                    chunkId=cid,
                    filePath=meta.filePath,
                    relativePath=meta.relativePath,
                    symbolName=meta.symbolName,
                    symbolKind=meta.symbolKind,
                    language=meta.language,
                    startLine=meta.startLine,
                    endLine=meta.endLine,
                    content=meta.content,
                    similarityScore=final_score,
                    retrievalSources=data["sources"],
                    parentSymbol=meta.parentSymbol,
                )
            )

        # Sort descending by final similarityScore
        ranked_results.sort(key=lambda r: r.similarityScore, reverse=True)
        return ranked_results[:limit]
