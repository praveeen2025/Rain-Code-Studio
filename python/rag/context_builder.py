"""SnapDev AI - Context Builder for AI-Ready Retrieval Bundles.

Phase 4: Local RAG Foundation.
Deduplicates retrieved chunks, enforces configurable chunk/character/token boundaries,
and constructs structured AI-Ready context packages for future Phase 5 local LLM copilot inference.
Zero LLM calls.
"""

import time
from typing import List, Optional
try:
    from config import get_config
except ImportError:
    from python.config import get_config

from .models import AIContextPackage, RetrievalResult


class ContextBuilder:
    """Builds bounded, AI-ready context bundles from ranked retrieval results."""

    def __init__(
        self,
        max_chunks: Optional[int] = None,
        max_characters: Optional[int] = None,
        max_tokens: Optional[int] = None,
    ):
        cfg = get_config()
        self.max_chunks = max_chunks or cfg.max_context_chunks
        self.max_characters = max_characters or cfg.max_context_characters
        self.max_tokens = max_tokens or cfg.max_context_tokens

    def _is_duplicate_or_subsumed(
        self, candidate: RetrievalResult, selected: List[RetrievalResult]
    ) -> bool:
        """Check if candidate chunk overlaps with or is subsumed by an already selected chunk."""
        for s in selected:
            if s.filePath == candidate.filePath:
                # Check line overlap
                start_overlap = max(s.startLine, candidate.startLine)
                end_overlap = min(s.endLine, candidate.endLine)
                if start_overlap <= end_overlap:
                    overlap_len = end_overlap - start_overlap + 1
                    cand_len = candidate.endLine - candidate.startLine + 1
                    # If candidate is >70% overlapping with already selected chunk, skip
                    if overlap_len / max(cand_len, 1) > 0.70:
                        return True
        return False

    def build_context(
        self,
        project_id: str,
        query: str,
        retrieved_results: List[RetrievalResult],
        mode: str = "hybrid",
        start_time_epoch: Optional[float] = None,
    ) -> AIContextPackage:
        """Filter, bound, and format retrieved results into an AI-ready context package."""
        selected_chunks: List[RetrievalResult] = []
        current_chars = 0

        # Sort by relevance
        sorted_results = sorted(retrieved_results, key=lambda r: r.similarityScore, reverse=True)

        for res in sorted_results:
            if len(selected_chunks) >= self.max_chunks:
                break

            # Deduplication
            if self._is_duplicate_or_subsumed(res, selected_chunks):
                continue

            chunk_len = len(res.content)
            # Respect max character limit without breaking symbol integrity
            if current_chars + chunk_len > self.max_characters and len(selected_chunks) > 0:
                # If we already have chunks and this one exceeds limit, stop
                break

            selected_chunks.append(res)
            current_chars += chunk_len

        # Estimate tokens (~4 characters per token for code/text)
        estimated_tokens = int(current_chars / 3.8)

        # Build formatted prompt context
        header_lines = [
            "=" * 60,
            "RAIN CODE STUDIO - LOCAL CODE INTELLIGENCE CONTEXT",
            f"PROJECT: {project_id}",
            f"USER QUERY: {query}",
            f"RETRIEVAL MODE: {mode.upper()}",
            f"TOTAL RETRIEVED CHUNKS: {len(selected_chunks)}",
            "=" * 60,
            "",
        ]

        snippet_blocks = []
        for i, chunk in enumerate(selected_chunks, 1):
            symbol_desc = f"{chunk.symbolKind.upper() if chunk.symbolKind else 'CODE'}: {chunk.symbolName or 'Anonymous'}"
            if chunk.parentSymbol:
                symbol_desc += f" (in {chunk.parentSymbol})"

            reasons_str = "; ".join(chunk.retrievalSources)
            lang = (chunk.language or "").lower()

            block = [
                f"[SNIPPET {i}]",
                f"FILE: {chunk.relativePath}",
                f"SYMBOL: {symbol_desc}",
                f"LINES: {chunk.startLine}-{chunk.endLine}",
                f"RETRIEVAL SOURCES: {reasons_str} (Score: {chunk.similarityScore})",
                f"```{lang}",
                chunk.content.strip(),
                "```",
                "-" * 40,
                "",
            ]
            snippet_blocks.append("\n".join(block))

        formatted_context = "\n".join(header_lines) + "\n".join(snippet_blocks)

        generation_time = 0.0
        if start_time_epoch is not None:
            generation_time = round((time.time() - start_time_epoch) * 1000, 2)

        return AIContextPackage(
            projectId=project_id,
            query=query,
            retrievalMode=mode,
            totalChunks=len(selected_chunks),
            totalCharacters=current_chars,
            estimatedTokens=estimated_tokens,
            formattedPromptContext=formatted_context,
            chunks=selected_chunks,
            generationTimeMs=generation_time,
        )
