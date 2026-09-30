/**
 * SnapDev AI - Preload Script
 * Safely bridges Electron Main IPC channels to Renderer window.electronAPI.
 * contextIsolation: true, nodeIntegration: false.
 * Extended for Phase 3 Code Intelligence.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import {
  AppSettings,
  ElectronAPI,
  SymbolSearchQuery,
  IndexProgress,
  ProjectIndexStatus
} from '../shared/types';

const electronAPI: ElectronAPI = {
  getBackendStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_BACKEND_STATUS),
  restartBackend: () => ipcRenderer.invoke(IPC_CHANNELS.RESTART_BACKEND),
  getAppSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_SETTINGS),
  updateAppSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_APP_SETTINGS, settings),

  selectProjectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_PROJECT_DIR),
  loadProject: (projectPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.LOAD_PROJECT, projectPath),
  loadDemoProject: () => ipcRenderer.invoke(IPC_CHANNELS.LOAD_DEMO_PROJECT),
  getRecentProjects: () => ipcRenderer.invoke(IPC_CHANNELS.GET_RECENT_PROJECTS),
  readProjectTree: (projectPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_PROJECT_TREE, projectPath),
  readProjectFile: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_PROJECT_FILE, filePath),
  writeProjectFile: (filePath: string, content: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.WRITE_PROJECT_FILE, filePath, content),
  createProjectFile: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_PROJECT_FILE, filePath),
  createProjectFolder: (folderPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_PROJECT_FOLDER, folderPath),
  deleteProjectItem: (itemPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_PROJECT_ITEM, itemPath),
  renameProjectItem: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.RENAME_PROJECT_ITEM, oldPath, newPath),

  getSystemInfo: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_INFO),

  // Phase 3: Code Parsing & Indexing
  startIndexing: (projectPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_START, projectPath),
  getIndexStatus: (projectId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_GET_STATUS, projectId),
  getProjectStatistics: (projectId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_GET_STATISTICS, projectId),
  getFileSymbols: (projectId: string, filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_GET_FILE_SYMBOLS, { projectId, filePath }),
  searchSymbols: (projectId: string, query: SymbolSearchQuery) =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_SEARCH_SYMBOLS, { projectId, query }),
  getSymbolContext: (projectId: string, symbolId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_GET_SYMBOL_CONTEXT, { projectId, symbolId }),

  onIndexProgress: (callback: (progress: IndexProgress) => void) => {
    const handler = (_: Electron.IpcRendererEvent, progress: IndexProgress) => {
      callback(progress);
    };
    ipcRenderer.on(IPC_CHANNELS.INDEX_PROGRESS_EVENT, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.INDEX_PROGRESS_EVENT, handler);
    };
  },

  onIndexStatusChange: (callback: (status: ProjectIndexStatus) => void) => {
    const handler = (_: Electron.IpcRendererEvent, status: ProjectIndexStatus) => {
      callback(status);
    };
    ipcRenderer.on(IPC_CHANNELS.INDEX_STATUS_EVENT, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.INDEX_STATUS_EVENT, handler);
    };
  },

  // Phase 4: Local RAG & Retrieval
  ragSearch: (query) => ipcRenderer.invoke(IPC_CHANNELS.RAG_SEARCH, query),
  ragGetContext: (query) => ipcRenderer.invoke(IPC_CHANNELS.RAG_GET_CONTEXT, query),
  ragGetStatus: (projectId) => ipcRenderer.invoke(IPC_CHANNELS.RAG_GET_STATUS, projectId),
  ragIndexProject: (projectId) => ipcRenderer.invoke(IPC_CHANNELS.RAG_INDEX_PROJECT, projectId),

  // Phase 5: Local AI Model & Chat
  aiGetStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AI_GET_STATUS),
  aiGetModelInfo: () => ipcRenderer.invoke(IPC_CHANNELS.AI_GET_MODEL),
  aiLoadModel: (req) => ipcRenderer.invoke(IPC_CHANNELS.AI_LOAD_MODEL, req),
  aiUnloadModel: () => ipcRenderer.invoke(IPC_CHANNELS.AI_UNLOAD_MODEL),
  aiSendMessage: (req) => ipcRenderer.invoke(IPC_CHANNELS.AI_CHAT, req),
  aiStopGeneration: () => ipcRenderer.invoke(IPC_CHANNELS.AI_STOP),

  // Phase 6: Safe Patch Management & Task History
  patchPreview: (patch) => ipcRenderer.invoke(IPC_CHANNELS.PATCH_PREVIEW, patch),
  patchApply: (patch) => ipcRenderer.invoke(IPC_CHANNELS.PATCH_APPLY, patch),
  patchReject: (patch) => ipcRenderer.invoke(IPC_CHANNELS.PATCH_REJECT, patch),
  patchRollback: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.PATCH_ROLLBACK, filePath),
  getTaskHistory: (projectId?: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_HISTORY_GET, projectId),
  addTaskHistory: (item) => ipcRenderer.invoke(IPC_CHANNELS.TASK_HISTORY_ADD, item),
  deleteTaskHistory: (id) => ipcRenderer.invoke(IPC_CHANNELS.TASK_HISTORY_DELETE, id),
  clearTaskHistory: (projectId?: string) => ipcRenderer.invoke(IPC_CHANNELS.TASK_HISTORY_CLEAR, projectId),

  // Phase 7: Git & Developer Tools
  gitGetRepoInfo: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_REPO_INFO, projectPath),
  gitInitRepo: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_INIT_REPO, projectPath),
  gitGetStatus: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STATUS, projectPath),
  gitGetDiff: (filePath?: string, isStaged?: boolean, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_DIFF, { filePath, isStaged, projectPath }),
  gitStageFile: (filePath: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_FILE, { filePath, projectPath }),
  gitUnstageFile: (filePath: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE_FILE, { filePath, projectPath }),
  gitStageAll: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_ALL, projectPath),
  gitUnstageAll: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE_ALL, projectPath),
  gitCommit: (message: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, { message, projectPath }),
  gitGetBranches: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCHES, projectPath),
  gitCheckoutBranch: (branchName: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CHECKOUT_BRANCH, { branchName, projectPath }),
  gitGetLog: (maxCount?: number, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_LOG, { maxCount, projectPath }),
  gitGetCommitDetails: (hash: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT_DETAILS, { hash, projectPath }),
  gitGetConflicts: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_CONFLICTS, projectPath),
  gitGetDevToolsInfo: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_DEV_TOOLS_INFO, projectPath),
  gitGetProjectHealth: (projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_PROJECT_HEALTH, projectPath),

  // Phase 8: Snapdragon Optimisation & Performance
  getHardwareInfo: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_HARDWARE_INFO),
  getAIExecutionInfo: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_AI_EXECUTION_INFO),
  getPerformanceMetrics: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PERFORMANCE_METRICS),
  startBenchmark: (tests) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_START_BENCHMARK, tests),
  getBenchmarkHistory: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_BENCHMARK_HISTORY),
  savePerformanceConfig: (config) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SAVE_PERFORMANCE_CONFIG, config),
  getPerformanceConfig: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PERFORMANCE_CONFIG),

  // Integrated Terminal Execution
  terminalExecute: (command: string, cwd?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.TERMINAL_EXECUTE, { command, cwd }),

  // Phase 12.1: Advanced Project Intelligence
  intelligenceGetHealth: (projectId?: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_GET_HEALTH, { projectId, projectPath }),
  intelligenceGetArchitecture: (projectId?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_GET_ARCHITECTURE, { projectId }),
  intelligenceSmartSearch: (query: string, projectId?: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_SMART_SEARCH, { query, projectId, projectPath }),
  intelligenceGetOnboarding: (projectId?: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_GET_ONBOARDING, { projectId, projectPath }),
  intelligenceAnalyzeImpact: (targetPath: string, symbolName?: string, projectId?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_ANALYZE_IMPACT, { targetPath, symbolName, projectId }),
  intelligenceAnalyzeTestCoverage: (projectId?: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_ANALYZE_TEST_COVERAGE, { projectId, projectPath }),
  intelligenceAnalyzeDocsHealth: (projectId?: string, projectPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_ANALYZE_DOCS_HEALTH, { projectId, projectPath }),
  intelligencePlanRefactor: (req: { targetFile: string; goal: string; symbol?: string; projectId?: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_PLAN_REFACTOR, req),
  intelligenceDetectSimilarity: (projectId?: string, threshold?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_DETECT_SIMILARITY, { projectId, threshold }),
  intelligenceKnowledgeGet: (projectId?: string, category?: string, search?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_GET, { projectId, category, search }),
  intelligenceKnowledgeCreate: (note) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_CREATE, note),
  intelligenceKnowledgeUpdate: (id: string, updates) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_UPDATE, { id, updates }),
  intelligenceKnowledgeDelete: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INTELLIGENCE_KNOWLEDGE_DELETE, { id }),

  // Phase 12.2: Local AI Model Hub
  modelHubDiscover: () =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_DISCOVER),
  modelHubGetRegistry: () =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_GET_REGISTRY),
  modelHubValidate: (modelId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_VALIDATE, { modelId }),
  modelHubActivate: (modelId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_ACTIVATE, { modelId }),
  modelHubDeactivate: () =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_DEACTIVATE),
  modelHubImport: (req) =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_IMPORT, req),
  modelHubRemove: (modelId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_REMOVE, { modelId }),
  modelHubGetSearchPaths: () =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_GET_SEARCH_PATHS),
  modelHubAddSearchPath: (dirPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_ADD_SEARCH_PATH, { dirPath }),
  modelHubRemoveSearchPath: (dirPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MODEL_HUB_REMOVE_SEARCH_PATH, { dirPath })
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} catch (error) {
  console.error('[Preload] Failed to expose electronAPI:', error);
}
