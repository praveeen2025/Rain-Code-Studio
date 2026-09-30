/**
 * SnapDev AI - Core Shared Types
 * Used across Main, Preload, and Renderer processes.
 * Extended for Phase 3 Code Parsing and Local Indexing.
 */

export interface ProjectMetadata {
  language?: string;
  framework?: string;
  totalFiles: number;
  totalLines?: number;
  detectedConfigs: string[];
  lastIndexedAt?: string;
}

export interface ProjectFile {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  extension: string;
  children?: ProjectFile[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  isDemo: boolean;
  createdAt: string;
  lastOpened: string;
  fileCount: number;
  metadata?: ProjectMetadata;
}

export interface AppSettings {
  backendHost: string;
  backendPort: number;
  theme: 'dark' | 'light' | 'system';
  autoStartBackend: boolean;
  telemetryEnabled: false; // Privacy-first: strictly false
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  durationMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type CommandCategory = 'Navigation' | 'AI Copilot' | 'Git' | 'Project' | 'System' | 'View';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  shortcut?: string;
  action: () => void;
}

export type NavigationPage =
  | 'projects'
  | 'files'
  | 'intelligence'
  | 'chat'
  | 'analysis'
  | 'bugs'
  | 'tests'
  | 'docs'
  | 'git'
  | 'performance'
  | 'settings';

export type BackendConnectionStatus = 'connected' | 'starting' | 'error' | 'stopped';

export interface ProcessState {
  isRunning: boolean;
  pid: number | null;
  port: number;
  error: string | null;
  exitCode: number | null;
}

// ==================================================
// PHASE 3: CODE PARSING & STRUCTURAL INDEX TYPES
// ==================================================

export type SymbolKind =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'type'
  | 'enum'
  | 'variable'
  | 'constant'
  | 'module'
  | 'namespace'
  | 'constructor'
  | 'property'
  | 'struct'
  | 'trait';

export type ParseStatus = 'indexed' | 'partial' | 'error' | 'unsupported';

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  severity: 'warning' | 'error';
}

export interface CodeSymbol {
  id: string;
  name: string;
  kind: SymbolKind;
  language: string;
  filePath: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  parentSymbol?: string | null;
  signature?: string;
  documentation?: string;
  children?: CodeSymbol[];
}

export interface CodeImport {
  id: string;
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  line: number;
}

export interface CodeExport {
  id: string;
  name: string;
  kind: string;
  line: number;
  isDefault: boolean;
}

export interface ParsedFile {
  filePath: string;
  relativePath: string;
  language: string;
  lineCount: number;
  parseStatus: ParseStatus;
  parseErrors: ParseError[];
  symbols: CodeSymbol[];
  imports: CodeImport[];
  exports: CodeExport[];
  dependencies: string[];
}

export interface CodeChunk {
  id: string;
  projectId: string;
  fileId: string;
  symbolId?: string;
  content: string;
  language: string;
  filePath: string;
  relativePath?: string;
  startLine: number;
  endLine: number;
  symbolName?: string;
  symbolKind?: SymbolKind;
  parentSymbol?: string;
  imports?: string[];
  fileHash?: string;
  metadata?: Record<string, unknown>;
}

// ==================================================
// PHASE 4: LOCAL RAG & RETRIEVAL TYPES
// ==================================================

export type RAGSearchMode = 'hybrid' | 'semantic' | 'symbol' | 'file';

export interface RetrievalResult {
  resultId: string;
  chunkId: string;
  filePath: string;
  relativePath: string;
  symbolName?: string;
  symbolKind?: SymbolKind;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
  similarityScore: number;
  retrievalSources: string[];
  parentSymbol?: string;
}

export interface AIContextPackage {
  projectId: string;
  query: string;
  retrievalMode: string;
  totalChunks: number;
  totalCharacters: number;
  estimatedTokens: number;
  formattedPromptContext: string;
  chunks: RetrievalResult[];
  generationTimeMs: number;
}

export interface RAGStatusResponse {
  status: 'not_indexed' | 'indexing' | 'indexed' | 'updating' | 'error';
  projectId?: string;
  totalChunks: number;
  totalVectors: number;
  totalFiles: number;
  embeddingModel: string;
  embeddingDimension: number;
  embeddingDevice: string;
  lastIndexedAt?: string;
  indexSizeBytes: number;
  searchLatencyMs?: number;
  indexingTimeMs?: number;
}

export interface RAGSearchQuery {
  projectId: string;
  query: string;
  mode?: RAGSearchMode;
  limit?: number;
  filterKinds?: string[];
  filterLanguages?: string[];
}

export interface RAGContextQuery {
  projectId: string;
  query: string;
  mode?: RAGSearchMode;
  maxChunks?: number;
  maxCharacters?: number;
}

export type ProjectIndexStatus =
  | 'not_indexed'
  | 'indexing'
  | 'indexed'
  | 'updating'
  | 'partial'
  | 'error';

export interface IndexProgress {
  totalFiles: number;
  sourceFiles: number;
  parsedFiles: number;
  partialFiles: number;
  errorFiles: number;
  currentFile?: string;
}

export interface ProjectStatistics {
  totalFiles: number;
  sourceFiles: number;
  totalSymbols: number;
  functions: number;
  classes: number;
  interfaces: number;
  types: number;
  variables: number;
  imports: number;
  exports: number;
  parseErrors: number;
}

export interface SymbolSearchQuery {
  query: string;
  kind?: SymbolKind | 'all';
  language?: string;
  limit?: number;
}

export interface SymbolContextResult {
  symbol: CodeSymbol;
  content: string;
  startLine: number;
  endLine: number;
  filePath: string;
  relativePath: string;
}

// ==================================================
// PHASE 5: LOCAL AI MODEL & INFERENCE TYPES
// ==================================================

export type ModelStatus =
  | 'not_configured'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'stopping'
  | 'error'
  | 'unloading';

export interface AIHardwareInfo {
  device: string;
  runtime: string;
  accelerator: string;
  cpu: string;
  gpu: string;
  npu?: string | null;
  memoryTotalGb: number;
  memoryAvailableGb: number;
  isSnapdragonVerified: boolean;
}

export interface ModelInfo {
  modelName: string;
  modelVersion: string;
  modelFormat: string;
  quantization: string;
  contextLength: number;
  device: string;
  runtime: string;
  modelSizeBytes?: number | null;
  modelPath?: string | null;
  isLoaded: boolean;
  status: ModelStatus;
  hardwareInfo?: AIHardwareInfo | null;
}

export interface SourceReference {
  filePath: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  symbolName?: string | null;
  snippet?: string | null;
}

export type ChatMessageRole = 'user' | 'assistant' | 'system';
export type ChatMessageStatus = 'sending' | 'generating' | 'complete' | 'error' | 'cancelled';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
  sources?: SourceReference[];
  status?: ChatMessageStatus;
  error?: string | null;
  generationTimeMs?: number | null;
  tokensPerSecond?: number | null;
  totalTokens?: number | null;
}

export interface GenerationSettings {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  contextSize?: number;
  stream?: boolean;
}

export interface ChatRequest {
  projectId?: string | null;
  query: string;
  messages?: ChatMessage[];
  settings?: GenerationSettings;
  includeRagContext?: boolean;
  maxRagChunks?: number;
}

export interface ChatResponse {
  messageId: string;
  role: string;
  content: string;
  sources: SourceReference[];
  modelName: string;
  generationTimeMs: number;
  promptTokens?: number | null;
  completionTokens?: number | null;
  tokensPerSecond?: number | null;
  hardwareAccelerator?: string | null;
  ragChunksUsed: number;
}

export interface AIStatusResponse {
  status: ModelStatus;
  isLoaded: boolean;
  modelInfo: ModelInfo;
  currentTask?: string | null;
  activeRequests: number;
}

export interface LoadModelRequest {
  modelPath?: string;
  device?: string;
}

// ==================================================
// PHASE 6: DEVELOPER AI SCHEMAS & SAFE PATCH TYPES
// ==================================================

export interface CodeContextInput {
  projectId?: string | null;
  filePath?: string | null;
  relativePath?: string | null;
  symbolName?: string | null;
  selectedCode?: string | null;
  startLine?: number | null;
  endLine?: number | null;
  language?: string | null;
  query?: string | null;
  errorMessage?: string | null;
  stackTrace?: string | null;
  testFramework?: string | null;
  docType?: string | null;
  category?: string | null;
  includeRagContext?: boolean;
  maxRagChunks?: number;
}

export interface ExplanationResult {
  summary: string;
  purpose: string;
  key_components: string[];
  flow: string[];
  dependencies: string[];
  important_symbols: string[];
  assumptions: string[];
  sources: SourceReference[];
  generationTimeMs: number;
}

export interface BugAnalysisResult {
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  confidence: number;
  likely_cause: string;
  affected_files: string[];
  affected_symbols: string[];
  evidence: string[];
  suggested_fix: string;
  suggested_code?: string | null;
  sources: SourceReference[];
  generationTimeMs: number;
}

export interface CodeReviewFinding {
  severity: 'critical' | 'warning' | 'suggestion' | 'info';
  category: 'correctness' | 'maintainability' | 'security' | 'performance' | 'error_handling' | 'type_safety' | 'test_gap';
  file: string;
  line?: number | null;
  explanation: string;
  suggestion: string;
}

export interface CodeReviewResult {
  summary: string;
  overallScore: number;
  findings: CodeReviewFinding[];
  strengths: string[];
  sources: SourceReference[];
  generationTimeMs: number;
}

export interface TestCaseItem {
  name: string;
  description: string;
  type: string;
  code: string;
}

export interface TestGenerationResult {
  summary: string;
  framework: string;
  test_cases: TestCaseItem[];
  generated_code: string;
  assumptions: string[];
  target_file?: string | null;
  sources: SourceReference[];
  generationTimeMs: number;
}

export interface DocumentationResult {
  summary: string;
  docType: string;
  generated_documentation: string;
  documented_symbols: string[];
  assumptions: string[];
  target_file?: string | null;
  sources: SourceReference[];
  generationTimeMs: number;
}

export type TaskType =
  | 'explain'
  | 'bug_analysis'
  | 'improve'
  | 'review'
  | 'test_generation'
  | 'documentation'
  | 'change'
  | 'chat';

export interface FilePatch {
  filePath: string;
  relativePath: string;
  originalContent: string;
  originalContentHash: string;
  modifiedContent: string;
  diff: string;
  explanation: string;
  status?: 'pending' | 'applied' | 'rejected';
}

export interface ChangeResult {
  summary: string;
  files_changed: string[];
  patches: FilePatch[];
  warnings: string[];
  sources: SourceReference[];
  generationTimeMs: number;
}

export interface ImprovementResult {
  summary: string;
  category: string;
  explanation: string;
  suggested_code: string;
  diff?: string | null;
  patch?: FilePatch | null;
  sources: SourceReference[];
  generationTimeMs: number;
}

export interface PatchResult {
  success: boolean;
  message: string;
  filePath: string;
  previousHash?: string;
  newHash?: string;
  backupPath?: string;
  error?: string;
  staleConflict?: boolean;
}

export interface TaskHistoryItem {
  id: string;
  timestamp: string;
  projectId?: string | null;
  taskType: TaskType;
  userRequest: string;
  selectedFile?: string | null;
  selectedSymbol?: string | null;
  summary: string;
  status: 'applied' | 'rejected' | 'completed' | 'failed' | 'pending';
  patch?: FilePatch | null;
}

export interface ElectronAPI {
  // Process / Backend
  getBackendStatus: () => Promise<ProcessState>;
  restartBackend: () => Promise<{ success: boolean; message: string }>;
  getAppSettings: () => Promise<AppSettings>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;

  // Project Management
  selectProjectDirectory: () => Promise<string | null>;
  loadProject: (projectPath: string) => Promise<Project>;
  loadDemoProject: () => Promise<Project>;
  getRecentProjects: () => Promise<Project[]>;
  readProjectTree: (projectPath: string) => Promise<ProjectFile[]>;
  readProjectFile: (filePath: string) => Promise<string>;
  writeProjectFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  createProjectFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  createProjectFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  deleteProjectItem: (itemPath: string) => Promise<{ success: boolean; error?: string }>;
  renameProjectItem: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;

  // System & Environment
  getSystemInfo: () => Promise<{
    platform: string;
    arch: string;
    isSnapdragon: boolean;
    appVersion: string;
    electronVersion: string;
    nodeVersion: string;
  }>;

  // Phase 3: Code Parsing & Indexing
  startIndexing: (projectPath: string) => Promise<boolean>;
  getIndexStatus: (projectId: string) => Promise<ProjectIndexStatus>;
  getProjectStatistics: (projectId: string) => Promise<ProjectStatistics>;
  getFileSymbols: (projectId: string, filePath: string) => Promise<ParsedFile | null>;
  searchSymbols: (projectId: string, query: SymbolSearchQuery) => Promise<CodeSymbol[]>;
  getSymbolContext: (projectId: string, symbolId: string) => Promise<SymbolContextResult | null>;
  onIndexProgress: (callback: (progress: IndexProgress) => void) => () => void;
  onIndexStatusChange: (callback: (status: ProjectIndexStatus) => void) => () => void;

  // Phase 4: Local RAG & Retrieval
  ragSearch: (query: RAGSearchQuery) => Promise<RetrievalResult[]>;
  ragGetContext: (query: RAGContextQuery) => Promise<AIContextPackage>;
  ragGetStatus: (projectId?: string) => Promise<RAGStatusResponse>;
  ragIndexProject: (projectId: string) => Promise<{ success: boolean; vectorsCount: number; indexingTimeMs: number }>;

  // Phase 5: Local AI Model & Chat
  aiGetStatus: () => Promise<AIStatusResponse>;
  aiGetModelInfo: () => Promise<ModelInfo>;
  aiLoadModel: (req?: LoadModelRequest) => Promise<{ success: boolean; message: string; modelInfo: ModelInfo }>;
  aiUnloadModel: () => Promise<{ success: boolean; message: string }>;
  aiSendMessage: (req: ChatRequest) => Promise<ChatResponse>;
  aiStopGeneration: () => Promise<{ success: boolean; message: string }>;

  // Phase 6: Safe Patch Management & Task History
  patchPreview: (patch: FilePatch) => Promise<{ diff: string; canApplyCleanly: boolean; warning?: string }>;
  patchApply: (patch: FilePatch) => Promise<PatchResult>;
  patchReject: (patch: FilePatch) => Promise<{ success: boolean; message: string }>;
  patchRollback: (filePath: string) => Promise<PatchResult>;
  getTaskHistory: (projectId?: string) => Promise<TaskHistoryItem[]>;
  addTaskHistory: (item: TaskHistoryItem) => Promise<boolean>;
  deleteTaskHistory: (id: string) => Promise<boolean>;
  clearTaskHistory: (projectId?: string) => Promise<boolean>;

  // Phase 7: Git & Developer Tools
  gitGetRepoInfo: (projectPath?: string) => Promise<GitRepositoryInfo>;
  gitInitRepo: (projectPath?: string) => Promise<{ success: boolean; message: string }>;
  gitGetStatus: (projectPath?: string) => Promise<GitStatus>;
  gitGetDiff: (filePath?: string, isStaged?: boolean, projectPath?: string) => Promise<string>;
  gitStageFile: (filePath: string, projectPath?: string) => Promise<{ success: boolean; error?: string }>;
  gitUnstageFile: (filePath: string, projectPath?: string) => Promise<{ success: boolean; error?: string }>;
  gitStageAll: (projectPath?: string) => Promise<{ success: boolean; error?: string }>;
  gitUnstageAll: (projectPath?: string) => Promise<{ success: boolean; error?: string }>;
  gitCommit: (message: string, projectPath?: string) => Promise<{ success: boolean; commitHash?: string; error?: string }>;
  gitGetBranches: (projectPath?: string) => Promise<GitBranch[]>;
  gitCheckoutBranch: (branchName: string, projectPath?: string) => Promise<{ success: boolean; error?: string }>;
  gitGetLog: (maxCount?: number, projectPath?: string) => Promise<GitCommit[]>;
  gitGetCommitDetails: (hash: string, projectPath?: string) => Promise<{ commit: GitCommit; diff: string; files: string[] }>;
  gitGetConflicts: (projectPath?: string) => Promise<GitConflict[]>;
  gitGetDevToolsInfo: (projectPath?: string) => Promise<DeveloperToolsInfo>;
  gitGetProjectHealth: (projectPath?: string) => Promise<ProjectHealthSummary>;

  // Phase 8: Snapdragon Optimisation & Performance
  getHardwareInfo: () => Promise<HardwareInfo>;
  getAIExecutionInfo: () => Promise<AIExecutionInfo>;
  getPerformanceMetrics: () => Promise<PerformanceMetrics>;
  startBenchmark: (tests?: BenchmarkTestType[]) => Promise<BenchmarkRun>;
  getBenchmarkHistory: () => Promise<BenchmarkRun[]>;
  savePerformanceConfig: (config: Partial<LocalAIPerformanceConfig>) => Promise<LocalAIPerformanceConfig>;
  getPerformanceConfig: () => Promise<LocalAIPerformanceConfig>;

  // Integrated Terminal Execution
  terminalExecute: (command: string, cwd?: string) => Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }>;

  // Phase 12.1: Advanced Project Intelligence
  intelligenceGetHealth: (projectId?: string, projectPath?: string) => Promise<ProjectHealthReport>;
  intelligenceGetArchitecture: (projectId?: string) => Promise<ArchitectureMapData>;
  intelligenceSmartSearch: (query: string, projectId?: string, projectPath?: string) => Promise<SmartSearchResult>;
  intelligenceGetOnboarding: (projectId?: string, projectPath?: string) => Promise<ProjectOnboardingData>;
  intelligenceAnalyzeImpact: (targetPath: string, symbolName?: string, projectId?: string) => Promise<ImpactAnalysisResult>;
  intelligenceAnalyzeTestCoverage: (projectId?: string, projectPath?: string) => Promise<TestCoverageAnalysis>;
  intelligenceAnalyzeDocsHealth: (projectId?: string, projectPath?: string) => Promise<DocumentationHealthReport>;
  intelligencePlanRefactor: (req: { targetFile: string; goal: string; symbol?: string; projectId?: string }) => Promise<RefactoringPlan>;
  intelligenceDetectSimilarity: (projectId?: string, threshold?: number) => Promise<CodeSimilarityReport>;
  intelligenceKnowledgeGet: (projectId?: string, category?: string, search?: string) => Promise<ProjectKnowledgeNote[]>;
  intelligenceKnowledgeCreate: (note: Omit<ProjectKnowledgeNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectKnowledgeNote>;
  intelligenceKnowledgeUpdate: (id: string, updates: Partial<ProjectKnowledgeNote>) => Promise<ProjectKnowledgeNote>;
  intelligenceKnowledgeDelete: (id: string) => Promise<boolean>;

  // Phase 12.2: Local AI Model Hub
  modelHubDiscover: () => Promise<ModelDiscoveryResult>;
  modelHubGetRegistry: () => Promise<ModelRegistry>;
  modelHubValidate: (modelId: string) => Promise<ModelValidationResult>;
  modelHubActivate: (modelId: string) => Promise<ModelActivationResult>;
  modelHubDeactivate: () => Promise<{ success: boolean; message: string }>;
  modelHubImport: (req: ModelImportRequest) => Promise<{ success: boolean; model?: LocalModel; error?: string }>;
  modelHubRemove: (modelId: string) => Promise<{ success: boolean; message: string }>;
  modelHubGetSearchPaths: () => Promise<string[]>;
  modelHubAddSearchPath: (dirPath: string) => Promise<string[]>;
  modelHubRemoveSearchPath: (dirPath: string) => Promise<string[]>;
}

// ==================================================
// PHASE 7: GIT & DEVELOPER TOOLS TYPES
// ==================================================

export type GitFileStatusType =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'untracked'
  | 'conflicted';

export interface GitFileStatus {
  path: string;
  relativePath: string;
  status: GitFileStatusType;
  staged: boolean;
  oldPath?: string;
}

export interface GitStatus {
  isRepo: boolean;
  branch: string | null;
  isClean: boolean;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: GitFileStatus[];
  conflicted: GitFileStatus[];
  ahead: number;
  behind: number;
  isDetached?: boolean;
}

export interface GitRepositoryInfo {
  isRepo: boolean;
  repoRoot: string | null;
  currentBranch: string | null;
  isClean: boolean;
  changedFilesCount: number;
  isDetached: boolean;
  error?: string;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commitHash: string;
  upstream?: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  email: string;
  date: string;
  relativeDate?: string;
  refs?: string[];
}

export interface GitDiff {
  filePath: string;
  diff: string;
  additions: number;
  deletions: number;
  isStaged: boolean;
}

export interface GitConflict {
  filePath: string;
  status: string;
  ourChange?: string;
  theirChange?: string;
  description: string;
}

export interface CommitMessageRequest {
  stagedDiff: string;
  hint?: string;
  projectId?: string;
  includeRagContext?: boolean;
}

export interface CommitMessageSuggestion {
  suggestedMessage: string;
  shortSummary: string;
  conventionalType: string;
  scope?: string;
  reasoning: string;
  warnings?: string[];
  generationTimeMs?: number;
}

export interface ExplainCommitRequest {
  hash: string;
  message: string;
  author: string;
  date: string;
  diff: string;
  projectId?: string;
  includeRagContext?: boolean;
}

export interface CommitAnalysis {
  summary: string;
  filesAffected: string[];
  mainChanges: string[];
  potentialImpact: string;
  relatedSymbols: string[];
  confidence: number;
  generationTimeMs?: number;
}

export interface ProjectHealthSummary {
  projectStatus: 'healthy' | 'warning' | 'error' | 'no-project';
  gitStatus: 'connected' | 'not-a-repo' | 'dirty' | 'clean' | 'conflicted';
  fileCount: number;
  indexedFiles: number;
  parsedFiles: number;
  ragIndexStatus: string;
  aiModelStatus: string;
  testStatus?: string;
}

export interface DeveloperToolsInfo {
  project: {
    name: string;
    path: string;
    fileCount: number;
    isDemo: boolean;
    language?: string;
    framework?: string;
  };
  environment: {
    platform: string;
    arch: string;
    isSnapdragon: boolean;
    nodeVersion: string;
    electronVersion: string;
    gitVersion?: string;
  };
  git: GitRepositoryInfo;
  indexing: {
    status: string;
    totalFiles: number;
    indexedFiles: number;
    totalSymbols: number;
  };
  rag: {
    status: string;
    totalVectors: number;
    isReady: boolean;
  };
  ai: {
    status: string;
    activeModel: string;
    provider: string;
  };
  database: {
    status: string;
    path: string;
    sizeBytes?: number;
  };
  logs: string[];
}

// ==================================================
// PHASE 8: SNAPDRAGON OPTIMISATION & PERFORMANCE TYPES
// ==================================================

export type SnapdragonDetectionStatus =
  | 'Snapdragon Detected'
  | 'Snapdragon Not Detected'
  | 'Unknown';

export type AIExecutionProfile = 'CPU' | 'GPU' | 'NPU' | 'AUTO' | 'UNKNOWN';

export interface DeviceCapabilities {
  npuSupported: boolean;
  gpuAccelerationSupported: boolean;
  recommendedExecutionDevice: AIExecutionProfile;
  isArm64: boolean;
  thermalTelemetryAvailable: boolean;
  qualcommAiHubAvailable: boolean;
}

export interface HardwareInfo {
  cpuName: string;
  architecture: string;
  logicalCores: number;
  physicalCores: number | null;
  memoryTotal: number; // bytes
  memoryFree: number; // bytes
  operatingSystem: string;
  gpuName: string | null;
  npuAvailable: boolean;
  snapdragonDetected: SnapdragonDetectionStatus;
  qualcommDetected: boolean;
  detectionStatus: string;
  deviceCapabilities: DeviceCapabilities;
}

export interface AIExecutionInfo {
  runtime: string;
  model: string;
  modelFormat: string;
  executionDevice: AIExecutionProfile;
  actualDeviceUsed: string;
  cpuSupport: boolean;
  gpuSupport: boolean;
  npuSupport: boolean | 'Unknown';
  accelerationProvider: string;
  status: string;
  modelLoadTimeMs: number | null;
  firstTokenLatencyMs: number | null;
  generationTimeMs: number | null;
  tokensGenerated: number | null;
  tokensPerSecond: number | null;
  memoryUsageMb: number | null;
  snapdragonOptimized: boolean;
}

export interface ApplicationPerformanceMetrics {
  startupTimeMs: number | null;
  projectOpenTimeMs: number | null;
  projectScanTimeMs: number | null;
  indexBuildTimeMs: number | null;
}

export interface RAGPerformanceMetrics {
  indexingTimeMs: number | null;
  embeddingTimeMs: number | null;
  retrievalLatencyMs: number | null;
  contextConstructionTimeMs: number | null;
  indexedFilesCount: number;
  chunksCount: number;
  vectorCount: number;
}

export interface AIPerformanceMetrics {
  modelLoadTimeMs: number | null;
  firstResponseLatencyMs: number | null;
  totalGenerationTimeMs: number | null;
  tokensPerSecond: number | null;
  cancellationLatencyMs: number | null;
}

export interface GitPerformanceMetrics {
  repoDetectionTimeMs: number | null;
  statusRefreshTimeMs: number | null;
  diffCalculationTimeMs: number | null;
}

export interface SystemResourceMetrics {
  cpuUtilizationPercent: number | null;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  processMemoryBytes: number;
  aiProcessState: string;
  gpuUtilizationPercent: number | null;
  npuUtilizationPercent: number | null;
  thermalStatus: string;
}

export interface PerformanceMetrics {
  application: ApplicationPerformanceMetrics;
  rag: RAGPerformanceMetrics;
  ai: AIPerformanceMetrics;
  git: GitPerformanceMetrics;
  system: SystemResourceMetrics;
}

export type BenchmarkTestType =
  | 'model_load'
  | 'ai_generation'
  | 'rag_retrieval'
  | 'embedding_generation'
  | 'project_indexing';

export interface BenchmarkResult {
  test: BenchmarkTestType;
  name: string;
  durationMs: number;
  status: 'completed' | 'failed' | 'skipped';
  measuredResult: string;
  details?: Record<string, unknown>;
}

export interface BenchmarkRun {
  id: string;
  timestamp: string;
  hardwareSummary: string;
  model: string;
  runtime: string;
  executionDevice: string;
  results: BenchmarkResult[];
  overallStatus: 'completed' | 'partial' | 'failed';
  totalDurationMs: number;
}

export interface LocalAIPerformanceConfig {
  executionDevice: AIExecutionProfile;
  contextLength: number;
  maxTokens: number;
  temperature: number;
  batchSize: number;
  embeddingBatchSize: number;
  modelPath?: string;
  modelSelection?: string;
}

// ==================================================
// PHASE 12.1: PROJECT INTELLIGENCE TYPES
// ==================================================

export interface ProjectHealthReport {
  projectId: string;
  projectPath: string;
  timestamp: string;
  codeQuality: {
    totalFiles: number;
    totalLines: number;
    totalSymbols: number;
    syntaxErrorCount: number;
    parseStatus: 'healthy' | 'degraded' | 'unindexed';
  };
  testCoverage: {
    status: 'Not measured';
    explanation: string;
    detectedTestSourceFiles: number;
    testToSourceRatio: number;
    hasTestFramework: boolean;
    detectedFrameworks: string[];
  };
  documentationCoverage: {
    status: 'measured';
    hasReadme: boolean;
    readmePath?: string;
    totalDocFiles: number;
    documentedSymbolsCount: number;
    totalSymbolsCount: number;
    estimatedDocPercentage: number;
  };
  projectComplexity: {
    averageSymbolsPerFile: number;
    maxSymbolsInFile: { file: string; count: number };
    totalImports: number;
    circularImportsDetected: number;
  };
  gitStatus: {
    isRepo: boolean;
    branch: string | null;
    isClean: boolean;
    uncommittedChangesCount: number;
    aheadCount: number;
    behindCount: number;
  };
  dependencies: {
    manifestFound: boolean;
    manifestType?: 'package.json' | 'pyproject.toml' | 'requirements.txt' | 'Cargo.toml' | 'go.mod';
    directDependenciesCount: number;
    devDependenciesCount: number;
  };
  indexingHealth: {
    filesIndexed: number;
    symbolsIndexed: number;
    parseErrorsCount: number;
    isFresh: boolean;
    lastIndexedAt?: string;
  };
  ragHealth: {
    ragReady: boolean;
    chunksCount: number;
    embeddingModel: string;
    vectorStoreStatus: string;
  };
  aiReadiness: {
    isLocalAIOnline: boolean;
    activeProvider: string;
    modelAvailable: boolean;
    deviceProfile: string;
  };
}

export type ArchitectureNodeType = 'project' | 'directory' | 'file' | 'module' | 'class' | 'function' | 'interface';

export interface ArchitectureMapNode {
  id: string;
  label: string;
  type: ArchitectureNodeType;
  path: string;
  lineStart?: number;
  lineEnd?: number;
  symbolCount?: number;
  parentId?: string;
  details?: string;
}

export interface ArchitectureMapLink {
  source: string;
  target: string;
  type: 'contains' | 'imports' | 'calls' | 'extends';
}

export interface ArchitectureMapData {
  nodes: ArchitectureMapNode[];
  links: ArchitectureMapLink[];
  summary: {
    directoriesCount: number;
    filesCount: number;
    symbolsCount: number;
    importsCount: number;
  };
}

export interface SmartSearchResultItem {
  path: string;
  relativePath: string;
  symbolName?: string;
  kind?: string;
  lineStart?: number;
  lineEnd?: number;
  relevanceScore: number;
  selectionReason: string;
  previewSnippet: string;
  matchedVia: 'semantic_rag' | 'symbol_match' | 'filepath_match' | 'dependency_link';
}

export interface SmartSearchResult {
  query: string;
  timestamp: string;
  totalMatches: number;
  items: SmartSearchResultItem[];
}

export interface ProjectOnboardingData {
  projectId: string;
  projectPath: string;
  purpose: {
    summary: string;
    sourceReference?: string;
    isVerified: boolean;
  };
  entryPoints: Array<{
    path: string;
    reason: string;
    isVerified: boolean;
  }>;
  coreDirectories: Array<{
    name: string;
    path: string;
    role: string;
    isVerified: boolean;
  }>;
  importantFiles: Array<{
    path: string;
    role: string;
    isVerified: boolean;
  }>;
  coreModules: Array<{
    name: string;
    path: string;
    exportsCount: number;
    isVerified: boolean;
  }>;
  majorDependencies: Array<{
    name: string;
    category: 'runtime' | 'dev' | 'framework' | 'database' | 'ai' | 'unknown';
    isVerified: boolean;
  }>;
  dataFlowOverview: {
    description: string;
    isVerified: boolean;
    inferenceNotes?: string;
  };
  keySymbols: Array<{
    name: string;
    kind: string;
    file: string;
    line: number;
    role: string;
    isVerified: boolean;
  }>;
  testsStatus: {
    hasTests: boolean;
    testFilesCount: number;
    sampleTestFiles: string[];
    isVerified: boolean;
  };
  documentationStatus: {
    hasReadme: boolean;
    hasDocsDir: boolean;
    docFiles: string[];
    isVerified: boolean;
  };
  inferenceDisclaimer: string;
}

export interface ImpactAnalysisResult {
  targetPath: string;
  targetSymbol?: string;
  potentialScope: 'isolated' | 'moderate' | 'broad' | 'critical';
  directlyAffectedFiles: string[];
  detectedDependencies: Array<{
    file: string;
    relationship: 'imported_by' | 'imports_target' | 'calls_symbol';
    detail: string;
  }>;
  affectedSymbols: Array<{
    name: string;
    kind: string;
    file: string;
    line: number;
  }>;
  relevantTestFiles: string[];
  potentiallyAffectedDocs: string[];
  diffPreview?: string;
  disclaimer: string;
}

export interface TestCoverageCandidate {
  file: string;
  symbolName: string;
  kind: string;
  lineStart: number;
  existingTestReferences: string[];
  suggestedTests: string[];
  priority: 'high' | 'medium' | 'low';
  reason: string;
  generatedTestPreview?: string;
}

export interface TestCoverageAnalysis {
  projectPath: string;
  overallCoverageStatus: 'Not measured';
  coverageStatusExplanation: string;
  totalSymbolsChecked: number;
  uncoveredCandidatesCount: number;
  candidates: TestCoverageCandidate[];
}

export interface DocHealthItem {
  file: string;
  symbolName: string;
  kind: string;
  status: 'Documented' | 'Partially documented' | 'Potentially undocumented';
  hasDocstring: boolean;
  docstringSnippet?: string;
  line: number;
}

export interface DocumentationHealthReport {
  projectPath: string;
  readmeStatus: 'Documented' | 'Partially documented' | 'Potentially undocumented';
  readmePath?: string;
  docFilesFound: string[];
  totalPublicSymbols: number;
  documentedCount: number;
  partiallyDocumentedCount: number;
  undocumentedCount: number;
  documentationRatio: number;
  items: DocHealthItem[];
}

export interface RefactoringStep {
  stepNumber: number;
  title: string;
  description: string;
  affectedFiles: string[];
  potentialRisks: string[];
}

export interface RefactoringPlan {
  target: string;
  goal: string;
  timestamp: string;
  currentStructure: string;
  problemsAndObservations: string[];
  proposedSteps: RefactoringStep[];
  affectedFiles: string[];
  potentialRisks: string[];
  testingPlan: string[];
  documentationUpdates: string[];
  planningOnlyNotice: string;
}

export interface CodeSimilarityItem {
  fileA: string;
  fileB: string;
  symbolA: string;
  symbolB: string;
  similarityPercentage: number;
  linesA: [number, number];
  linesB: [number, number];
  snippetA: string;
  snippetB: string;
  similarityReason: string;
}

export interface CodeSimilarityReport {
  projectPath: string;
  threshold: number;
  totalSymbolsAnalyzed: number;
  potentialDuplicatesCount: number;
  pairs: CodeSimilarityItem[];
  notice: string;
}

export type KnowledgeCategory =
  | 'architecture'
  | 'development'
  | 'commands'
  | 'api'
  | 'conventions'
  | 'limitations'
  | 'general';

export interface ProjectKnowledgeNote {
  id: string;
  projectId: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  includeInRag: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================================================
// PHASE 12.2: LOCAL AI MODEL HUB TYPES
// ==================================================

export type LocalModelStatus =
  | 'Discovered'
  | 'Validated'
  | 'Ready'
  | 'Active'
  | 'Error'
  | 'Importing';

export type LocalModelFormat =
  | 'gguf'
  | 'safetensors'
  | 'onnx'
  | 'pytorch'
  | 'mlx'
  | 'openvino'
  | 'unknown';

export type LocalModelProvider =
  | 'ollama'
  | 'llamacpp'
  | 'huggingface'
  | 'lmstudio'
  | 'jan'
  | 'localai'
  | 'custom';

export interface LocalModelCapabilities {
  chat: boolean;
  completion: boolean;
  embedding: boolean;
  vision: boolean;
  functionCalling: boolean;
}

export interface LocalModelHardwareRequirements {
  minRamMb: number;
  recommendedRamMb: number;
  gpuSupported: boolean;
  npuSupported: boolean;
  estimatedVramMb?: number;
}

export interface LocalModel {
  id: string;                          // Unique stable ID (hash of path)
  name: string;                        // Human-readable display name
  family: string;                      // e.g. "Llama", "Mistral", "Qwen"
  version: string;                     // e.g. "3.1", "7B-q4"
  format: LocalModelFormat;
  quantization: string;                // e.g. "q4_k_m", "fp16", "int8"
  contextLength: number;
  parameterCount: string;              // e.g. "7B", "13B", "70B"
  filePath: string;                    // Absolute path to model file/dir
  fileSize: number;                    // bytes
  provider: LocalModelProvider;        // Which local runtime serves this
  status: LocalModelStatus;
  capabilities: LocalModelCapabilities;
  hardware: LocalModelHardwareRequirements;
  discoveredAt: string;                // ISO timestamp
  lastValidatedAt?: string;
  errorMessage?: string;
  tags: string[];
  isImported: boolean;                 // true = user manually imported
  endpointUrl?: string;                // e.g. ollama http://localhost:11434
}

export interface ModelRegistry {
  models: LocalModel[];
  activeModelId: string | null;
  lastDiscoveryAt: string | null;
  searchPaths: string[];
  discoveryStats: {
    totalScanned: number;
    discovered: number;
    errors: number;
    durationMs: number;
  };
}

export interface ModelDiscoveryResult {
  success: boolean;
  registry: ModelRegistry;
  newModels: LocalModel[];
  errors: string[];
  durationMs: number;
}

export interface ModelValidationResult {
  modelId: string;
  isValid: boolean;
  status: LocalModelStatus;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
  errorMessage?: string;
}

export interface ModelActivationResult {
  success: boolean;
  modelId: string;
  message: string;
  previousActiveModelId?: string;
}

export interface ModelImportRequest {
  filePath: string;
  name?: string;
  provider?: LocalModelProvider;
  endpointUrl?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}


