# Rain Code Studio - On-Device AI & RAG Pipeline

## 1. Overview & Core Tenet

Rain Code Studio's AI pipeline operates **100% on-device**. No source code, queries, tokens, or embeddings are ever transmitted across external networks. Workstations running Qualcomm Snapdragon X Elite processors benefit from Hexagon NPU hardware acceleration, while standard developer PCs execute via optimized CPU threads.

---

## 2. RAG (Retrieval-Augmented Generation) Pipeline

```
Project Source Files
        ↓
AST Chunker (symbols & functional blocks)
        ↓
Embedding Provider (local-code-mini-384, 384-dimensional vectors)
        ↓
Local Vector Store (In-Memory / SQLite indexed)
        ↓
[Query Received] → Hybrid Retrieval (Vector Cosine Similarity + BM25/Symbol Exact Match)
        ↓
Context Builder (Token budget optimization, source reference grounding)
        ↓
Grounded Prompt Assembly
        ↓
Local LLM Inference (ModelManager)
        ↓
Structured Developer Output (Diff Preview / Findings / Explanation)
```

---

## 3. Phase 12.1 Intelligence Integration

Phase 12.1 reuses the existing RAG and AI pipeline for:
1. **Smart Project Search**: Natural language query queries local vector embeddings and returns ranked matches with explicit explanation of selection reasons.
2. **AI Project Onboarding**: Synthesizes structured architectural summaries, strictly distinguishing verified code facts (`isVerified: true`) from AI inference (`isVerified: false`).
3. **Refactoring Planner**: Uses local file context to generate step-by-step risk-mitigated refactoring plans without auto-modifying files.
4. **Test Assistant Preview**: Generates non-destructive unit test fixtures previewed for user review.
5. **Project Knowledge in RAG**: When `includeInRag` is toggled for a knowledge note, its contents become retrievable across standard copilot chat and smart search queries.
