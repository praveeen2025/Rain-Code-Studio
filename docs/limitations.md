# Rain Code Studio - Known Limitations & Boundaries

## 1. Phase 12.1 Intelligence Limitations

1. **Dynamic Execution Coverage**:
   - **Limitation**: Line-by-line runtime execution coverage is not measured statically.
   - **Handling**: Explicitly marked as `"Not measured"`. Heuristic test file presence is measured instead.

2. **Code Impact Analysis Boundary**:
   - **Limitation**: Impact detection relies on static import statements and symbol declarations.
   - **Handling**: Dynamic string imports (e.g. `import(variable)`), dependency injection reflection, or runtime RPC dispatch cannot be mathematically guaranteed. The analyzer clearly notes: *"Potentially affected files and detected dependencies are identified through static import graph mapping. Dynamic dispatch cannot be guaranteed."*

3. **Code Similarity Heuristics**:
   - **Limitation**: Similarity detection uses signature matching, line-ratio heuristics, and identifier token overlap.
   - **Handling**: Does not claim semantic equivalence. Labeled: *"Potentially duplicated or highly similar logic. Semantic identity is not guaranteed."*

4. **Architecture Map Node Capping**:
   - **Limitation**: Workspaces with thousands of symbols could degrade rendering performance.
   - **Handling**: The interactive visual explorer caps displayed symbol nodes to 300 to maintain smooth 60 FPS scrolling and panning.

5. **Local Hardware Constraints**:
   - **Limitation**: On-device AI inference throughput depends on the local CPU/NPU specifications.
   - **Handling**: Quantized models (Q4_K_M) and efficient 384-dimensional embeddings ensure responsive execution even on modest workstations.
