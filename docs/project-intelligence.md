# Rain Code Studio - Project Intelligence (Phase 12.1)

## 1. Overview & Architectural Philosophy

Phase 12.1 introduces the **Project Intelligence Subsystem** to Rain Code Studio. This module provides a comprehensive suite of factual, on-device developer-intelligence capabilities without relying on external cloud endpoints, duplicate vector databases, or redundant AST parsing engines.

### Core Principles
1. **Zero Invented Metrics**: All statistics (files, lines, symbols, parse status, imports, dependencies, git state) reflect actual project data. Dynamic line execution test coverage is strictly labeled **"Not measured"** unless dynamic instrumented test runner execution is active.
2. **Reuse Existing Infrastructure**: Reuses the Tree-sitter SQLite index (`snapdev.sqlite`), the local RAG embedding index (`local-code-mini-384`), the on-device AI provider, the Git manager, and the electron IPC bridge.
3. **Non-Destructive & Planning-Only Workflows**: Test assistants, refactoring assistants, and impact analyzers generate proposals, previews, and plans. They never modify code silently or automatically without developer review and approval.
4. **Local Knowledge Isolation**: The Project Knowledge Base maintains local architectural decision records (ADRs) and notes, clearly separated from project source files.

---

## 2. Feature Architecture & Capabilities

```
+---------------------------------------------------------------------------------+
|                       Rain Code Studio - Project Intelligence                   |
+---------------------------------------------------------------------------------+
|  1. AI Health Dashboard   |  2. Architecture Map    |  3. Smart Project Search  |
|  - Real file & line counts|  - Hierarchical Nodes   |  - Hybrid RAG Retrieval   |
|  - Real symbol counts     |  - Import Relationships |  - Symbol Name Matching   |
|  - Factual parse status   |  - Zoom, Pan & Filters  |  - Reason Explanations    |
+---------------------------+-------------------------+---------------------------+
|  4. Project Onboarding    |  5. Impact Analyzer     |  6. Test Coverage Assist  |
|  - Verified vs Inferred   |  - Dependency Traversal |  - Static Gap Detection   |
|  - Entry Points & Roles   |  - Scope Classification |  - Non-destructive Preview|
|  - Data Flow Overview     |  - Diff Preview         |  - User Apply / Reject    |
+---------------------------+-------------------------+---------------------------+
|  7. Documentation Health  |  8. Refactoring Planner |  9. Similarity Detector   |
|  - README & Docs Audit    |  - Planning-Only Engine |  - Token & Signature Heur.|
|  - Symbol Doc Ratios      |  - Step-by-Step Risk Map|  - Side-by-Side Modal     |
+---------------------------+-------------------------+---------------------------+
|                           10. Local Project Knowledge Base                      |
|                           - Local SQLite Storage (project_knowledge)            |
|                           - Search, Categories, Tags & Optional RAG Toggle      |
+---------------------------------------------------------------------------------+
```

### Feature 1: AI Project Health Dashboard
- **Data Source**: SQLite `files`, `symbols`, `parse_errors`, and `imports` tables; Git status from `gitManager`; RAG status from `ragBackendClient`; AI runtime from `aiBackendClient`.
- **Integrity Guarantee**: Never invents scores. Unmeasured dynamic coverage explicitly outputs `"Not measured"`.

### Feature 2: Codebase Architecture Map
- **Data Source**: SQLite structural index tables.
- **Capabilities**: Interactive node explorer (Directories, Files, Modules, Classes, Functions) linked by `contains` and `imports` edges. Includes node inspection and direct editor navigation.

### Feature 3: Smart Project Search
- **Data Source**: Hybrid combination of local RAG vector embeddings + SQLite exact & LIKE symbol matching + filepath matching.
- **Output**: Ranked results with explicit selection reasoning (`matchedVia: 'semantic_rag' | 'symbol_match' | 'filepath_match'`).

### Feature 4: AI Project Onboarding Mode
- **Data Source**: `package.json`, `pyproject.toml`, `README.md`, entry point heuristic scanners, and local AI architectural synthesis.
- **Integrity Guarantee**: Distinguishes verified facts (`isVerified: true` with source citation) from local AI inference (`isVerified: false`).

### Feature 5: Code Impact Analyzer
- **Data Source**: SQLite `imports` table (reverse and forward import dependencies), target symbols, and test file naming patterns.
- **Disclaimer**: Categorizes potential scope into `isolated`, `moderate`, `broad`, or `critical`. Explicitly notes that dynamic reflection or runtime dispatch cannot be guaranteed.

### Feature 6: AI Test Coverage Assistant
- **Data Source**: Cross-reference between source symbols and test files.
- **Workflow**: Non-destructive preview generation with user approval. Never modifies test files automatically.

### Feature 7: Documentation Health
- **Data Source**: Presence and byte length of README/docs, plus JSDoc/docstring lengths across public symbols in SQLite.
- **Output**: Categorized into `Documented`, `Partially documented`, and `Potentially undocumented`.

### Feature 8: AI Refactoring Planner
- **Data Source**: Target file context, symbol signatures, and callers.
- **Strict Limitation**: Planning only. Outputs sequential steps, risk mitigations, testing plans, and documentation requirements. Does not alter code.

### Feature 9: Code Similarity Detector
- **Data Source**: Pairwise signature, line-span, and token heuristic comparisons across indexed functions and methods in SQLite.
- **UI**: Side-by-side comparison modal with similarity percentage and reasoning.

### Feature 10: Local Project Knowledge Base
- **Data Source**: Local SQLite `project_knowledge` table (`id`, `project_id`, `title`, `category`, `content`, `tags`, `include_in_rag`, `created_at`, `updated_at`).
- **Features**: Full local CRUD with category filtering, keyword searching, and optional RAG vector inclusion toggle.

---

## 3. Security & Privacy Guarantees

- **100% Local Execution**: All telemetry, searches, analyses, and notes remain on the local machine. Zero cloud egress.
- **Untrusted Input Protection**: Code files and comments are treated as untrusted data and sanitized against prompt injection.
- **Human-in-the-Loop Safe Diff**: Any proposed code adjustments require explicit developer review before writing to disk.
- **No Arbitrary Execution**: Analysis tools never execute project code or arbitrary shell commands.

---

## 4. Performance & Resource Considerations

- **Incremental Queries**: Reuses existing SQLite indexes (`idx_files_project`, `idx_symbols_file`, `idx_imports_file`, `idx_knowledge_project`) for sub-millisecond query latency.
- **Graph Capping**: Large projects limit symbol nodes in the visual explorer to the top 300 to preserve 60 FPS renderer responsiveness.
- **Zero Duplicate Indexing**: Leverages existing AST parses and RAG chunks; does not re-parse the workspace unnecessarily.
