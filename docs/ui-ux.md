# Rain Code Studio — UI/UX Design System & Desktop Experience Architecture (Phase 9)

## 1. Overview & Design Philosophy

Rain Code Studio is an on-device, privacy-first AI developer copilot designed natively for Qualcomm Snapdragon Windows PCs and standard developer workstations. Phase 9 elevates the functional implementation of Phases 1–8 into a cohesive, professional desktop application suitable for live enterprise demos and developer productivity.

### Core Tenets:
1. **Information Density with Clean Visual Hierarchy**: High-contrast dark surfaces (`#0a0d14`, `#0e131f`, `#141a29`) paired with subtle borders (`#1f293d`) and curated Qualcomm Snapdragon crimson accents (`#ff1443`, `#e0113c`).
2. **Predictable Desktop Navigation**: Traditional 4-zone IDE layout: Top Bar, Left Collapsible Sidebar, Central Workspace, Right Context Panel, and Bottom Status Bar.
3. **Zero Fabricated Progress or Marketing Claims**: Every progress indicator, token throughput metric, and hardware capability report reflects real, measured system state. Unknown or unverified metrics explicitly display "Unknown" or "Not detected".
4. **Non-Blocking User Experience**: Lengthy AST indexing, model loading, and RAG retrieval run asynchronously in the background. The UI remains responsive at all times.
5. **Privacy by Invariant**: 100% on-device execution. Code, AST symbols, embeddings, and Git diffs never transmit over external networks.

---

## 2. Desktop Layout & Panel Architecture

```
+---------------------------------------------------------------------------------------------+
| Top Bar: Logo | Phase 9 Active | Project Context | Command Palette (Ctrl+P) | Status Icons |
+------------------+-------------------------------------------------------+------------------+
| Sidebar (w-56)   | Central Workspace                                     | Right Context    |
| (Collapsible     | - Projects Workspace                                  | Panel (w-80)     |
| to icon mode     | - Project Explorer & Code Viewer                      | - Active Project |
| w-14 via Ctrl+B) | - AI Developer Workspace (3-column layout)            | - File & AST     |
|                  | - AST Code Analysis & Dependency Graphs               | - RAG Chunks     |
| - Projects       | - Bug Detection & Root Cause Analysis                 | - Copilot Action |
| - Files          | - Automated Test Suite Generation                     | - Snapdragon     |
| - AI Workspace   | - Documentation Generator                             |   Telemetry      |
| - Intelligence   | - Project Intelligence (Health, Arch, Search, etc.)   |                  |
| - Code Analysis  | - Git Workspace (Staged/Unstaged Diffs, AI Commits)   |                  |
| - Bugs           | - Performance Dashboard (Hardware, Benchmarks, AUTO)  |                  |
| - Tests          | - Application Settings & Diagnostics                  |                  |
| - Documentation  |                                                       |                  |
| - Git            |                                                       |                  |
| - Performance    |                                                       |                  |
| - Settings       |                                                       |                  |
+------------------+-------------------------------------------------------+------------------+
| Bottom Status Bar: Git Branch & State | Indexer Status | Active File | AI Model | Hardware  |
+---------------------------------------------------------------------------------------------+
```

### Layout Specifications:
- **Top Bar (`h-12`)**: Drag-region compatible for frameless desktop styling. Hosts brand badge, quick project switcher pill, universal command trigger, AI model status indicator, backend health heartbeat, and right panel toggle.
- **Sidebar (`w-56` / `w-14`)**: Responsive collapsible navigation with icon-only toggle (`Ctrl+B`). Displays quick shortcuts (`Ctrl+1` through `Ctrl+9`) and first-launch tour access.
- **Workspace (`flex-1`)**: Houses individual domain views. Tested and styled for desktop resolutions from `1366×768` to `2560×1440` (ultrawide & 4K).
- **Right Context Panel (`w-80`)**: Collapsible panel (`Ctrl+J`) providing live project metadata, active AST symbol outlines, retrieved RAG chunks with similarity scores, and hardware telemetry.
- **Bottom Status Bar (`h-6`)**: Real-time developer telemetry: Git branch & dirty count, project file indexing progress, active cursor line/file, AI inference device, and privacy invariant badge.

---

## 3. Design System & Component Library

All components reside in `src/renderer/components/common/` and adhere to semantic design tokens:

| Component | Variants | Usage |
|---|---|---|
| `Button` | `primary`, `secondary`, `destructive`, `ghost`, `outline`, `snap` | Standard interactive triggers with focus rings and loading states |
| `Badge` | `clean`, `modified`, `staged`, `conflict`, `untracked`, `snap`, `info`, `success`, `warning`, `error` | Status indicators for Git working tree, AST parsing, and AI engine |
| `Modal` | `sm`, `md`, `lg`, `xl`, `2xl` | Accessible dialog with backdrop blur, focus trap, and Escape key dismissal |
| `ConfirmDialog` | `destructive`, `default` | Safe confirmation before applying diffs, branch switching, or history deletion |
| `EmptyState` | Icon, Title, Description, Primary & Secondary Actions | Clean, actionable empty states on all pages |
| `ToastContainer` | `success`, `error`, `warning`, `info` | Non-blocking bottom-right notifications with auto-dismiss (4s/6s) |
| `Spinner` | `xs`, `sm`, `md`, `lg` | Smooth SVG animation for loading states |
| `Tooltip` | `top`, `bottom`, `left`, `right` | Accessible hover tooltips with keyboard shortcut hints |

---

## 4. Universal Command Palette & File Search

Accessible globally via `Ctrl + Shift + P` (or `F1`) and `Ctrl + P`:

### Command Mode (`Ctrl + Shift + P`)
Fuzzy search across all workspaces and actions:
- **Navigation**: Switch between Projects, Files, AI Workspace, Analysis, Bugs, Tests, Docs, Git, Performance, Settings.
- **Project Operations**: Open Folder Dialog, Load Demo Project.
- **AI Copilot**: Explain Active Code, Review Code Quality, Generate Unit Tests, Generate Documentation.
- **Git**: Inspect Status & Diffs, Generate Conventional Commit Message.
- **View**: Toggle Sidebar (`Ctrl+B`), Toggle Context Panel (`Ctrl+J`), Switch Theme.

### File Search Mode (`Ctrl + P`)
Instant fuzzy finder indexing all files in the current active project. Pressing `Enter` selects the file and jumps directly to the code viewer.

---

## 5. Keyboard Shortcuts Reference

| Shortcut | Action | Description |
|---|---|---|
| `Ctrl + Shift + P` | Command Palette | Fuzzy search across all actions and commands |
| `Ctrl + P` | Quick File Search | Instant file finder for project directory |
| `Ctrl + J` | Toggle Context Panel | Expands or collapses right context panel |
| `Ctrl + B` | Toggle Sidebar | Toggles sidebar between expanded and compact icon mode |
| `Ctrl + ,` | Open Settings | Jumps directly to application settings & diagnostics |
| `Ctrl + 1` | Go to Projects | Workspace manager and recent folders |
| `Ctrl + 2` | Go to Files | Project Explorer and code preview |
| `Ctrl + 3` | Go to AI Workspace | Developer copilot, streaming chat, and diffs |
| `Ctrl + 4` | Go to Code Analysis | AST parsing, symbol search, and call hierarchies |
| `Ctrl + 5` | Go to Bugs | Automated on-device bug finding & root cause analysis |
| `Ctrl + 6` | Go to Tests | Unit test generator for Vitest, Jest, and Pytest |
| `Ctrl + 7` | Go to Documentation | Docstring and API markdown generator |
| `Ctrl + 8` | Go to Git | Git status, diff viewer, and AI commit assistant |
| `Ctrl + 9` | Go to Performance | Snapdragon telemetry, benchmarks, and device settings |
| `Escape` | Close Dialog | Dismisses open modals, command palette, and menus |

---

## 6. Safe Diff & AI Workspace Experience

Phase 9 polishes the AI Developer Workspace:
1. **Three-Column Information Architecture**:
   - **Left**: Task history session list with timestamps and status badges (`completed`, `pending`, `applied`, `rejected`).
   - **Center**: Conversational AI stream with formatted markdown, syntax-highlighted code blocks, grounded source counters, and latency/throughput metrics.
   - **Right**: Structured findings tabs (`Findings`, `Diff Preview`, `Retrieved Sources`).
2. **Safe Diff Pipeline**:
   - AI generates unified patches with verified SHA-256 baseline hashes.
   - User reviews exact additions (`+` green) and deletions (`-` red).
   - Clicking **Apply Changes** prompts an explicit confirmation dialog before modifying disk files.
   - Applied patches immediately trigger AST re-parsing and local SQLite index refresh.
3. **Real Progress Messaging**:
   - Working states clearly display actual operational stages:
     - `Analyzing project context...`
     - `Retrieving relevant code...`
     - `Generating response...`
   - Zero synthetic percentage bars.

---

## 7. First-Launch Onboarding Walkthrough

New users are guided by a 4-step interactive modal on first launch (persisted locally via `localStorage`):
1. **Welcome**: Introduces Snapdragon PC optimization and 100% on-device privacy guarantee.
2. **Workspace Connection**: Prompts opening a local repository or loading the bundled multi-language demo project.
3. **Local Intelligence**: Explains local AST parsing, hybrid RAG embeddings, and safe diff previews.
4. **Master Shortcuts**: Interactive keyboard shortcuts reference card.

Users can dismiss via "Skip Tour" or "Get Started", and can reset the tour anytime from **Settings > General**.

---

## 8. Theme System (Dark / Light / System)

Rain Code Studio implements a tokenized CSS variable system (`src/renderer/index.css`) supporting:
- **Dark Mode (Default & Recommended)**: High-contrast slate and navy surfaces (`#0a0d14`, `#0e131f`) with red and cyan accents.
- **Light Mode**: Clean daytime appearance (`#f8fafc`, `#ffffff`, `#e2e8f0`) with dark typography (`#0f172a`).
- **System Synchronized**: Automatically detects `prefers-color-scheme`.

Preference is persisted locally and applied instantly via `document.documentElement.classList`.

---

## 9. Developer Diagnostics & Logging Panel

Located in **Settings > Diagnostics**:
- Real-time application version (`0.9.0`) and phase tag.
- Electron, Node.js, and OS platform architecture (`x64` / `arm64`).
- Snapdragon detection status (`Snapdragon Detected` vs `Snapdragon Not Detected`).
- Python backend status and local port (`8765`).
- Local AI model and execution device (`Qwen2.5-Coder-1.5B (cpu / gpu / npu)`).
- **One-Click Export**: "Copy Report JSON" copies sanitized environment telemetry to clipboard with toast confirmation for easy bug reporting without leaking project paths or secrets.
