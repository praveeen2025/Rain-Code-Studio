/**
 * Rain Code Studio - Shared Constants
 */

export const APP_NAME = 'Rain Code Studio';
export const APP_TAGLINE = 'Privacy-First On-Device AI Developer Copilot';
export const APP_VERSION = '0.10.0';
export const APP_PHASE = 'Phase 10 - Testing, Security, Reliability & Production Readiness';

export const DEFAULT_BACKEND_HOST = '127.0.0.1';
export const DEFAULT_BACKEND_PORT = 8765;
export const DEFAULT_BACKEND_URL = `http://${DEFAULT_BACKEND_HOST}:${DEFAULT_BACKEND_PORT}`;

export const HEALTH_CHECK_INTERVAL_MS = 5000;
export const HEALTH_CHECK_TIMEOUT_MS = 3000;
export const BACKEND_START_TIMEOUT_MS = 20000;

export const IPC_CHANNELS = {
  GET_BACKEND_STATUS: 'backend:get-status',
  RESTART_BACKEND: 'backend:restart',
  GET_APP_SETTINGS: 'settings:get',
  UPDATE_APP_SETTINGS: 'settings:update',
  SELECT_PROJECT_DIR: 'project:select-dir',
  LOAD_PROJECT: 'project:load',
  LOAD_DEMO_PROJECT: 'project:load-demo',
  GET_RECENT_PROJECTS: 'project:get-recents',
  READ_PROJECT_TREE: 'project:read-tree',
  READ_PROJECT_FILE: 'project:read-file',
  WRITE_PROJECT_FILE: 'project:write-file',
  CREATE_PROJECT_FILE: 'project:create-file',
  CREATE_PROJECT_FOLDER: 'project:create-folder',
  DELETE_PROJECT_ITEM: 'project:delete-item',
  RENAME_PROJECT_ITEM: 'project:rename-item',
  GET_SYSTEM_INFO: 'system:get-info',

  // Phase 3: Code Parsing & Indexing
  INDEX_START: 'index:start',
  INDEX_GET_STATUS: 'index:get-status',
  INDEX_GET_STATISTICS: 'index:get-statistics',
  INDEX_GET_FILE_SYMBOLS: 'index:get-file-symbols',
  INDEX_SEARCH_SYMBOLS: 'index:search-symbols',
  INDEX_GET_SYMBOL_CONTEXT: 'index:get-symbol-context',
  INDEX_PROGRESS_EVENT: 'index:progress-event',
  INDEX_STATUS_EVENT: 'index:status-event',

  // Phase 4: Local RAG & Retrieval
  RAG_SEARCH: 'rag:search',
  RAG_GET_CONTEXT: 'rag:get-context',
  RAG_GET_STATUS: 'rag:get-status',
  RAG_INDEX_PROJECT: 'rag:index-project',

  // Phase 5: Local AI Model & Chat
  AI_GET_STATUS: 'ai:get-status',
  AI_GET_MODEL: 'ai:get-model',
  AI_LOAD_MODEL: 'ai:load-model',
  AI_UNLOAD_MODEL: 'ai:unload-model',
  AI_CHAT: 'ai:chat',
  AI_STOP: 'ai:stop',

  // Phase 6: Safe Patch Management & Task History
  PATCH_PREVIEW: 'patch:preview',
  PATCH_APPLY: 'patch:apply',
  PATCH_REJECT: 'patch:reject',
  PATCH_ROLLBACK: 'patch:rollback',
  TASK_HISTORY_GET: 'task-history:get',
  TASK_HISTORY_ADD: 'task-history:add',
  TASK_HISTORY_DELETE: 'task-history:delete',
  TASK_HISTORY_CLEAR: 'task-history:clear',

  // Phase 7: Git & Developer Tools
  GIT_GET_REPO_INFO: 'git:get-repo-info',
  GIT_INIT_REPO: 'git:init-repo',
  GIT_GET_STATUS: 'git:get-status',
  GIT_GET_DIFF: 'git:get-diff',
  GIT_STAGE_FILE: 'git:stage-file',
  GIT_UNSTAGE_FILE: 'git:unstage-file',
  GIT_STAGE_ALL: 'git:stage-all',
  GIT_UNSTAGE_ALL: 'git:unstage-all',
  GIT_COMMIT: 'git:commit',
  GIT_GET_BRANCHES: 'git:get-branches',
  GIT_CHECKOUT_BRANCH: 'git:checkout-branch',
  GIT_GET_LOG: 'git:get-log',
  GIT_GET_COMMIT_DETAILS: 'git:get-commit-details',
  GIT_GET_CONFLICTS: 'git:get-conflicts',
  GIT_GET_DEV_TOOLS_INFO: 'git:get-dev-tools-info',
  GIT_GET_PROJECT_HEALTH: 'git:get-project-health',

  // Phase 8: Snapdragon Optimisation & Performance
  SYSTEM_GET_HARDWARE_INFO: 'system:get-hardware-info',
  SYSTEM_GET_AI_EXECUTION_INFO: 'system:get-ai-execution-info',
  SYSTEM_GET_PERFORMANCE_METRICS: 'system:get-performance-metrics',
  SYSTEM_START_BENCHMARK: 'system:start-benchmark',
  SYSTEM_GET_BENCHMARK_HISTORY: 'system:get-benchmark-history',
  SYSTEM_GET_PERFORMANCE_CONFIG: 'system:get-performance-config',
  SYSTEM_SAVE_PERFORMANCE_CONFIG: 'system:save-performance-config',
  SYSTEM_GET_LOGS: 'system:get-logs',

  // Integrated Terminal Execution
  TERMINAL_EXECUTE: 'terminal:execute',

  // Phase 12.1: Advanced Project Intelligence
  INTELLIGENCE_GET_HEALTH: 'intelligence:get-health',
  INTELLIGENCE_GET_ARCHITECTURE: 'intelligence:get-architecture',
  INTELLIGENCE_SMART_SEARCH: 'intelligence:smart-search',
  INTELLIGENCE_GET_ONBOARDING: 'intelligence:get-onboarding',
  INTELLIGENCE_ANALYZE_IMPACT: 'intelligence:analyze-impact',
  INTELLIGENCE_ANALYZE_TEST_COVERAGE: 'intelligence:analyze-test-coverage',
  INTELLIGENCE_ANALYZE_DOCS_HEALTH: 'intelligence:analyze-docs-health',
  INTELLIGENCE_PLAN_REFACTOR: 'intelligence:plan-refactor',
  INTELLIGENCE_DETECT_SIMILARITY: 'intelligence:detect-similarity',
  INTELLIGENCE_KNOWLEDGE_GET: 'intelligence:knowledge-get',
  INTELLIGENCE_KNOWLEDGE_CREATE: 'intelligence:knowledge-create',
  INTELLIGENCE_KNOWLEDGE_UPDATE: 'intelligence:knowledge-update',
  INTELLIGENCE_KNOWLEDGE_DELETE: 'intelligence:knowledge-delete',

  // Phase 12.2: Local AI Model Hub
  MODEL_HUB_DISCOVER: 'model-hub:discover',
  MODEL_HUB_GET_REGISTRY: 'model-hub:get-registry',
  MODEL_HUB_VALIDATE: 'model-hub:validate',
  MODEL_HUB_ACTIVATE: 'model-hub:activate',
  MODEL_HUB_DEACTIVATE: 'model-hub:deactivate',
  MODEL_HUB_IMPORT: 'model-hub:import',
  MODEL_HUB_REMOVE: 'model-hub:remove',
  MODEL_HUB_GET_SEARCH_PATHS: 'model-hub:get-search-paths',
  MODEL_HUB_ADD_SEARCH_PATH: 'model-hub:add-search-path',
  MODEL_HUB_REMOVE_SEARCH_PATH: 'model-hub:remove-search-path'
} as const;

export interface NavItemConfig {
  id:
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
  label: string;
  phase: string;
  description: string;
}

export const NAVIGATION_ITEMS: readonly NavItemConfig[] = [
  {
    id: 'projects',
    label: 'Projects',
    phase: 'Phase 1 (Active)',
    description: 'Manage active workspaces, open folders, and demo projects'
  },
  {
    id: 'files',
    label: 'Files',
    phase: 'Phase 1 (Active)',
    description: 'Explore project directory structure and code files'
  },
  {
    id: 'intelligence',
    label: 'Project Intelligence',
    phase: 'Phase 12.1 (Active)',
    description: 'Health dashboard, architecture map, smart search, onboarding, impact, test coverage, doc health, refactoring, and local knowledge base'
  },
  {
    id: 'analysis',
    label: 'Code Analysis',
    phase: 'Phase 3 (Active)',
    description: 'Deep AST parsing, symbol indexing, and structural dependency graphs'
  },
  {
    id: 'chat',
    label: 'AI Workspace',
    phase: 'Phase 6 (Active)',
    description: 'Developer AI Copilot: explain, review, refactor, generate tests & safe diffs'
  },
  {
    id: 'bugs',
    label: 'Bugs',
    phase: 'Phase 6 (Active)',
    description: 'On-device automated bug detection, root cause analysis, and suggested fixes'
  },
  {
    id: 'tests',
    label: 'Tests',
    phase: 'Phase 6 (Active)',
    description: 'Automated unit test generation for Vitest, Jest, and Pytest with diff preview'
  },
  {
    id: 'docs',
    label: 'Documentation',
    phase: 'Phase 6 (Active)',
    description: 'Automated docstring, API reference, and markdown documentation generation'
  },
  {
    id: 'git',
    label: 'Git',
    phase: 'Phase 7 (Active)',
    description: 'Local git status, diff reviewer, smart commit message generation'
  },
  {
    id: 'performance',
    label: 'Performance',
    phase: 'Phase 8 (Active)',
    description: 'Qualcomm Snapdragon NPU/CPU telemetry and token inference metrics'
  },
  {
    id: 'settings',
    label: 'Settings',
    phase: 'Phase 1 (Active)',
    description: 'Configure local backend ports, paths, and developer preferences'
  }
] as const;

