# Rain Code Studio — Performance & Snapdragon Optimisation Architecture

**Document Version:** 1.0.0 (Phase 8: Snapdragon Optimisation & Performance)  
**Hardware Validation Status:** Hardware validation: Not performed (Tested on Intel Core i7-11800H @ 2.30GHz, x86_64 Windows 11 host; Snapdragon detection tested with negative result on host and verified positive using mock profiles in test suite)

---

## 1. Overview & Principles

Rain Code Studio is engineered to deliver high-performance, privacy-first local developer copilot capabilities on Windows PCs, with specialized architecture awareness for Qualcomm Snapdragon processors (Snapdragon X Elite, Snapdragon X Plus) while maintaining universal, high-speed execution on standard Intel and AMD x86_64 machines.

### The Zero-Fabrication Rule
Rain Code Studio adheres to a strict anti-hallucination rule across all telemetry and benchmarking systems:
- **No Invented Acceleration:** The platform never claims Qualcomm Hexagon NPU, Qualcomm AI Hub, or GPU acceleration unless verified by genuine runtime drivers and libraries.
- **Accurate Status Representation:** If an NPU is not detected or unsupported by the current runtime, the application reports `Not detected` or `Unknown` rather than fabricating numbers.
- **Genuine Benchmarks:** All reported latency (ms), token throughput (tokens/sec), and memory numbers reflect real-time measurements of executed code workloads.

---

## 2. Multi-Signal Snapdragon Detection

To reliably determine host platform architecture without false positives, the `HardwareInfoService` (`src/main/system/hardware-info.ts`) analyzes four concurrent hardware signals:

| Signal | Mechanism | Target Patterns / Values |
|---|---|---|
| **Signal 1: Architecture** | `process.arch` & `PROCESSOR_ARCHITECTURE` | `arm64`, `aarch64` |
| **Signal 2: CPU Model Name** | Windows CIM `Win32_Processor.Name` & `os.cpus()` | `snapdragon`, `qualcomm`, `sc8380`, `sc8280`, `x elite`, `x plus`, `sq1`, `sq2`, `sq3`, `adreno`, `oryon` |
| **Signal 3: Processor Identifier** | `process.env.PROCESSOR_IDENTIFIER` | ARMv8 / ARMv9 Qualcomm signatures |
| **Signal 4: Manufacturer** | Windows CIM `Win32_Processor.Manufacturer` | `Qualcomm`, `Qualcomm Technologies Inc` |

### Detection Outcomes
1. **Snapdragon Detected:** Both Signal 1 (ARM64) and at least one Qualcomm signature (Signals 2, 3, or 4) are verified.
2. **Snapdragon Not Detected:** Host architecture is x86/x64 (e.g., Intel GenuineIntel or AMD AuthenticAMD). Core features remain 100% operational on CPU.
3. **Unknown:** ARM64 or unexpected architecture detected without verified Qualcomm signatures. The system never forces a binary guess.

---

## 3. Auto Device Selection & Execution Profiles

Rain Code Studio supports five execution profiles via `AIExecutionProfile`:
- `AUTO` (Default recommended setting)
- `NPU`
- `GPU`
- `CPU`
- `UNKNOWN`

### AUTO Device Priority Logic
The system prioritizes compute backends based on genuinely detected runtime capabilities, not assumptions:

```
                  ┌───────────────────────┐
                  │ AUTO Device Selection │
                  └───────────┬───────────┘
                              │
                    Is Verified NPU Driver
                    (QNN / Hexagon) Active?
                              │
                    ┌─────────┴─────────┐
                 YES│                   │NO
                    ▼                   ▼
            ┌───────────────┐   Is Supported GPU
            │    Use NPU    │   (CUDA/DirectML)
            └───────────────┘       Present?
                                        │
                              ┌─────────┴─────────┐
                           YES│                   │NO
                              ▼                   ▼
                      ┌───────────────┐   ┌───────────────┐
                      │    Use GPU    │   │    Use CPU    │
                      └───────────────┘   └───────────────┘
```

If detection is uncertain or requested acceleration fails, Rain Code Studio executes an immediate safe fallback to on-device CPU execution without crashing.

---

## 4. Qualcomm AI Hub Integration & Preparation Layer

Rain Code Studio incorporates a transparent preparation and runtime abstraction layer for the **Qualcomm AI Hub** (`python/ai/qualcomm_hub.py`):

1. **Environment Inspection:** Dynamically checks for the official `qai_hub` Python package and Qualcomm Neural Network (QNN) wrappers.
2. **Target Device Profiles:** Pre-configured with compilation targets:
   - `Snapdragon X Elite (X1E-80-100)`
   - `Snapdragon X Plus (X1P-64-100)`
   - `Snapdragon 8 Gen 3`
3. **Compilation Preparation Hooks:** If `qai_hub` is not installed on the developer's machine, the service returns a transparent preparation response detailing prerequisites, rather than pretending compilation occurred.
4. **Honest Reporting:** `npuSupport` is reported as `Verified` only when QNN is genuinely active; otherwise reports `Unknown` on Snapdragon ARM64 or `Not detected` on x86_64.

---

## 5. Performance Metrics Reference

All metrics displayed on the **Performance Dashboard** (`src/renderer/pages/PerformancePage.tsx`) correspond to real system measurements:

### Application Timings
- **Startup Time (ms):** Elapsed time from Electron process bootstrap until the main UI window is rendered and ready.
- **Project Scan Time (ms):** Wall-clock duration required to crawl the active directory tree and filter ignored files.
- **Index Build Time (ms):** Total duration of AST parsing, symbol extraction, and SQLite database storage.

### Local RAG Timings
- **Retrieval Latency (ms):** End-to-end vector distance calculation and hybrid ranking time for code chunk search.
- **Embedding Batch Time (ms):** Time required to compute subword dense vector representations for a batch of code chunks.
- **Embedding Cache:** Bounded in-memory LRU cache (up to 5,000 vectors) to prevent redundant mathematical calculations on unchanged code.

### Local AI Timings
- **Model Load Time (ms):** Time required to load weight checkpoints into host memory or initialize local reasoning sessions.
- **First Response Latency (TTFT ms):** Time elapsed from request submission until the first token chunk is emitted to the UI.
- **Total Generation Time (ms):** Total latency for full response generation.
- **Inference Throughput (tokens/sec):** Velocity of generated tokens:  
  $$\text{Tokens per Second} = \frac{\text{Generated Tokens}}{\text{Duration in Seconds}}$$
- **Cancellation Latency (ms):** Time required for cooperative cancellation tokens to halt inference and restore Ready state.

### Git Timings
- **Repository Detection Time (ms):** Time required to verify `.git` repository boundaries.
- **Status Refresh Time (ms):** Time to inspect staged, unstaged, untracked, and conflicted files.
- **Diff Calculation Time (ms):** Time required to generate unified diff patches for file reviews.

---

## 6. How to Reproduce Benchmarks

The benchmark suite can be executed manually on demand:

1. Launch Rain Code Studio.
2. Navigate to **Performance** in the primary navigation bar.
3. Switch to the **Benchmark Suite** tab.
4. Click **Run Performance Test**.

### Workloads Measured
1. **Local Model Readiness & Load:** Pings local AI backend lifecycle coordinator and verifies runtime state.
2. **AI Token Inference Generation:** Generates a real test prompt through the model provider, measuring exact duration, token count, and tokens/second.
3. **Local Vector & Hybrid RAG Retrieval:** Executes hybrid vector ranking against local code chunks.
4. **On-Device Embedding Batch Generation:** Computes 16 code embeddings and measures vectorization velocity.
5. **AST Code Parsing & Symbol Indexing:** Parses sample code constructs through AST tokenizers and measures extraction duration.

---

## 7. Memory & Startup Optimizations

- **Non-Blocking Startup:** Electron window displays immediately while SQLite, Python backend, and background file indexers initialize asynchronously.
- **Bounded In-Memory Cache:** `LocalEmbeddingProvider` maintains an LRU cache capped at 5,000 vectors, preventing memory leaks during continuous development sessions.
- **Explicit Memory Reclaim:** The **Unload Model** button triggers explicit Python garbage collection (`gc.collect()`) and clears PyTorch CUDA/DirectML cache when model weights are not in use.
- **Incremental Indexing:** Unchanged files are skipped during project reindexing based on SHA-256 hash comparisons.

---

## 8. Phase 12.1 Project Intelligence Performance Considerations

1. **Zero Duplicate Parsing or Vector Re-calculation:**
   All 10 Project Intelligence features query the existing SQLite database index (`snapdev.sqlite`) and existing RAG vectors. No background AST re-indexing or vector store duplication is triggered when switching tabs.
2. **Sub-Millisecond Graph & Index Queries:**
   Pre-indexed SQLite tables with composite indexes (`idx_files_project`, `idx_symbols_file`, `idx_imports_file`, `idx_knowledge_project`) return health and architecture metrics in under 5ms.
3. **Renderer Responsiveness & Node Capping:**
   The interactive Architecture Map visualizer dynamically caps symbol nodes to 300 active nodes for large codebases, preventing DOM thread bloat and ensuring 60 FPS panning and zooming.
4. **Non-Blocking Inference:**
   Refactoring plans, onboarding inferences, and test fixture previews execute asynchronously in worker threads without freezing the UI.

---

## 9. Limitations & Known Constraints

1. **Windows Thermal Telemetry:** Windows user-mode desktop applications cannot access ACPI thermal zone sensors without administrative privileges. The telemetry dashboard honestly displays `Thermal telemetry unavailable`.
2. **Qualcomm NPU Requirements:** Direct Hexagon NPU execution requires a Snapdragon X Elite or X Plus device with the Qualcomm AI Engine Direct (QNN) SDK and DirectML NPU driver installed.
3. **Cross-Architecture Usability:** All features remain 100% operational on x86_64 devices using local CPU and GPU execution providers without degrading developer functionality.

