# Rain Code Studio - System Architecture & Subsystem Specification

## 1. System Overview

Rain Code Studio is a privacy-first, on-device desktop development environment architected with a decoupled multi-process topology:
1. **Electron Host & Desktop Lifecycle (Main Process)**: Manages OS native integration, window lifecycle, SQLite database persistence, Git operations, filesystem safety confinement, and the typed IPC gateway.
2. **React 18 + Tailwind Developer Workspace (Renderer Process)**: Modern developer workspace featuring an Activity Bar (48px), Primary Sidebar (260px), multi-tab Code Editor area, bottom panel (Terminal, Output, Problems), and right context panel.
3. **Local Python AI & RAG Subsystem (FastAPI Sidecar)**: Headless local sidecar serving grounded LLM inference, embedding generation, and vector search over local HTTP (127.0.0.1:8765).
4. **Phase 12.1 Project Intelligence Subsystem**: Unified analysis engine interfacing directly with SQLite index tables and RAG embeddings to provide health metrics, interactive architecture mapping, smart semantic search, onboarding generation, impact analysis, test coverage gap assistant, documentation health, refactoring planning, code similarity detection, and local project knowledge base.

---

## 2. Multi-Process Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           Rain Code Studio Desktop                                |
+-----------------------------------------------------------------------------------+
|  [Renderer Process - React 18 UI]                                                 |
|  - ActivityBar | Sidebar | TabsBar | EditorArea | BottomPanel | ContextPanel      |
|  - Pages: Projects, Files, Chat, Intelligence, Analysis, Bugs, Tests, Docs, etc.  |
+----------------------------------------+------------------------------------------+
                                         | window.electronAPI (typed IPC)
+----------------------------------------v------------------------------------------+
|  [Main Process - Electron / Node.js]                                              |
|  - ProjectIntelligenceService (Phase 12.1: Health, Map, Search, Onboarding, etc.) |
|  - SQLiteManager (WebAssembly SQL.js backing database/snapdev.sqlite)             |
|  - GitManager (Git status, diff, branches, conflicts, commit log)                 |
|  - ProjectIndexer (Tree-sitter AST parser, file scanner, file watcher)            |
|  - ChangeManager & Security Confinement (SHA-256 validation, path safety)         |
+----------------------------------------+------------------------------------------+
                                         | Local HTTP (127.0.0.1:8765)
+----------------------------------------v------------------------------------------+
|  [Sidecar Process - Python FastAPI Backend]                                       |
|  - ModelManager (Local quantized LLMs via ONNX / GGUF / local runtime)            |
|  - RAGService (local-code-mini-384 embeddings, FAISS / SQLite vector store)       |
|  - Intelligence Endpoints (/api/intelligence/health, /smart-search, etc.)         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Storage & Schema Design

All project data is stored in the local SQLite database at `database/snapdev.sqlite`:
- `projects`: Workspace IDs, root paths, last opened timestamps, index status.
- `files`: File paths, relative paths, languages, line counts, parse statuses.
- `symbols`: AST symbols (classes, functions, interfaces, methods, structs) with line numbers, columns, signatures, docstrings.
- `imports`: Dependencies and imported specifiers per file.
- `exports`: Exported identifiers per file.
- `parse_errors`: Syntax and parser errors detected during AST passes.
- `project_knowledge`: Local ADRs, architecture decisions, conventions, notes with optional RAG vector inclusion.
