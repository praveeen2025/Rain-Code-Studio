# Rain Code Studio — Privacy-First On-Device AI Developer Copilot

<p align="center">
  <img src="src/renderer/assets/logo.png" alt="Rain Code Studio Logo" width="128" height="128" />
</p>

<p align="center">
  <b>The Privacy-First, On-Device AI Developer Copilot for Qualcomm Snapdragon PCs & Modern Workstations</b><br />
  <i>100% Local Execution • Zero Cloud APIs • Zero Telemetry • Real Hardware Metrics • Built with Electron, React, TypeScript & Python</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20ARM64%20%7C%20x64-blue?style=for-the-badge&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/Snapdragon-X%20Elite%20%7C%20X%20Plus-red?style=for-the-badge&logo=qualcomm" alt="Snapdragon" />
  <img src="https://img.shields.io/badge/Tests-267%20Passed%20(100%25)-success?style=for-the-badge&logo=vitest" alt="Tests" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20On--Device-emerald?style=for-the-badge&logo=shield" alt="Privacy" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License" />
</p>

---

## 🌟 Executive Summary

**Rain Code Studio** is an open-source, privacy-first desktop IDE and AI developer copilot engineered to operate **entirely on-device**. By tightly coupling low-latency AST code parsing, local vector retrieval-augmented generation (RAG), and on-device neural language models (via Ollama and native quantized runtimes), your proprietary source code, credentials, intellectual property, and prompts never leave your physical workstation.

Optimized for **Qualcomm Snapdragon X Elite / X Plus** coprocessor architecture (Hexagon NPU) and modern x86_64 desktop platforms, Rain Code Studio guarantees zero cloud dependency, zero external telemetry, and absolute developer autonomy.

---

## 🚀 Key Capabilities & Architectural Pillars

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Rain Code Studio Desktop                           │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    React 18 + Tailwind UI Workspace                       │  │
│  │  ActivityBar • Multi-Tab Editor • Chat & Model Selector • Diff • Git UI   │  │
│  └─────────────────────────────────────▲─────────────────────────────────────┘  │
│                                        │ contextBridge / Secure Typed IPC       │
│  ┌─────────────────────────────────────▼─────────────────────────────────────┐  │
│  │                         Electron Main Process (Node.js)                   │  │
│  │  ChangeManager (SHA-256 Safety, Diff, Rollback Backups)                   │  │
│  │  AST Indexer & SQLite FTS5 (TypeScript Compiler API, Python, Rust, Go)    │  │
│  │  GitManager (Porcelain v1, Diff, Branch, Conventional Commits)            │  │
│  │  LocalModelDiscoveryService (Ollama Scanner, GGUF/ONNX Validation)        │  │
│  │  ProjectIntelligenceService (Health, Architecture Map, Search, Blast)     │  │
│  └─────────────────────────────────────▲─────────────────────────────────────┘  │
└────────────────────────────────────────┼────────────────────────────────────────┘
                                         │ HTTP / SSE (127.0.0.1:8765)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Python FastAPI Local AI Backend                          │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                      AIChatService & DeveloperService                     │  │
│  │  Explain • Bug Analysis • Code Improvement • Review • Test & Doc Gen      │  │
│  └───────────────────▲───────────────────────────────────▲───────────────────┘  │
│                      │                                   │                      │
│  ┌───────────────────▼───────────────────┐   ┌───────────▼───────────────────┐  │
│  │         RAGService (Phase 4)          │   │      ModelManager (Phase 5)   │  │
│  │  Local Embedding Cache + Vector Index │   │  Ollama / ONNX / Transformers │  │
│  └───────────────────────────────────────┘   └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Complete Implementation Breakdown (Phases 1 — 12.2)

### 🔹 Phase 1 — Desktop Foundation & IPC Architecture
- **Hardened Electron 33+ Runtime**: `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, strict CSP, and all external web links routed safely to the system browser.
- **Python Backend Supervisor**: Automatic asynchronous spawn of local FastAPI backend (`127.0.0.1:8765`) with heartbeat monitoring, graceful SIGTERM/taskkill lifecycle management, and parent-process watchdog.

### 🔹 Phase 2 — Project Workspace & High-Performance Scanner
- **Fast Filesystem Scanner**: Asynchronous recursive project crawler with `.gitignore` adherence, binary file detection, and metadata extraction.
- **Incremental Project Watcher**: Debounced Chokidar file watcher triggering selective re-indexing based on SHA-256 hash changes.
- **Path Confinement**: Strict project directory boundary validation preventing directory traversal attacks (`../`).

### 🔹 Phase 3 — High-Precision Code Parsing & SQLite Indexing
- **TypeScript Compiler API**: Full concrete AST generation for `.ts`, `.tsx`, `.js`, and `.jsx` extracting functions, classes, methods, interfaces, types, imports, and exports.
- **Multi-Language Structural Parsers**: Structural grammar extractors for Python (`.py`), Go (`.go`), Rust (`.rs`), Java (`.java`), and C/C++ (`.c`, `.cpp`, `.h`).
- **SQLite Database with FTS5**: Fast local persistence in `database/snapdev.sqlite` indexing files, code symbols, parse errors, and dependencies.

### 🔹 Phase 4 — On-Device RAG (Retrieval-Augmented Generation)
- **AST-Aware Code Chunking**: Preserves symbol boundaries (classes, functions) with line-number metadata.
- **Local Embedding Provider**: Multi-scale subword and identifier token hashing with L2 cosine normalization; optional ONNX embedding model execution.
- **Bounded LRU Embedding Cache**: 5,000-vector in-memory cache eliminating redundant vector computations with hit/miss telemetry.
- **Hybrid Retrieval & RRF**: Combines dense vector similarity with lexical exact-match scoring using Reciprocal Rank Fusion.
- **Grounded Source Citations**: Every generated context snippet includes file path, line range, and symbol kind.

### 🔹 Phase 5 — Local AI Model Lifecycle & Ollama Integration
- **ModelManager Singleton**: Thread-safe lifecycle coordinator (`not_configured` → `loading` → `ready` → `generating` → `stopping` → `unloading`).
- **Ollama Neural Model Provider**: Full streaming & blocking inference via local Ollama daemon (`http://localhost:11434`) tested with `qwen2.5:1.5b`, `llama3.2:3b`, and `qwen3.5:9b`.
- **Token Streaming via SSE**: Server-Sent Events `/api/ai/chat/stream` delivering progressive tokens to the IDE chat.
- **Cooperative Request Cancellation**: Immediate token cutoff via thread cancellation events.

### 🔹 Phase 6 — Actionable Developer AI & Safe Patch Pipeline
- **6 Core Developer AI Workflows**:
  1. **Explain Code** (`POST /api/ai/explain`): Deep architectural breakdown, step-by-step logic, complexity analysis.
  2. **Bug Analysis** (`POST /api/ai/analyze-bug`): Root-cause diagnosis, reproduction steps, evidence citation, and fix generation.
  3. **Code Improvement** (`POST /api/ai/improve`): Type safety, performance, maintainability, and clean code refactoring.
  4. **Code Review** (`POST /api/ai/review`): Structured audit with severity scoring across security, performance, and testing gaps.
  5. **Automated Test Generation** (`POST /api/ai/generate-tests`): Produces framework-aligned unit tests (Vitest, Jest, Pytest).
  6. **Documentation Generation** (`POST /api/ai/generate-docs`): Produces JSDoc/TSDoc docstrings and README documentation.
- **Strict Safe Change Workflow**:
  $$\text{Generate} \longrightarrow \text{Validate} \longrightarrow \text{Unified Diff Preview} \longrightarrow \text{User Review} \longrightarrow \text{Apply / Reject}$$
  *AI never silently modifies your source code.*
- **Stale-File Protection**: Compares on-disk SHA-256 hash with patch baseline before modifying any file.
- **Automatic Local Backups**: Creates pre-change copies in `.snapdev-backups/` for instant one-click rollback.

### 🔹 Phase 7 — Git Management & AI Conventional Commits
- **Local Git Manager**: Safe `execFile` execution (zero shell interpolation), porcelain status parsing, and working tree tracking.
- **Interactive Diff Viewer**: Color-coded line additions/deletions with side-by-side or unified review.
- **AI Commit Message Generator** (`POST /api/ai/commit-message`): Analyzes staged diffs and formulates conventional commit messages (`feat`, `fix`, `refactor`).
- **Branch Management & Merge Conflict Protection**: Lists local/remote branches, safe checkout warnings, and conflict marker detection (`<<<<<<<`, `=======`).

### 🔹 Phase 8 — Hardware Detection & Snapdragon PC Optimization
- **Multi-Signal Hardware Detection**: Factual evaluation of CPU architecture (`arm64` vs `x86_64`), processor model string, Windows identifier, and manufacturer.
- **Zero Fabricated Metrics**: If running on Intel/AMD, reports `Snapdragon Not Detected` and falls back to CPU execution cleanly.
- **Real Performance Telemetry**: Measures actual startup time, scan time, RAG retrieval latency, and tokens/sec throughput.
- **Persistent Benchmark Suite**: Executes repeatable local benchmarks saved to `database/benchmark-history.json`.

### 🔹 Phase 9 — Professional VS Code-Inspired UI/UX
- **ActivityBar & Sidebar**: Fast switching between Explorer, AI Chat, Project Intelligence, Model Hub, Git, Search, and Settings.
- **Interactive TopMenuBar & Command Palette**: `Ctrl+P` file search and `Ctrl+Shift+P` command palette.
- **Instant Theme Engine**: Smooth dark mode & light mode toggle with CSS variable styling.
- **Interactive Status Bar**: Real-time Git branch, line/column tracking, encoding, hardware profile, and active model status.

### 🔹 Phase 10 — Security, Reliability & Quality Assurance
- **Path Traversal Defense**: Tested with `../../` path traversal injection attacks.
- **Prompt Injection Defense**: Passive data demarcation and system directives preventing comment-based jailbreaks.
- **Process Leaks Protection**: Automated cleanup hooks on window close and application exit.

### 🔹 Phase 11 — Demo & Competition Showcase
- **Complete `demo-project`**: Integrated TypeScript authentication microservice with an intentional authentication expiration bug for live AI Bug Analysis demonstration.
- **20-Step End-to-End Automated Workflow**: Full programmatic test suite simulating complete developer usage.

### 🔹 Phase 12.1 — Advanced Project Intelligence (10 Features)
1. **AI Project Health Dashboard**: Real index statistics, parse health, test candidate ratios.
2. **Codebase Architecture Map**: Interactive hierarchical module and dependency visualization.
3. **Smart Project Search**: Natural-language intent search combining symbols, files, and RAG reasoning.
4. **AI Project Onboarding**: High-level system overview, key entrypoints, and prerequisite tools.
5. **Code Impact Analyzer**: Forward and reverse dependency blast-radius evaluation.
6. **AI Test Coverage Assistant**: Automated identification of untested exported symbols.
7. **Documentation Health Dashboard**: Documentation coverage ratio across exported functions and classes.
8. **AI Refactoring Planner**: Phased refactoring steps for complex monolithic code blocks.
9. **Code Similarity Detector**: Structural token similarity and duplicate code finder.
10. **Local Project Knowledge Base**: Local SQLite repository for architecture decisions (ADRs) and notes.

### 🔹 Phase 12.2 — Local AI Model Hub
- **Local Model Discovery**: Auto-detects installed models from Ollama daemon (`http://localhost:11434`) and local storage directories (`.gguf`, `.onnx`, `.safetensors`).
- **Interactive Model Hub Page (`Ctrl+0`)**: Browse, filter, validate, activate, deactivate, or import local models.
- **Dynamic Model Switching**: Hot-swaps the active inference engine in the Python backend via `POST /api/ai/load-hub-model`.
- **Chat Header Model Selector**: Instant model dropdown selector inside the AI Chat workspace to choose any model on the fly.
- **Status Bar Integration**: Clickable active model badge in the bottom status bar for quick model management.

---

## 🔒 Strict Security & Privacy Model

| Security Vector | Implementation Mechanism | Verified Status |
| :--- | :--- | :--- |
| **No Silent Overwrites** | AI output produces a patch; user must explicitly click `[Apply Changes]`. | ✅ Verified |
| **Path Confinement** | Target paths must resolve strictly within the active project root; `../` escapes blocked. | ✅ Verified |
| **Stale-File Protection** | Compares `SHA-256` hash of on-disk file before applying patch. | ✅ Verified |
| **Automatic Backups** | Creates pre-change copies in `.snapdev-backups/` for instant rollback. | ✅ Verified |
| **Subprocess Safety** | `execFile('git', args, { shell: false })` eliminates shell injection. | ✅ Verified |
| **Zero External Network** | Zero cloud AI APIs, zero external telemetry; all traffic restricted to `127.0.0.1`. | ✅ Verified |
| **Prompt Injection Guard** | Context isolated as passive data; defensive system directives enforce code boundaries. | ✅ Verified |

---

## 🛠️ Technology Stack

```
Desktop & Frontend:
  ├── Electron 33.4+         (Sandboxed Desktop Shell)
  ├── React 18.3+            (Component Architecture)
  ├── TypeScript 5.6+        (Strict Type Safety)
  ├── Tailwind CSS 3.4+      (IDE Design System)
  ├── Lucide React           (VS Code-Grade Icons)
  └── electron-vite 2.3+     (High-Speed Build Pipeline)

Backend & Local AI:
  ├── Python 3.11+           (Local AI & Numerical Runtime)
  ├── FastAPI 0.115+         (High-Performance Local REST & SSE)
  ├── Uvicorn 0.32+          (ASGI Web Server on 127.0.0.1)
  ├── Pydantic v2            (Strict Schema Validation)
  ├── Ollama Integration     (Local LLM Inference & Streaming)
  ├── NumPy                  (Dense Vector Mathematics)
  └── SQLite 3 + FTS5        (Embedded Relational & Full-Text Search)
```

---

## 📂 Repository Directory Layout

```
Rain-Code-Studio/
├── src/
│   ├── main/
│   │   ├── main.ts                     # Electron lifecycle entrypoint
│   │   ├── ipc.ts                      # Secure IPC handlers (RAG, Git, AI, Model Hub)
│   │   ├── window.ts                   # Hardened BrowserWindow configuration
│   │   ├── process-manager.ts          # Python backend supervisor & health monitor
│   │   ├── project-manager.ts          # Workspace project state & path security
│   │   ├── ai/
│   │   │   ├── ai-backend-client.ts    # Main -> Python HTTP client
│   │   │   └── local-model-discovery.ts# Local model scanner & Ollama discovery
│   │   ├── database/                   # SQLite database manager & FTS5 schemas
│   │   ├── git/                        # GitManager, status, diff, branches, commits
│   │   ├── indexer/                    # Project scanner, AST chunker, file watcher
│   │   ├── intelligence/               # ProjectIntelligenceService (10 Phase 12.1 features)
│   │   ├── parser/                     # TypeScript, Python, Rust, Go, Java parsers
│   │   ├── patch/                      # ChangeManager (SHA-256, Diff, Backups)
│   │   └── system/                     # HardwareInfo & PerformanceMonitor
│   ├── preload/
│   │   └── index.ts                    # ContextBridge exposing window.electronAPI
│   ├── renderer/
│   │   ├── App.tsx                     # Top-level React routing
│   │   ├── components/                 # ActivityBar, Editor, ModelSelector, DiffViewer
│   │   ├── layouts/                    # MainLayout (VS Code professional IDE shell)
│   │   ├── pages/                      # Chat, Projects, Files, Git, ModelHub, Intelligence
│   │   ├── services/                   # Frontend API client
│   │   └── stores/                     # State stores (project, chat, theme, notification)
│   └── shared/
│       ├── constants.ts                # IPC channels and default ports
│       └── types.ts                    # Universal shared TypeScript definitions
├── python/
│   ├── api.py                          # FastAPI REST API & SSE endpoints
│   ├── main.py                         # Python entrypoint
│   ├── config.py                       # Backend configuration
│   ├── ai/
│   │   ├── chat_service.py             # RAG-augmented chat orchestrator
│   │   ├── developer_service.py        # 6 Developer AI task engines
│   │   ├── manager.py                  # ModelManager lifecycle coordinator
│   │   ├── prompt_builder.py           # Bounded prompt assembly & injection defense
│   │   └── provider.py                 # OllamaProvider & LocalAIProvider
│   └── rag/                            # Vector store, local embeddings, ranker
├── demo-project/                       # Test project with intentional demo flaw
├── docs/                               # Architecture, security, privacy, performance docs
└── tests/
    ├── python/                         # 70 Pytest unit & integration tests
    └── typescript/                     # 197 Vitest unit & integration tests
```

---

## ⚡ Getting Started & Quickstart

### Prerequisites
- **Node.js**: v20.x or higher
- **Python**: v3.10, v3.11, or v3.12
- **Git**: Installed and available in system PATH
- **Ollama** *(Optional, recommended for neural LLMs)*: [ollama.com](https://ollama.com)

### 1. Clone the Repository
```bash
git clone https://github.com/praveeen2025/Rain-Code-Studio.git
cd Rain-Code-Studio
```

### 2. Install Dependencies
```bash
# Install Node dependencies
npm install

# Install Python backend dependencies
pip install -r python/requirements.txt
# (or: pip install fastapi uvicorn pydantic numpy requests)
```

### 3. Launch Development Server
```bash
npm run dev
```
*Electron will launch the desktop IDE, automatically start the local Python backend on `127.0.0.1:8765`, and present the Rain Code Studio workspace.*

### 4. Build Production Desktop Application
```bash
npm run build
```

---

## 🧪 Comprehensive Test Suite Verification

Rain Code Studio maintains a **100% passing test suite** across all subsystems:

```bash
# Run the complete test suite (267 Tests)
npm test

# Run TypeScript Vitest suite only (197 Tests)
npm run test:ts

# Run Python Pytest suite only (70 Tests)
npm run test:py

# Run TypeScript Typecheck (0 Errors)
npm run typecheck
```

### Test Suite Execution Summary:
- **TypeScript (Vitest)**: 29 test files, **197 passed**, 0 failed
- **Python (Pytest)**: 8 test files, **70 passed**, 0 failed
- **Total Verification**: **267 Tests Passing (100% Pass Rate)**

---

## 🧠 Local Model Hub & Model Selection Guide

Rain Code Studio gives you complete control over which AI model powers your copilot:

1. **Auto-Detect Models**:
   - Start Ollama (`ollama serve`). Pull any model (e.g. `ollama run qwen2.5:1.5b` or `llama3.2:3b`).
   - Open Rain Code Studio → click the **🧠 Local AI Model Hub** in the ActivityBar (`Ctrl+0`).
   - Click **Discover Models** — your local models appear instantly with parameter counts, context size, and format.
2. **Switch Models Instantly in Chat**:
   - In the Developer AI Workspace (💬), click the **Model Dropdown** in the header.
   - Select any detected model with a single click.
   - All subsequent queries, bug analyses, and code reviews will be processed by that model.

---

## 📄 License & Attribution

Rain Code Studio is open-source software licensed under the [MIT License](LICENSE).  
Developed for Snapdragon PC innovation and privacy-first local developer enablement.