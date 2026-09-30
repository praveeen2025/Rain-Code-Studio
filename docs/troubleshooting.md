# Rain Code Studio - Developer Troubleshooting & Diagnostics Guide

**Phase 10: Testing, Security, Reliability & Production Readiness**  
**Document Version:** 1.0.0 (Rain Code Studio v0.10.0)  

---

## 1. Local Python Backend Issues

### 1.1 Backend Fails to Start on Launch
**Symptoms:** The status bar displays `Backend: Offline` or an orange warning indicator appears on the top right.

**Causes & Solutions:**
1. **Port 8765 Already in Use:**
   - Run in PowerShell:
     ```powershell
     netstat -ano | findstr :8765
     ```
   - If a leftover process is holding the port, kill it using its PID:
     ```powershell
     taskkill /pid <PID> /F
     ```
   - Alternatively, open **Settings -> General** in Rain Code Studio and change the backend port to `8766` or `8770`.
2. **Missing Python Dependencies:**
   - Ensure the virtual environment or system Python has all required packages installed:
     ```powershell
     pip install -r python/requirements.txt
     ```
3. **Custom Python Executable Path:**
   - If your environment uses pyenv, conda, or a custom venv, set the environment variable:
     ```powershell
     $env:SNAPDEV_PYTHON_PATH = "C:\path\to\your\venv\Scripts\python.exe"
     ```

### 1.2 Restarting the Backend
Click **Restart Backend** in the top navigation status popover or execute `Restart Local AI Backend` in the Command Palette (`Ctrl+Shift+P`).

---

## 2. Local AI Model Loading Failures

### 2.1 Model Status Stuck on "Not Loaded" or Fails to Load
**Symptoms:** In the AI Workspace or Settings, clicking "Load Model" returns an error or times out.

**Causes & Solutions:**
1. **Model Weights Not Found:**
   - Verify that the local model directory exists under `models/` or your configured custom path.
   - For GGUF/ONNX models, verify file readability.
2. **Insufficient RAM / VRAM:**
   - Loading 7B/8B parameter models in 16-bit float requires 14–16 GB of memory.
   - Switch to 4-bit quantized (Q4_K_M) models or select **Settings -> Performance -> Execution Device: CPU / INT8 Quantized**.
3. **Corrupted Model Download:**
   - If the model weights were interrupted during download, delete the model directory and re-download.

---

## 3. RAG Indexing & AST Parsing Issues

### 3.1 Indexing Fails or Takes Abnormally Long
**Symptoms:** The project indexer hangs on `Indexing...` or displays parse errors.

**Causes & Solutions:**
1. **Massive Directories (e.g. `node_modules`, `build`, `dist`):**
   - Ensure these directories are in your `.gitignore`.
   - Rain Code Studio automatically ignores `.git`, `node_modules`, `dist`, `out`, `build`, `.venv`, and `database`.
2. **Corrupted SQLite Index Cache:**
   - If the index state becomes inconsistent, open **Settings -> Diagnostics** and click **Purge Index & Rebuild**, or delete:
     ```powershell
     Remove-Item -Force database/snapdev.sqlite
     ```
     The SQLite schema will automatically recreate itself cleanly on next launch.
3. **Corrupted FAISS Vector Index:**
   - Delete the cached vector directory for the project:
     ```powershell
     Remove-Item -Recurse -Force indexes/<project_id>
     ```
   - Click **Re-Index Project** in the Code Analysis page.

---

## 4. Git & Developer Tools Issues

### 4.1 Git Status Displays "Git Not Installed or Repository Missing"
**Symptoms:** The Git tab displays `Not a Git Repository` or operations fail.

**Causes & Solutions:**
1. **Workspace is Not a Git Repo:**
   - Click **Initialize Git Repository** on the Git page header or run `git init` in your project folder.
2. **Git Executable Not Found in PATH:**
   - Verify that Git is installed and accessible from command line:
     ```powershell
     git --version
     ```
   - If Git is installed in a non-standard location, add its `bin` directory to your system `PATH`.
3. **Unstaged Merge Conflicts:**
   - If a merge conflict exists, Rain Code Studio highlights conflicting files with red indicators. Open the conflict viewer or resolve conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) before committing.

---

## 5. File Confinement & Permission Errors

### 5.1 "Access Denied: Target path outside project root"
**Symptoms:** An error modal appears when previewing diffs or reading files.

**Causes & Solutions:**
- This is a built-in security feature (Path Traversal Protection). Rain Code Studio restricts all read, write, and patch operations strictly within the currently opened project folder.
- If you need to access files from another directory, open that directory as a project via **Projects -> Open Folder**.

### 5.2 Read-Only File Permissions
- On Windows, if files are marked as read-only or owned by another user/process, ensure the current user has write permissions to the workspace directory.

---

## 6. Performance & Telemetry Diagnostics

### 6.1 Inspecting Diagnostics Report
1. Open **Settings** (`Ctrl+,`) and navigate to the **Diagnostics** tab.
2. Click **Copy Report JSON** to copy full runtime telemetry:
   - Operating System & Architecture
   - CPU, Memory, and GPU detection
   - Python Backend & Electron IPC status
   - AST & SQLite index statistics
   - Recent system log entries
3. All secrets, tokens, and authorization headers are automatically redacted in exported reports.
