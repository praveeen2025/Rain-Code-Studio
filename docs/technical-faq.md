# Rain Code Studio - Technical FAQ

## 1. General & Architecture

### Q1: Why does Test Coverage show "Not measured"?
**A:** In accordance with the strict rule **Do NOT invent scores**, dynamic line execution coverage requires active test instrumentation (e.g. Istanbul/c8, coverage.py). Rather than fabricating a percentage, Rain Code Studio reports **"Not measured"**, displays the factual count of detected test files, and provides a static heuristic test gap assistant in Phase 12.1.

### Q2: Does Rain Code Studio transmit code to cloud AI servers?
**A:** No. Rain Code Studio is 100% on-device. Both RAG embeddings and LLM inference execute locally on the developer's physical workstation. No code, tokens, or telemetry leave the device.

### Q3: How is the Codebase Architecture Map generated without a second parser?
**A:** The architecture map queries the existing Tree-sitter SQLite tables (`files`, `symbols`, `imports`). Node relationships are built directly from parsed AST metadata, preserving fast load times and zero duplicate CPU overhead.

### Q4: Can the AI Refactoring Planner or Test Assistant modify my code automatically?
**A:** No. Rain Code Studio enforces a strict human-in-the-loop change management protocol. All AI modifications require explicit diff inspection and manual user approval before writing to disk.

### Q5: How is Local Project Knowledge kept separate from project source files?
**A:** User-created knowledge notes are persisted in the `project_knowledge` table in the local SQLite database (`database/snapdev.sqlite`), strictly isolated from repository source code. Notes are only injected into RAG queries if the user explicitly toggles the "Include in RAG" option.
