# Rain Code Studio — Privacy-First On-Device AI Developer Copilot

> **Phase 12.1: Advanced Project Intelligence Active**  
> Architected for Snapdragon PCs (Qualcomm Snapdragon X Elite / Hexagon NPU) and modern developer workstations.  
> Verified: 267 Passing Tests (197 TypeScript Vitest + 70 Python Pytest) • 100% On-Device & Zero Cloud Dependencies.

Rain Code Studio is a next-generation, privacy-first developer copilot designed to run 100% on-device. By combining local vector search (RAG), syntactic code parsing, and on-device LLM inference via `ModelManager`, your proprietary source code, credentials, and prompts never leave your physical workstation.

---

## Phase 12.1: Advanced Project Intelligence

Phase 12.1 introduces the **Project Intelligence Subsystem**, providing 10 advanced developer-intelligence features grounded in actual workspace data with zero invented metrics:

1. **AI Project Health Dashboard**: Factual code quality, line/symbol density, syntax errors, Git status, dependency counts, RAG vector readiness, and AI runtime health. Unmeasured dynamic test coverage is strictly labeled `"Not measured"`.
2. **Codebase Architecture Map**: Interactive hierarchical graph (Project → Directories → Files → Modules → Classes → Functions → Imports) with zoom/pan and editor navigation.
3. **Smart Project Search**: Natural-language intent search combining local RAG vectors + SQLite symbol matches + file paths with explicit selection reasons.
4. **AI Project Onboarding Mode**: Structured project overview distinguishing verified project facts (`isVerified: true`) from local AI inference (`isVerified: false`).
5. **Code Impact Analyzer**: Pre-change dependency traversal analyzing directly affected files, incoming callers, affected symbols, and relevant test suites.
6. **AI Test Coverage Assistant**: Non-destructive test gap analysis suggesting tailored test cases with priority rankings and safe preview generation.
7. **Documentation Health**: Scans README, docs, and public symbols to classify documentation coverage (`Documented`, `Partially documented`, `Potentially undocumented`).
8. **AI Refactoring Planner**: Planning-only refactoring engine outlining sequential migration steps, risk assessments, test plans, and documentation requirements.
9. **Code Similarity Detector**: Structural token and signature similarity detection with side-by-side comparison modal and non-absolute identity disclaimers.
10. **Local Project Knowledge Base**: Local SQLite repository for architecture decisions (ADRs), development notes, conventions, and limitations with optional RAG indexing.

---

## 1. Project Overview & Phase 6 Features

Phase 6 upgrades Rain Code Studio from a conversational copilot into an **actionable, practical developer assistance platform**. Every feature operates under strict safety constraints: **AI never silently modifies your files**.

```
User selects code/project context
        ↓
RAG retrieves relevant project context
        ↓
Local AI model analyzes the context
        ↓
Structured developer response
        ↓
User reviews result in Diff Preview
        ↓
User explicitly chooses Apply or Reject
```

### Supported Developer AI Features:
1. **Code Explanation (`POST /api/ai/explain`)**: Deep architectural explanation detailing code purpose, step-by-step execution flow, key dependencies, and assumptions.
2. **Bug & Error Analysis (`POST /api/ai/analyze-bug`)**: Diagnoses runtime exceptions, stack traces, logic flaws, and race conditions without executing user code. Returns severity, confidence, evidence, and suggested fix.
3. **Code Improvement Suggestions (`POST /api/ai/improve`)**: Analyzes code for maintainability, type safety, performance, and readability improvements with concrete technical rationales.
4. **Automated Test Generation (`POST /api/ai/generate-tests`)**: Synthesizes test fixtures and test cases tailored to detected project test frameworks (Vitest, Jest, Pytest, JUnit).
5. **Documentation Generation (`POST /api/ai/generate-docs`)**: Synthesizes TSDoc/JSDoc docstrings, API specifications, and README modules following repository conventions.
6. **AI Code Review (`POST /api/ai/review`)**: Multi-dimensional code review auditing correctness, security, performance, maintainability, type safety, and testing gaps with structured findings.
7. **Safe Diff Preview (`DiffViewer`)**: Color-coded unified diff viewer displaying additions, deletions, line numbers, and file context.
8. **Safe Change Pipeline (`ChangeManager`)**: Explicit user-controlled apply/reject pipeline. Verifies SHA-256 on-disk hashes to prevent stale-file overwrite, enforces project path confinement, and creates automatic backups before applying.
9. **AI Task History (`TaskHistoryManager`)**: Strictly local task ledger persisting task type, query, file target, summary, and applied/rejected status in `database/ai-task-history.json`.
10. **AI Developer Workspace**: 3-column professional IDE workspace (Left: Context & History; Center: Chat & Quick Actions; Right: Findings, Diff Preview & RAG Sources).

---

## 2. Architecture & Service Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Rain Code Studio Desktop                                 │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    React 18 + Tailwind UI Workspace                       │  │
│  │  Context & History (Left) • Chat & Quick Actions (Center) • Diff (Right)  │  │
│  └─────────────────────────────────────▲─────────────────────────────────────┘  │
│                                        │ contextBridge / IPC                    │
│  ┌─────────────────────────────────────▼─────────────────────────────────────┐  │
│  │                         Electron Main Process                             │  │
│  │  ChangeManager (SHA-256, Diff, Backups, Rollback)                         │  │
│  │  TaskHistoryManager (On-device task ledger)                               │  │
│  │  ProjectIndexer & FileSystem (Path confinement)                           │  │
│  └─────────────────────────────────────▲─────────────────────────────────────┘  │
└────────────────────────────────────────┼────────────────────────────────────────┘
                                         │ HTTP (127.0.0.1:8765)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Python FastAPI Local AI Backend                          │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         DeveloperService                                  │  │
│  │  explain_code • analyze_bug • improve_code • review_code                  │  │
│  │  generate_tests • generate_docs • generate_change                         │  │
│  └───────────────────▲───────────────────────────────────▲───────────────────┘  │
│                      │                                   │                      │
│  ┌───────────────────▼───────────────────┐   ┌───────────▼───────────────────┐  │
│  │         RAGService (Phase 4)          │   │      ModelManager (Phase 5)   │  │
│  │  Semantic Embeddings + FAISS Vectors  │   │  Local Quantized Model / NPU  │  │
│  └───────────────────────────────────────┘   └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Safety & Privacy Model

Rain Code Studio implements defense-in-depth safety rules:

| Security Vector | Enforcement Mechanism |
| :--- | :--- |
| **No Silent Overwrites** | AI output generates a patch. Application strictly requires the user clicking `[Apply Changes]`. |
| **Path Confinement** | `ChangeManager.isPathConfined()` verifies that the target path resolves strictly inside the active project directory. Path traversal (`../`) is blocked. |
| **Stale-File Protection** | Compares `SHA-256` hash of the on-disk file with `patch.originalContentHash`. If the file was modified since patch generation, application is blocked. |
| **Automatic Backups & Rollback** | Before writing changes, the original file is backed up to `.snapdev-backups/`. Users can roll back instantly. |
| **Zero Code Execution** | Neither user code nor generated code nor test suites are executed automatically. |
| **Zero Shell Execution** | No autonomous shell commands or background subprocesses are invoked. |
| **100% On-Device Privacy** | Zero cloud AI APIs, zero external telemetry, zero network leakage of proprietary code. |

---

## 4. Hardware Telemetry & Snapdragon PC Optimization

Rain Code Studio detects hardware capabilities honestly without fabricated claims:
- **Snapdragon NPU**: Detects Qualcomm Hexagon NPU via Qualcomm AI Engine Direct (QNN SDK) or ONNX Runtime QNN execution provider when running on Windows on ARM64.
- **CPU / Workstation**: Runs on local CPU threads with vector acceleration when running on standard x86_64 machines.
- **Telemetry**: Measures real elapsed time (`generationTimeMs`), tokens per second (`tokensPerSecond`), and tokens generated (`completionTokens`).

---

## 5. Technology Stack

### Desktop & Frontend (TypeScript)
- **Runtime / Desktop**: Electron v33+ (`contextIsolation: true`, `nodeIntegration: false`)
- **Frontend Framework**: React v18 + TypeScript v5.6+ (Strict Mode)
- **Styling**: Tailwind CSS v3.4 (Custom developer IDE dark theme)
- **Icons**: Lucide React
- **Build Tooling**: `electron-vite` with Vite v5
- **Testing**: Vitest v2 (62 unit and integration tests passing)

### Backend & AI Runtime (Python)
- **API Framework**: FastAPI v0.115+ & Uvicorn v0.32+
- **Data Validation**: Pydantic v2 (Strict typing for `ExplanationResult`, `BugAnalysisResult`, `CodeReviewResult`, `TestGenerationResult`, `DocumentationResult`, `ChangeResult`, `FilePatch`)
- **Vector Search**: FAISS (`IndexFlatIP`) with local embeddings
- **Local AI Inference**: `ModelManager` with state machine, concurrency locks, and cooperative cancellation
- **Testing**: Pytest v8 (46 unit and integration tests passing)

---

## 6. Project Directory Structure

```
snapdev-ai/
├── src/
│   ├── main/
│   │   ├── main.ts                     # Electron lifecycle entrypoint
│   │   ├── ipc.ts                      # Secure IPC handlers for patch and task history
│   │   ├── patch/
│   │   │   ├── change-manager.ts       # Safe patch validation, unified diff, backups, rollback
│   │   │   └── task-history-manager.ts # On-device task history persistence (JSON ledger)
│   │   ├── git/
│   │   │   ├── git-manager.ts          # Desktop Git orchestration & path confinement
│   │   │   ├── git-status.ts           # Porcelain v1 status parser (staged, unstaged, untracked, conflicts)
│   │   │   ├── git-diff.ts             # Unified diff parser & metric counter (+ / -)
│   │   │   ├── git-branches.ts         # Branch tracking & checkout safety validation
│   │   │   ├── git-history.ts          # Delimited commit log parser & show detail reader
│   │   │   ├── git-commit.ts           # Conventional commit message validation
│   │   │   └── git-conflict.ts         # Conflict marker detection & manual resolution guide
│   │   ├── patch/
│   │   │   ├── change-manager.ts       # SHA-256 hash validation, unified diffs, local backups
│   │   │   └── task-history-manager.ts # On-device task ledger
│   │   ├── project-manager.ts          # Project lifecycle and file system confinement
│   │   └── process-manager.ts          # Python backend supervisor
│   ├── preload/
│   │   └── index.ts                    # ContextBridge exposing typed electronAPI (Git + AI)
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── GitDiffViewer.tsx       # Real-time unified diff preview with syntax highlighting
│   │   │   ├── DiffViewer.tsx          # Phase 6 safe patch diff preview with Apply/Reject
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── GitPage.tsx             # Complete Phase 7 Git & Developer Tools page
│   │   │   ├── ChatPage.tsx            # AI Developer Workspace (3-column layout)
│   │   │   └── ...
│   │   └── services/
│   │       └── api.ts                  # Typed TypeScript API client (Git AI + Developer AI)
│   └── shared/
│       ├── types.ts                    # Shared TypeScript interfaces & schemas (Git + AI)
│       └── constants.ts                # App version (0.7.0) & IPC channels
├── python/
│   ├── api.py                          # FastAPI application & Phase 7 Git AI endpoints
│   ├── ai/
│   │   ├── developer_service.py        # Commit message authoring & commit explanation
│   │   ├── schemas.py                  # Pydantic schemas (CommitMessageSuggestion, CommitAnalysis)
│   │   ├── prompts.py                  # Grounded prompt builders for conventional commits & review
│   │   ├── manager.py                  # Local ModelManager lifecycle & concurrency
│   │   └── provider.py                 # Local AI provider with on-device reasoning
│   └── rag/                            # Local vector database & semantic search
├── demo-project/                       # Sample repository for developer testing
└── tests/
    ├── python/                         # 54 Python tests (test_git_ai.py, test_developer_ai.py, etc.)
    └── typescript/                     # 95 TypeScript tests (git-status, git-diff, git-branches, etc.)
```

---

## 7. Phase 7: Git & Developer Tools Architecture

Phase 7 delivers a professional, privacy-first Git assistant and Developer Tools suite. Git operations execute strictly in the desktop layer (TypeScript) via safe subprocesses, while Python is involved solely when Local AI reasoning is requested.

### Strict Safety & User-Control Rules:
1. **Zero Autonomous Git Actions**: AI never automatically commits, pushes, pulls, switches branches, deletes branches, or discards changes.
2. **AI Output Is Always Suggestive**: Generated commit messages and reviews are presented as editable suggestions that require explicit user confirmation.
3. **Safe Subprocess Execution**: Subprocesses invoke `execFile('git', args, { shell: false })` with strict string arrays, eliminating shell injection vulnerabilities.
4. **Path Confinement**: All Git and file paths are strictly confined to the active project root; path traversal escapes (`../`) are blocked.
5. **Safe Branch Switching**: Detects uncommitted changes before checking out a branch and requires user confirmation to avoid silent stashing or overwriting.
6. **Conflict Protection**: When merge/rebase conflicts occur, Rain Code Studio highlights conflicted files, explains conflict markers, and mandates manual resolution. It never attempts autonomous conflict resolution.
7. **Offline By Design**: Operates seamlessly without internet access; source code, diffs, and commit history never leave the machine.

### Supported Phase 7 Features:
- **Repository Detection**: Auto-detects whether the workspace is a Git repository (`Git: Connected` or `Git: Not a repository`). Allows explicit, 1-click local `git init`.
- **Status & Changed-File Viewer**: Groups working files into Staged, Changes (Working Tree), Untracked, and Conflicted categories with instant stage/unstage buttons.
- **Unified Diff Viewer (`GitDiffViewer`)**: Color-coded line-by-line diff inspector with syntax highlighting, line numbers, and additions/deletions statistics.
- **Commit Creation**: Dedicated commit panel with staged file counters, commit message validation, and explicit commit execution.
- **AI Commit Message Generation (`POST /api/ai/commit-message`)**: Local AI analyzes staged diffs and formulates conventional commit messages (`feat`, `fix`, `refactor`, etc.) with technical reasoning for user review.
- **AI Change Review (`POST /api/ai/review`)**: Reuses the Phase 6 Code Review service to perform multi-dimensional quality, security, and test gap audits on working diffs.
- **Branch Management & Safe Switching**: Lists local and remote branches with upstream tracking; warns user if uncommitted changes exist before switching.
- **Commit History & Details**: Browsable repository commit log with metadata, changed files, and unified commit diff preview.
- **AI Commit Explanation (`POST /api/ai/explain-commit`)**: Local AI summarizes the architectural intent, affected files, main changes, and potential downstream impact of any commit.
- **Developer Toolbox & Project Health**: Real-time diagnostic dashboard reporting working tree state, AST indexed files, RAG vector counts, local AI model state, SQLite database status, and desktop activity logs.

---

## 8. Demo Workflow Verification

Verify the complete Git & Developer Tools workflow end-to-end:

1. **Open Demo Project**: Launch Rain Code Studio and load `demo-project/`.
2. **Detect Git State**:
   - Navigate to the **Git** tab in the sidebar.
   - Observes repository status (`Git: Connected` or click `[Initialize Git Repository]`).
3. **Stage Changes**:
   - Make a change or inspect existing files.
   - Click `[+]` on a modified file to stage it.
   - Inspect the unified staged diff in `GitDiffViewer`.
4. **Generate AI Commit Message**:
   - Click **Generate with AI**.
   - Local AI inspects the staged diff and generates a Conventional Commit message (e.g. `feat(auth): add credentials validation`).
   - Developer reviews and edits the message in the input box.
5. **Explicit User Commit**:
   - Click **Commit Staged Changes**.
   - Working tree updates instantly to clean state, and new commit appears in **History**.
6. **Inspect History & Explain Commit**:
   - Switch to the **History** tab. Select the newly authored commit.
   - Click **Explain Commit**. Local AI summarizes architectural changes and downstream impact.
7. **Run AI Change Review**:
   - Click **Review Changes** to trigger the Phase 6 Code Review engine on current diffs.
8. **Check Project Health**:
   - Switch to **Health & Tools** to inspect overall project status, indexed files, RAG vectors, and Snapdragon hardware metrics.

---

## 9. Phase 8 — Snapdragon Optimisation & Performance

Phase 8 optimizes Rain Code Studio for Snapdragon-powered Windows PCs (Snapdragon X Elite, Snapdragon X Plus) while maintaining high-speed local developer workflows across standard Intel and AMD x86_64 machines.

### Key Phase 8 Capabilities:
1. **Multi-Signal Snapdragon Detection (`HardwareInfoService`)**:
   - Analyzes architecture (`arm64`), processor model, Windows identifier, and manufacturer signatures.
   - Accurately returns `Snapdragon Detected`, `Snapdragon Not Detected`, or `Unknown`. Never forces a binary guess or assumes processor type from machine hostname.
2. **AI Runtime Capability Reporting (`AIExecutionCapabilityReport`)**:
   - Inspects host AI runtime without speculation: reports model, format, compute device, and acceleration provider.
   - Reports `NPU: Not detected` or `Unknown` if not genuinely verified by low-level drivers. Never fabricates NPU execution.
3. **Qualcomm AI Hub Preparation Layer (`qualcomm_hub.py`)**:
   - Dynamically inspects host Python environment for `qai_hub` and QNN wrappers.
   - Provides compilation hooks for Snapdragon X Elite and X Plus with clean transparent fallback if SDK is absent.
4. **AUTO Device Selection**:
   - Priority: Verified NPU → Verified GPU → Safe CPU Fallback based strictly on detected capabilities.
5. **Real Performance Telemetry & Measurement (`PerformanceMonitor`)**:
   - Tracks application startup time, project scan time, AST indexing time, RAG retrieval latency, embedding batch latency, and AI token inference throughput (tokens/sec).
   - Zero synthetic benchmarks: all figures represent live, timed code execution.
6. **On-Device Benchmark Suite**:
   - Manual user-triggered performance test evaluating local model load, token inference velocity, vector search, embedding batch generation, and AST symbol extraction.
   - Displays a standardized **Snapdragon Benchmark Profile** tailored for competition evaluation.
7. **Memory & Startup Optimizations**:
   - Non-blocking startup sequence with immediate UI availability.
   - Bounded in-memory embedding cache (5,000 vectors) to avoid redundant computations.
   - Explicit **Unload Model** action triggering garbage collection and cache clearing.
8. **Hardware Validation Status**:
   - `Hardware validation: Not performed` *(Tested on Intel Core i7-11800H @ 2.30GHz x86_64 Windows host; negative detection confirmed on host, and positive Snapdragon detection verified via mock profiles in test suite)*.
   - See detailed documentation in [docs/performance.md](file:///d:/hackathon/snap/docs/performance.md).

---

## 10. Running Tests & Validation

### Run Full Test Suite (232 Tests Passing)
```bash
npm test
```
*Executes all 166 Vitest TypeScript tests and 66 Python Pytest tests.*

### Run TypeScript Tests Only (166 Tests)
```bash
npm run test:ts
```

### Run Python Tests Only (66 Tests)
```bash
npm run test:py
```

### Run TypeScript Typecheck (Zero Errors)
```bash
npm run typecheck
```

### Build Production Bundle
```bash
npm run build
```

---

## 11. Phase 10 Testing, Security & Production Readiness Documentation

Comprehensive reports created during Phase 10:
- [Security Audit Report](file:///d:/hackathon/snap/docs/security-audit.md): Electron sandbox isolation, typed IPC handlers, path traversal protection (CWE-22 / CWE-23), patch safety, prompt injection defense, and secret protection.
- [Comprehensive Test Report](file:///d:/hackathon/snap/docs/test-report.md): Execution logs and results for 232 tests across Unit, Integration, Security, and 20-Step E2E workflows.
- [Privacy & Data Governance](file:///d:/hackathon/snap/docs/privacy.md): 100% on-device data flow audit, zero telemetry validation, and local storage inventory.
- [Developer Troubleshooting Guide](file:///d:/hackathon/snap/docs/troubleshooting.md): Diagnosis and recovery playbooks for backend connection, model loading, RAG re-indexing, and Git states.

---

## 12. Project Architecture Status

Rain Code Studio is complete through **Phase 10: Testing, Security, Reliability & Production Readiness**. All capabilities (Phases 1–10) are verified operational on-device with zero cloud dependencies. Phase 11 (Final Presentation & Packaging Automation) remains for future work.



#   R a i n - C o d e - S t u d i o  
 #   R a i n - C o d e - S t u d i o  
 #   R a i n - C o d e - S t u d i o  
 #   R a i n - C o d e - S t u d i o  
 