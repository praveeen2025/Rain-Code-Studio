# Rain Code Studio - Demonstration Script & Walkthrough

## Phase 12.1 End-to-End Demonstration Workflow

This script guides evaluators and developers through verifying the new **Project Intelligence** features in Rain Code Studio.

---

### Step 1: Open Workspace & Project Intelligence View
1. Launch Rain Code Studio (`npm run dev` or production package).
2. Open a project workspace or load the integrated demo project via the Welcome / Projects tab.
3. Click the **Brain** icon on the Activity Bar or press `Ctrl+I`, or select **View → Project Intelligence**.

### Step 2: AI Project Health Dashboard
1. Verify the **Overview** tab displays live, un-invented project metrics.
2. Note that **Test Coverage** displays **"Not measured"** with an explanation that dynamic execution requires active instrumentation.
3. Verify Code Quality counts (Total Files, Total Lines, Symbols, Syntax Errors) match the indexed workspace.
4. Verify Git Status, RAG vector readiness, and AI Model readiness cards report truthful state.

### Step 3: Codebase Architecture Map
1. Switch to the **Architecture Map** tab.
2. Use the Zoom In (`+`), Zoom Out (`-`), and Reset (`[ ]`) controls.
3. Filter nodes by *Classes Only* or *Functions Only*.
4. Click on any symbol or file node to view its line range and metrics in the Context Detail Inspector.
5. Click **Open In Editor** to jump directly to the target file.

### Step 4: Smart Project Search
1. Switch to the **Smart Search** tab.
2. Click one of the example queries (e.g., *"Where is authentication handled?"* or *"Where is the database connection created?"*).
3. Inspect returned results: verify each result shows relevance percentage, file path, symbol name, code snippet, and the clear **Selection Reason**.

### Step 5: AI Project Onboarding Mode
1. Switch to the **Onboarding** tab.
2. Observe the clear distinction between:
   - **Verified Project Information** (green badge with source reference, e.g. `package.json`).
   - **AI Inferred Architecture** (purple badge with disclaimer).
3. Inspect Main Entry Points, Core Modules, and System Data Flow.

### Step 6: Code Impact Analyzer
1. Switch to the **Impact Analysis** tab.
2. Enter a target file (e.g. `src/main/database/sqlite-manager.ts`).
3. Click **Analyze Scope & Impact**.
4. Observe Potential Scope assessment (`Isolated`, `Moderate`, `Broad`, `Critical`), detected import dependencies, affected symbols, and relevant test files.
5. Read the disclaimer confirming that dynamic dispatch is non-guaranteed.

### Step 7: AI Test Coverage Assistant
1. Switch to the **Test Coverage** tab.
2. View candidate functions lacking unit test suites.
3. Click **Generate Preview** on a candidate.
4. Inspect the generated Vitest / Pytest code block. Note that files are not automatically modified without explicit user approval.

### Step 8: Documentation Health
1. Switch to the **Documentation Health** tab.
2. Inspect README status and breakdown of Documented, Partially Documented, and Undocumented symbols.
3. Filter by *Potentially Undocumented* to inspect symbols needing docstrings.

### Step 9: AI Refactoring Planner
1. Switch to the **Refactoring Planner** tab.
2. Enter target file and a refactoring objective (e.g., *"Decompose monolithic connection pooling"*).
3. Click **Plan Refactor**.
4. Review the structured sequential migration steps, risk assessments, test plan checklist, and planning-only disclaimer.

### Step 10: Code Similarity Detector
1. Switch to the **Code Similarity** tab.
2. Set threshold slider (e.g. 70%) and click **Scan Duplicates**.
3. Click **Compare Side-by-Side** to inspect detected routines side-by-side in the comparison modal.

### Step 11: Local Project Knowledge Base
1. Switch to the **Project Knowledge** tab.
2. Click **New Note**.
3. Enter title *"Architecture Decision: SQLite Persistence"*, select category *Architecture*, write note content, and toggle *Include in RAG*.
4. Click **Save Note**. Verify note persists locally in SQLite and is filterable by category and search.
