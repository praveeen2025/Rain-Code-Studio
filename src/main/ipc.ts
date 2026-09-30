/**
 * SnapDev AI - IPC Handler Registration
 * Connects Main process capabilities securely to the Renderer via typed channels.
 * Validates all inputs strictly. Extended for Phase 3 Code Intelligence.
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import os from 'os';
import { exec } from 'child_process';
import { IPC_CHANNELS, APP_VERSION } from '../shared/constants';
import { AppSettings, SymbolSearchQuery } from '../shared/types';
import { ProcessManager } from './process-manager';
import { projectManager } from './project-manager';
import { filesystemManager } from './filesystem';
import { projectIndexer } from './indexer/project-indexer';
import { projectWatcher } from './indexer/project-watcher';
import { ragBackendClient } from './rag/rag-backend-client';
import { aiBackendClient } from './ai/ai-backend-client';
import { changeManager } from './patch/change-manager';
import { taskHistoryManager } from './patch/task-history-manager';
import { gitManager } from './git/git-manager';
import { hardwareInfoService, performanceMonitor } from './system/system-info';
import { projectIntelligenceService } from './intelligence/project-intelligence-service';
import { localModelDiscoveryService } from './ai/local-model-discovery';
import {
  ChatRequest,
  LoadModelRequest,
  FilePatch,
  TaskHistoryItem,
  BenchmarkTestType,
  LocalAIPerformanceConfig
} from '../shared/types';

let inMemorySettings: AppSettings = {
  backendHost: '127.0.0.1',
  backendPort: 8765,
  theme: 'dark',
  autoStartBackend: true,
  telemetryEnabled: false,
  logLevel: 'info'
};

export function registerIpcHandlers(
  processManager: ProcessManager,
  getMainWindow: () => BrowserWindow | null
): void {
  // Wire indexer events to WebContents
  projectIndexer.onProgress((progress) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.INDEX_PROGRESS_EVENT, progress);
    }
  });

  projectIndexer.onStatusChange((status) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.INDEX_STATUS_EVENT, status);
    }
  });

  // Backend Process Lifecycle
  ipcMain.handle(IPC_CHANNELS.GET_BACKEND_STATUS, async () => {
    return processManager.getState();
  });

  ipcMain.handle(IPC_CHANNELS.RESTART_BACKEND, async () => {
    try {
      await processManager.stop();
      const started = await processManager.start();
      return {
        success: started,
        message: started ? 'Backend restarted successfully.' : 'Failed to restart backend.'
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.GET_APP_SETTINGS, async () => {
    return inMemorySettings;
  });

  ipcMain.handle(
    IPC_CHANNELS.UPDATE_APP_SETTINGS,
    async (_, updates: Partial<AppSettings>) => {
      if (updates.backendPort && (updates.backendPort < 1024 || updates.backendPort > 65535)) {
        throw new Error('Port must be between 1024 and 65535.');
      }
      inMemorySettings = {
        ...inMemorySettings,
        ...updates,
        telemetryEnabled: false // Privacy-first: strictly false
      };
      return inMemorySettings;
    }
  );

  // Native Open Directory Dialog
  ipcMain.handle(IPC_CHANNELS.SELECT_PROJECT_DIR, async () => {
    const win = getMainWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      title: 'Open Project Directory',
      properties: ['openDirectory', 'dontAddToRecent']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Project Management
  ipcMain.handle(IPC_CHANNELS.LOAD_PROJECT, async (_, folderPath: unknown) => {
    if (typeof folderPath !== 'string' || !folderPath.trim()) {
      throw new Error('Invalid project path supplied.');
    }
    const project = await projectManager.loadProject(folderPath.trim());
    projectWatcher.startWatching(project);
    // Automatically kick off initial indexing
    projectIndexer.indexProject(project).catch(console.error);
    return project;
  });

  ipcMain.handle(IPC_CHANNELS.LOAD_DEMO_PROJECT, async () => {
    const project = await projectManager.loadDemoProject();
    projectWatcher.startWatching(project);
    projectIndexer.indexProject(project).catch(console.error);
    return project;
  });

  ipcMain.handle(IPC_CHANNELS.GET_RECENT_PROJECTS, async () => {
    return projectManager.getRecentProjects();
  });

  ipcMain.handle(IPC_CHANNELS.READ_PROJECT_TREE, async (_, folderPath: unknown) => {
    if (typeof folderPath !== 'string' || !folderPath.trim()) {
      throw new Error('Invalid path for directory tree reading.');
    }
    return filesystemManager.readDirectoryTree(folderPath.trim());
  });

  ipcMain.handle(IPC_CHANNELS.READ_PROJECT_FILE, async (_, filePath: unknown) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      throw new Error('Invalid file path supplied.');
    }
    const cleanPath = filePath.trim();
    const activeProject = projectManager.getActiveProject();
    if (activeProject && !filesystemManager.isPathConfined(cleanPath, activeProject.path)) {
      throw new Error('Access denied: File path is outside the active project root.');
    }
    return filesystemManager.readFile(cleanPath, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.WRITE_PROJECT_FILE, async (_, filePath: unknown, content: unknown) => {
    if (typeof filePath !== 'string' || !filePath.trim() || typeof content !== 'string') {
      return { success: false, error: 'Invalid parameters for file writing.' };
    }
    const cleanPath = filePath.trim();
    const activeProject = projectManager.getActiveProject();
    return filesystemManager.writeFile(cleanPath, content, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_PROJECT_FILE, async (_, filePath: unknown) => {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return { success: false, error: 'Invalid file path.' };
    }
    const cleanPath = filePath.trim();
    const activeProject = projectManager.getActiveProject();
    return filesystemManager.createFile(cleanPath, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.CREATE_PROJECT_FOLDER, async (_, folderPath: unknown) => {
    if (typeof folderPath !== 'string' || !folderPath.trim()) {
      return { success: false, error: 'Invalid folder path.' };
    }
    const cleanPath = folderPath.trim();
    const activeProject = projectManager.getActiveProject();
    return filesystemManager.createFolder(cleanPath, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_PROJECT_ITEM, async (_, itemPath: unknown) => {
    if (typeof itemPath !== 'string' || !itemPath.trim()) {
      return { success: false, error: 'Invalid item path.' };
    }
    const cleanPath = itemPath.trim();
    const activeProject = projectManager.getActiveProject();
    return filesystemManager.deleteItem(cleanPath, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.RENAME_PROJECT_ITEM, async (_, oldPath: unknown, newPath: unknown) => {
    if (typeof oldPath !== 'string' || !oldPath.trim() || typeof newPath !== 'string' || !newPath.trim()) {
      return { success: false, error: 'Invalid paths for rename.' };
    }
    const cleanOld = oldPath.trim();
    const cleanNew = newPath.trim();
    const activeProject = projectManager.getActiveProject();
    return filesystemManager.renameItem(cleanOld, cleanNew, activeProject?.path);
  });

  // System Environment Info
  ipcMain.handle(IPC_CHANNELS.GET_SYSTEM_INFO, async () => {
    const cpus = os.cpus();
    const modelStr = cpus.length > 0 ? cpus[0].model.toLowerCase() : '';
    const isSnapdragon =
      modelStr.includes('snapdragon') ||
      modelStr.includes('qualcomm') ||
      modelStr.includes('sc8380') ||
      modelStr.includes('x elite');

    return {
      platform: process.platform,
      arch: process.arch,
      isSnapdragon,
      appVersion: APP_VERSION,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node
    };
  });

  // ==================================================
  // PHASE 3: CODE PARSING & INDEXING HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.INDEX_START, async (_, projectPath: unknown) => {
    const active = projectManager.getActiveProject();
    if (!active) {
      if (typeof projectPath === 'string') {
        const proj = await projectManager.loadProject(projectPath);
        projectWatcher.startWatching(proj);
        return projectIndexer.indexProject(proj);
      }
      return false;
    }
    return projectIndexer.indexProject(active);
  });

  ipcMain.handle(IPC_CHANNELS.INDEX_GET_STATUS, async (_, projectId: unknown) => {
    if (typeof projectId !== 'string') return 'not_indexed';
    return projectIndexer.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.INDEX_GET_STATISTICS, async (_, projectId: unknown) => {
    if (typeof projectId !== 'string') {
      return {
        totalFiles: 0,
        sourceFiles: 0,
        totalSymbols: 0,
        functions: 0,
        classes: 0,
        interfaces: 0,
        types: 0,
        variables: 0,
        imports: 0,
        exports: 0,
        parseErrors: 0
      };
    }
    return projectIndexer.getStatistics(projectId);
  });

  ipcMain.handle(
    IPC_CHANNELS.INDEX_GET_FILE_SYMBOLS,
    async (_, args: { projectId: string; filePath: string }) => {
      if (!args || !args.projectId || !args.filePath) return null;
      return projectIndexer.getFileSymbols(args.projectId, args.filePath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INDEX_SEARCH_SYMBOLS,
    async (_, args: { projectId: string; query: SymbolSearchQuery }) => {
      if (!args || !args.projectId || !args.query) return [];
      return projectIndexer.searchSymbols(args.projectId, args.query);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INDEX_GET_SYMBOL_CONTEXT,
    async (_, args: { projectId: string; symbolId: string }) => {
      if (!args || !args.symbolId) return null;
      return projectIndexer.getSymbolContext(args.symbolId);
    }
  );

  // ==================================================
  // PHASE 4: LOCAL RAG & RETRIEVAL HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.RAG_SEARCH, async (_, query: unknown) => {
    if (!query || typeof query !== 'object') return [];
    return ragBackendClient.search(query as any);
  });

  ipcMain.handle(IPC_CHANNELS.RAG_GET_CONTEXT, async (_, query: unknown) => {
    if (!query || typeof query !== 'object') {
      throw new Error('Invalid context query parameters');
    }
    return ragBackendClient.getContext(query as any);
  });

  ipcMain.handle(IPC_CHANNELS.RAG_GET_STATUS, async (_, projectId: unknown) => {
    return ragBackendClient.getStatus(typeof projectId === 'string' ? projectId : undefined);
  });

  ipcMain.handle(IPC_CHANNELS.RAG_INDEX_PROJECT, async (_, projectId: unknown) => {
    if (typeof projectId !== 'string') {
      throw new Error('Project ID required for RAG vector indexing');
    }
    return projectIndexer.indexProjectRag(projectId);
  });

  // ==================================================
  // PHASE 5: LOCAL AI MODEL & CHAT HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.AI_GET_STATUS, async () => {
    return aiBackendClient.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.AI_GET_MODEL, async () => {
    return aiBackendClient.getModelInfo();
  });

  ipcMain.handle(IPC_CHANNELS.AI_LOAD_MODEL, async (_, req: unknown) => {
    return aiBackendClient.loadModel(req as LoadModelRequest);
  });

  ipcMain.handle(IPC_CHANNELS.AI_UNLOAD_MODEL, async () => {
    return aiBackendClient.unloadModel();
  });

  ipcMain.handle(IPC_CHANNELS.AI_CHAT, async (_, req: unknown) => {
    if (!req || typeof req !== 'object') {
      throw new Error('Invalid chat request payload');
    }
    return aiBackendClient.sendChatMessage(req as ChatRequest);
  });

  ipcMain.handle(IPC_CHANNELS.AI_STOP, async () => {
    return aiBackendClient.stopGeneration();
  });

  // ==================================================
  // PHASE 6: SAFE PATCH & TASK HISTORY HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.PATCH_PREVIEW, async (_, patch: unknown) => {
    const activeProject = projectManager.getActiveProject();
    return changeManager.previewPatch(patch as FilePatch, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.PATCH_APPLY, async (_, patch: unknown) => {
    const activeProject = projectManager.getActiveProject();
    return changeManager.applyPatch(patch as FilePatch, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.PATCH_REJECT, async (_, patch: unknown) => {
    return changeManager.rejectPatch(patch as FilePatch);
  });

  ipcMain.handle(IPC_CHANNELS.PATCH_ROLLBACK, async (_, filePath: unknown) => {
    if (typeof filePath !== 'string') {
      return { success: false, message: 'Invalid file path for rollback', filePath: '' };
    }
    const activeProject = projectManager.getActiveProject();
    return changeManager.rollbackPatch(filePath, activeProject?.path);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_HISTORY_GET, async () => {
    return taskHistoryManager.getHistory();
  });

  ipcMain.handle(IPC_CHANNELS.TASK_HISTORY_ADD, async (_, item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    return taskHistoryManager.addTask(item as TaskHistoryItem);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_HISTORY_DELETE, async (_, id: unknown) => {
    if (typeof id !== 'string') return false;
    return taskHistoryManager.deleteTask(id);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_HISTORY_CLEAR, async () => {
    return taskHistoryManager.clearHistory();
  });

  // ==================================================
  // PHASE 7: GIT & DEVELOPER TOOLS HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.GIT_GET_REPO_INFO, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.getRepositoryInfo(target);
  });

  ipcMain.handle(IPC_CHANNELS.GIT_INIT_REPO, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.initRepository(target);
  });

  ipcMain.handle(IPC_CHANNELS.GIT_GET_STATUS, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.getStatus(target);
  });

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_DIFF,
    async (_, args: { filePath?: string; isStaged?: boolean; projectPath?: string } | undefined) => {
      const filePath = args?.filePath;
      const isStaged = Boolean(args?.isStaged);
      const projectPath = args?.projectPath;
      return gitManager.getDiff(filePath, isStaged, projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_STAGE_FILE,
    async (_, args: { filePath: string; projectPath?: string }) => {
      if (!args || typeof args.filePath !== 'string') {
        return { success: false, error: 'File path required to stage' };
      }
      return gitManager.stageFile(args.filePath, args.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_UNSTAGE_FILE,
    async (_, args: { filePath: string; projectPath?: string }) => {
      if (!args || typeof args.filePath !== 'string') {
        return { success: false, error: 'File path required to unstage' };
      }
      return gitManager.unstageFile(args.filePath, args.projectPath);
    }
  );

  ipcMain.handle(IPC_CHANNELS.GIT_STAGE_ALL, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.stageAll(target);
  });

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE_ALL, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.unstageAll(target);
  });

  ipcMain.handle(
    IPC_CHANNELS.GIT_COMMIT,
    async (_, args: { message: string; projectPath?: string }) => {
      if (!args || typeof args.message !== 'string') {
        return { success: false, error: 'Commit message required' };
      }
      return gitManager.commit(args.message, args.projectPath);
    }
  );

  ipcMain.handle(IPC_CHANNELS.GIT_GET_BRANCHES, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.getBranches(target);
  });

  ipcMain.handle(
    IPC_CHANNELS.GIT_CHECKOUT_BRANCH,
    async (_, args: { branchName: string; projectPath?: string }) => {
      if (!args || typeof args.branchName !== 'string') {
        return { success: false, error: 'Branch name required' };
      }
      return gitManager.checkoutBranch(args.branchName, args.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_LOG,
    async (_, args: { maxCount?: number; projectPath?: string } | undefined) => {
      const maxCount = args?.maxCount;
      const projectPath = args?.projectPath;
      return gitManager.getLog(maxCount, projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_COMMIT_DETAILS,
    async (_, args: { hash: string; projectPath?: string }) => {
      if (!args || typeof args.hash !== 'string') {
        throw new Error('Commit hash required');
      }
      return gitManager.getCommitDetails(args.hash, args.projectPath);
    }
  );

  ipcMain.handle(IPC_CHANNELS.GIT_GET_CONFLICTS, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.getConflicts(target);
  });

  ipcMain.handle(IPC_CHANNELS.GIT_GET_DEV_TOOLS_INFO, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.getDeveloperToolsInfo(target);
  });

  ipcMain.handle(IPC_CHANNELS.GIT_GET_PROJECT_HEALTH, async (_, projectPath?: unknown) => {
    const target = typeof projectPath === 'string' ? projectPath : undefined;
    return gitManager.getProjectHealth(target);
  });

  // ==================================================
  // PHASE 8: SNAPDRAGON OPTIMISATION & PERFORMANCE HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_HARDWARE_INFO, async () => {
    return hardwareInfoService.getHardwareInfo();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_AI_EXECUTION_INFO, async () => {
    return performanceMonitor.getAIExecutionInfo();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PERFORMANCE_METRICS, async () => {
    return performanceMonitor.getPerformanceMetrics();
  });

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_START_BENCHMARK,
    async (_, tests?: BenchmarkTestType[]) => {
      return performanceMonitor.runBenchmark(tests, {
        pingBackend: async () => {
          const status = await aiBackendClient.getStatus();
          return status.status !== 'error';
        },
        testAiGeneration: async () => {
          const t0 = Date.now();
          const res = await aiBackendClient.sendChatMessage({
            query: 'Performance benchmark token velocity test',
            settings: { maxTokens: 64 },
            includeRagContext: false
          });
          const dur = Math.max(1, Date.now() - t0);
          return {
            durationMs: dur,
            tokens: res.completionTokens || 32,
            tokensPerSec: res.tokensPerSecond || Math.round((32 / (dur / 1000)) * 10) / 10
          };
        },
        testRagRetrieval: async () => {
          const t0 = Date.now();
          const activeProj = projectManager.getActiveProject();
          const items = await ragBackendClient.search({
            query: 'function component interface',
            projectId: activeProj?.id || 'default',
            limit: 5
          });
          const dur = Math.max(1, Date.now() - t0);
          performanceMonitor.recordRagRetrieval(dur);
          return {
            durationMs: dur,
            itemsFound: items.length
          };
        }
      });
    }
  );

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_BENCHMARK_HISTORY, async () => {
    return performanceMonitor.getBenchmarkHistory();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PERFORMANCE_CONFIG, async () => {
    return performanceMonitor.getPerformanceConfig();
  });

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_SAVE_PERFORMANCE_CONFIG,
    async (_, config: Partial<LocalAIPerformanceConfig>) => {
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid performance configuration object');
      }
      return performanceMonitor.savePerformanceConfig(config);
    }
  );

  // Integrated Terminal Execution Handler
  ipcMain.handle(
    IPC_CHANNELS.TERMINAL_EXECUTE,
    async (_, payload: { command: string; cwd?: string } | string) => {
      const command = typeof payload === 'string' ? payload : payload?.command || '';
      let cwd = typeof payload === 'object' && payload?.cwd ? payload.cwd : undefined;
      if (!cwd) {
        const activeProj = projectManager.getActiveProject();
        cwd = activeProj?.path || process.cwd();
      }

      if (!command || !command.trim()) {
        return { success: true, stdout: '', stderr: '', exitCode: 0 };
      }

      return new Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }>((resolve) => {
        exec(command, { cwd, timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              stdout: stdout || '',
              stderr: stderr || error.message,
              exitCode: error.code || 1
            });
          } else {
            resolve({
              success: true,
              stdout: stdout || '',
              stderr: stderr || '',
              exitCode: 0
            });
          }
        });
      });
    }
  );

  // ==================================================
  // PHASE 12.1: ADVANCED PROJECT INTELLIGENCE HANDLERS
  // ==================================================

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_GET_HEALTH,
    async (_, payload: { projectId?: string; projectPath?: string } = {}) => {
      return projectIntelligenceService.getHealthReport(payload.projectId, payload.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_GET_ARCHITECTURE,
    async (_, payload: { projectId?: string } = {}) => {
      return projectIntelligenceService.getArchitectureMap(payload.projectId);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_SMART_SEARCH,
    async (_, payload: { query: string; projectId?: string; projectPath?: string }) => {
      return projectIntelligenceService.smartSearch(payload.query || '', payload.projectId, payload.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_GET_ONBOARDING,
    async (_, payload: { projectId?: string; projectPath?: string } = {}) => {
      return projectIntelligenceService.getOnboardingData(payload.projectId, payload.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_ANALYZE_IMPACT,
    async (_, payload: { targetPath: string; symbolName?: string; projectId?: string }) => {
      return projectIntelligenceService.analyzeImpact(payload.targetPath, payload.symbolName, payload.projectId);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_ANALYZE_TEST_COVERAGE,
    async (_, payload: { projectId?: string; projectPath?: string } = {}) => {
      return projectIntelligenceService.analyzeTestCoverage(payload.projectId, payload.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_ANALYZE_DOCS_HEALTH,
    async (_, payload: { projectId?: string; projectPath?: string } = {}) => {
      return projectIntelligenceService.analyzeDocsHealth(payload.projectId, payload.projectPath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_PLAN_REFACTOR,
    async (_, payload: { targetFile: string; goal: string; symbol?: string; projectId?: string }) => {
      return projectIntelligenceService.planRefactor(payload);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_DETECT_SIMILARITY,
    async (_, payload: { projectId?: string; threshold?: number } = {}) => {
      return projectIntelligenceService.detectSimilarity(payload.projectId, payload.threshold);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_GET,
    async (_, payload: { projectId?: string; category?: string; search?: string } = {}) => {
      return projectIntelligenceService.getKnowledgeNotes(payload.projectId, payload.category, payload.search);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_CREATE,
    async (_, note: any) => {
      return projectIntelligenceService.createKnowledgeNote(note);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_UPDATE,
    async (_, payload: { id: string; updates: any }) => {
      return projectIntelligenceService.updateKnowledgeNote(payload.id, payload.updates);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_DELETE,
    async (_, payload: { id: string }) => {
      return projectIntelligenceService.deleteKnowledgeNote(payload.id);
    }
  );

  // ==================================================
  // PHASE 12.2: LOCAL AI MODEL HUB HANDLERS
  // ==================================================

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_DISCOVER, async () => {
    return localModelDiscoveryService.discover();
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_GET_REGISTRY, async () => {
    return localModelDiscoveryService.getRegistry();
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_VALIDATE, async (_, payload: { modelId: string }) => {
    if (typeof payload?.modelId !== 'string') {
      return { modelId: '', isValid: false, status: 'Error', checks: [], errorMessage: 'modelId is required' };
    }
    return localModelDiscoveryService.validate(payload.modelId);
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_ACTIVATE, async (_, payload: { modelId: string }) => {
    if (typeof payload?.modelId !== 'string') {
      return { success: false, modelId: '', message: 'modelId is required' };
    }
    return localModelDiscoveryService.activate(payload.modelId);
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_DEACTIVATE, async () => {
    return localModelDiscoveryService.deactivate();
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_IMPORT, async (_, payload: { filePath: string; name?: string; provider?: string; endpointUrl?: string }) => {
    if (typeof payload?.filePath !== 'string' || !payload.filePath.trim()) {
      return { success: false, error: 'filePath is required' };
    }
    return localModelDiscoveryService.importModel({
      filePath: payload.filePath.trim(),
      name: payload.name,
      provider: payload.provider as any,
      endpointUrl: payload.endpointUrl
    });
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_REMOVE, async (_, payload: { modelId: string }) => {
    if (typeof payload?.modelId !== 'string') {
      return { success: false, message: 'modelId is required' };
    }
    return localModelDiscoveryService.removeModel(payload.modelId);
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_GET_SEARCH_PATHS, async () => {
    return localModelDiscoveryService.getSearchPaths();
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_ADD_SEARCH_PATH, async (_, payload: { dirPath: string }) => {
    if (typeof payload?.dirPath !== 'string' || !payload.dirPath.trim()) {
      return localModelDiscoveryService.getSearchPaths();
    }
    return localModelDiscoveryService.addSearchPath(payload.dirPath.trim());
  });

  ipcMain.handle(IPC_CHANNELS.MODEL_HUB_REMOVE_SEARCH_PATH, async (_, payload: { dirPath: string }) => {
    if (typeof payload?.dirPath !== 'string') {
      return localModelDiscoveryService.getSearchPaths();
    }
    return localModelDiscoveryService.removeSearchPath(payload.dirPath.trim());
  });
}


