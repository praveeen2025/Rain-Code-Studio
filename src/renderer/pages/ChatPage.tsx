/**
 * SnapDev AI - Developer AI Workspace
 * Phase 6: Privacy-First On-Device AI Developer Copilot with Local AI & RAG.
 * Real local LLM inference via ModelManager + DeveloperService.
 * Features:
 *  1. Code explanation
 *  2. Bug/error analysis
 *  3. Code improvement suggestions
 *  4. Test generation
 *  5. Documentation generation
 *  6. Code review
 *  7. Safe diff preview
 *  8. Apply / Reject changes (AI never silently modifies files)
 *  9. AI task history
 * 10. Developer AI workspace (3-column layout)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Square,
  Folder,
  ExternalLink,
  Bot,
  User,
  Database,
  Code,
  Trash2,
  CheckCircle2,
  FileText,
  Bug,
  ShieldCheck,
  TestTube2,
  BookOpen,
  FileCode,
  History,
  AlertTriangle,
  Clock,
  X,
  FileQuestion
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { useChat } from '../hooks/useChat';
import { useTaskHistory } from '../stores/taskHistoryStore';
import { projectStore } from '../stores/projectStore';
import { DiffViewer } from '../components/DiffViewer';
import { QuickActionsBar } from '../components/QuickActionsBar';
import { ModelSelector } from '../components/ModelSelector';
import {
  TaskType,
  FilePatch,
  PatchResult,
  TaskHistoryItem,
  ExplanationResult,
  BugAnalysisResult,
  CodeReviewResult,
  TestGenerationResult,
  DocumentationResult,
  ImprovementResult
} from '../../shared/types';
import {
  explainCode,
  analyzeBug,
  improveCode,
  reviewCode,
  generateTests,
  generateDocs,
  generateChange
} from '../services/api';

interface ChatPageProps {
  onNavigateToFiles?: (filePath: string, lineRange?: { startLine: number; endLine: number }) => void;
  onNavigateToModelHub?: () => void;
}

type RightTab = 'diff' | 'findings' | 'sources';

export const ChatPage: React.FC<ChatPageProps> = ({ onNavigateToFiles, onNavigateToModelHub }) => {
  const {
    activeProject,
    selectedFile,
    selectedFileContent,
    selectedSymbolContext,
    ragStatus,
    refreshRagStatus,
    selectFileByPath
  } = useProject();

  const {
    messages,
    isGenerating: isChatGenerating,
    error: chatError,
    lastSources,
    lastGenerationMetrics,
    sendMessage,
    stopGeneration,
    clearChat
  } = useChat();

  const {
    tasks: taskHistory,
    activeTask,
    recordTask,
    updateTaskStatus,
    deleteTask,
    clearTasks,
    selectTask
  } = useTaskHistory(activeProject?.id);

  // Workspace Local State
  const [inputQuery, setInputQuery] = useState('');
  const [errorMessageInput, setErrorMessageInput] = useState('');
  const [showErrorDrawer, setShowErrorDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<RightTab>('findings');
  const [activeAction, setActiveAction] = useState<TaskType | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Structured Results State
  const [explanationData, setExplanationData] = useState<ExplanationResult | null>(null);
  const [bugData, setBugData] = useState<BugAnalysisResult | null>(null);
  const [reviewData, setReviewData] = useState<CodeReviewResult | null>(null);
  const [testData, setTestData] = useState<TestGenerationResult | null>(null);
  const [docData, setDocData] = useState<DocumentationResult | null>(null);
  const [improveData, setImproveData] = useState<ImprovementResult | null>(null);

  // Safe Diff & Patch State
  const [activePatch, setActivePatch] = useState<FilePatch | null>(null);
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);
  const [patchNotification, setPatchNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actionAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    refreshRagStatus();
  }, [activeProject?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatGenerating, isActionLoading]);

  // ==================================================
  // ACTION HANDLERS
  // ==================================================

  const handleQuickAction = async (action: TaskType) => {
    setActiveAction(action);
    setActionError(null);

    if (action === 'bug_analysis') {
      setShowErrorDrawer(true);
      return;
    }

    await executeDeveloperTask(action);
  };

  const executeDeveloperTask = async (
    action: TaskType,
    customErrorMessage?: string
  ) => {
    setIsActionLoading(true);
    setActionError(null);
    actionAbortController.current = new AbortController();

    const filePath = selectedFile?.path;
    const selectedCode = selectedFileContent || undefined;
    const symbolName = selectedSymbolContext?.symbol?.name;
    const projectId = activeProject?.id;

    try {
      const taskId = `task-${Date.now()}`;
      let taskSummary = '';
      let generatedPatch: FilePatch | null = null;

      switch (action) {
        case 'explain': {
          const res = await explainCode({
            projectId,
            filePath,
            selectedCode,
            symbolName,
            query: inputQuery || undefined
          });

          if (res.success && res.data) {
            setExplanationData(res.data);
            setActiveTab('findings');
            taskSummary = res.data.summary;

            await recordTask({
              id: taskId,
              timestamp: new Date().toISOString(),
              projectId,
              taskType: 'explain',
              userRequest: inputQuery || `Explain ${symbolName || selectedFile?.name || 'code'}`,
              selectedFile: filePath,
              selectedSymbol: symbolName,
              summary: res.data.summary,
              status: 'completed'
            });
          } else {
            setActionError(res.error || 'Failed to explain code');
          }
          break;
        }

        case 'bug_analysis': {
          const res = await analyzeBug({
            projectId,
            filePath,
            selectedCode,
            symbolName,
            errorMessage: customErrorMessage || errorMessageInput || undefined,
            query: inputQuery || undefined
          });

          if (res.success && res.data) {
            setBugData(res.data);
            setActiveTab('findings');
            taskSummary = res.data.summary;

            await recordTask({
              id: taskId,
              timestamp: new Date().toISOString(),
              projectId,
              taskType: 'bug_analysis',
              userRequest: customErrorMessage || inputQuery || `Analyze bug in ${selectedFile?.name || 'project'}`,
              selectedFile: filePath,
              selectedSymbol: symbolName,
              summary: `[${res.data.severity.toUpperCase()}] ${res.data.summary}`,
              status: 'completed'
            });
          } else {
            setActionError(res.error || 'Failed to analyze bug');
          }
          break;
        }

        case 'improve': {
          const res = await improveCode({
            projectId,
            filePath,
            selectedCode,
            symbolName,
            query: inputQuery || undefined
          });

          if (res.success && res.data) {
            setImproveData(res.data);
            taskSummary = res.data.summary;

            if (res.data.patch) {
              generatedPatch = res.data.patch;
              setActivePatch(res.data.patch);
              setActiveTab('diff');
            } else {
              setActiveTab('findings');
            }

            await recordTask({
              id: taskId,
              timestamp: new Date().toISOString(),
              projectId,
              taskType: 'improve',
              userRequest: inputQuery || `Improve ${symbolName || selectedFile?.name || 'code'}`,
              selectedFile: filePath,
              selectedSymbol: symbolName,
              summary: res.data.summary,
              status: 'completed',
              patch: generatedPatch
            });
          } else {
            setActionError(res.error || 'Failed to improve code');
          }
          break;
        }

        case 'review': {
          const res = await reviewCode({
            projectId,
            filePath,
            selectedCode,
            query: inputQuery || undefined
          });

          if (res.success && res.data) {
            setReviewData(res.data);
            setActiveTab('findings');
            taskSummary = res.data.summary;

            await recordTask({
              id: taskId,
              timestamp: new Date().toISOString(),
              projectId,
              taskType: 'review',
              userRequest: inputQuery || `Review ${selectedFile?.name || 'project'}`,
              selectedFile: filePath,
              selectedSymbol: symbolName,
              summary: `Review score: ${res.data.overallScore}/100 with ${res.data.findings.length} findings`,
              status: 'completed'
            });
          } else {
            setActionError(res.error || 'Failed to complete code review');
          }
          break;
        }

        case 'test_generation': {
          const res = await generateTests({
            projectId,
            filePath,
            selectedCode,
            symbolName,
            query: inputQuery || undefined
          });

          if (res.success && res.data) {
            setTestData(res.data);
            taskSummary = res.data.summary;

            // Generate patch for new or target test file
            if (res.data.target_file && res.data.generated_code) {
              const testPatch: FilePatch = {
                filePath: res.data.target_file,
                relativePath: res.data.target_file.replace(/\\/g, '/').split('/').slice(-2).join('/'),
                originalContent: '',
                originalContentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // sha256 of empty
                modifiedContent: res.data.generated_code,
                diff: `--- /dev/null\n+++ b/${res.data.target_file}\n@@ -0,0 +1,${res.data.generated_code.split('\n').length} @@\n${res.data.generated_code.split('\n').map((l) => `+${l}`).join('\n')}`,
                explanation: `Generated unit tests for ${symbolName || selectedFile?.name || 'module'} (${res.data.framework})`,
                status: 'pending'
              };
              generatedPatch = testPatch;
              setActivePatch(testPatch);
              setActiveTab('diff');
            } else {
              setActiveTab('findings');
            }

            await recordTask({
              id: taskId,
              timestamp: new Date().toISOString(),
              projectId,
              taskType: 'test_generation',
              userRequest: inputQuery || `Generate tests for ${symbolName || selectedFile?.name || 'module'}`,
              selectedFile: filePath,
              selectedSymbol: symbolName,
              summary: `${res.data.framework} test suite: ${res.data.test_cases.length} test cases`,
              status: 'completed',
              patch: generatedPatch
            });
          } else {
            setActionError(res.error || 'Failed to generate tests');
          }
          break;
        }

        case 'documentation': {
          const res = await generateDocs({
            projectId,
            filePath,
            selectedCode,
            symbolName,
            query: inputQuery || undefined
          });

          if (res.success && res.data) {
            setDocData(res.data);
            setActiveTab('findings');
            taskSummary = res.data.summary;

            await recordTask({
              id: taskId,
              timestamp: new Date().toISOString(),
              projectId,
              taskType: 'documentation',
              userRequest: inputQuery || `Generate docs for ${symbolName || selectedFile?.name || 'module'}`,
              selectedFile: filePath,
              selectedSymbol: symbolName,
              summary: res.data.summary,
              status: 'completed'
            });
          } else {
            setActionError(res.error || 'Failed to generate documentation');
          }
          break;
        }
      }

      if (taskSummary) {
        setInputQuery('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    } finally {
      setIsActionLoading(false);
      actionAbortController.current = null;
    }
  };

  const handleGenerateFixForBug = async () => {
    if (!bugData || !selectedFile || !selectedFileContent) return;
    setIsActionLoading(true);
    setActionError(null);

    try {
      const res = await generateChange({
        projectId: activeProject?.id,
        filePath: selectedFile.path,
        query: `Fix bug: ${bugData.likely_cause}. Suggested fix: ${bugData.suggested_fix}`,
        selectedCode: selectedFileContent
      });

      if (res.success && res.data && res.data.patches.length > 0) {
        const patch = res.data.patches[0];
        patch.status = 'pending';
        setActivePatch(patch);
        setActiveTab('diff');

        await recordTask({
          id: `task-${Date.now()}`,
          timestamp: new Date().toISOString(),
          projectId: activeProject?.id,
          taskType: 'change',
          userRequest: `Fix bug in ${selectedFile.name}`,
          selectedFile: selectedFile.path,
          summary: res.data.summary,
          status: 'pending',
          patch
        });
      } else {
        setActionError(res.error || 'Failed to generate fix patch');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==================================================
  // SAFE APPLY / REJECT WORKFLOW
  // ==================================================

  const handleApplyPatch = async (patch: FilePatch): Promise<PatchResult | void> => {
    if (!window.electronAPI?.patchApply) return;
    setIsApplyingPatch(true);
    setPatchNotification(null);

    try {
      const result = await window.electronAPI.patchApply(patch);
      if (result.success) {
        const updatedPatch: FilePatch = { ...patch, status: 'applied' };
        setActivePatch(updatedPatch);

        // Update task history status
        if (activeTask) {
          await updateTaskStatus(activeTask.id, 'applied');
        }

        // If modified currently active file, refresh content in store
        if (selectedFile && patch.filePath === selectedFile.path) {
          await projectStore.selectFile(selectedFile);
        }

        setPatchNotification(`Changes applied cleanly to ${patch.relativePath}`);
      } else {
        setPatchNotification(`Apply blocked: ${result.message || result.error}`);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPatchNotification(`Apply error: ${msg}`);
    } finally {
      setIsApplyingPatch(false);
    }
  };

  const handleRejectPatch = async (patch: FilePatch) => {
    if (window.electronAPI?.patchReject) {
      await window.electronAPI.patchReject(patch);
    }

    const updatedPatch: FilePatch = { ...patch, status: 'rejected' };
    setActivePatch(updatedPatch);

    if (activeTask) {
      await updateTaskStatus(activeTask.id, 'rejected');
    }

    setPatchNotification(`Patch rejected. Zero modifications made.`);
  };

  const handleCancelActiveAction = () => {
    if (actionAbortController.current) {
      actionAbortController.current.abort();
      actionAbortController.current = null;
    }
    if (isChatGenerating) {
      stopGeneration();
    }
    setIsActionLoading(false);
    setActionError('Task cancelled by user.');
  };

  const handleSelectHistoryTask = (task: TaskHistoryItem) => {
    selectTask(task);
    if (task.patch) {
      setActivePatch(task.patch);
      setActiveTab('diff');
    }
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputQuery.trim();
    if (!clean || isChatGenerating || isActionLoading) return;

    setInputQuery('');
    await sendMessage(clean, activeProject?.id || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-ide-bg text-ide-text overflow-hidden select-none">
      {/* Top Workspace Header */}
      <div className="border-b border-ide-border bg-ide-sidebar/80 px-5 py-2.5 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-snap-crimson to-purple-600 shadow-md shadow-snap-crimson/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">Developer AI Workspace</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Phase 6 Active
              </span>
            </div>
            <p className="text-[11px] text-ide-muted">
              Privacy-First On-Device AI • Explain • Bug Analysis • Review • Safe Diff & Apply
            </p>
          </div>
        </div>

        {/* Global Model & RAG Status */}
        <div className="flex items-center gap-3">
          {lastGenerationMetrics && (
            <div className="text-[11px] font-mono text-ide-muted px-2 py-0.5 rounded bg-ide-bg border border-ide-border">
              {lastGenerationMetrics.generationTimeMs}ms
              {lastGenerationMetrics.tokensPerSecond ? ` • ${lastGenerationMetrics.tokensPerSecond.toFixed(1)} tok/s` : ''}
              {lastGenerationMetrics.accelerator ? ` • ${lastGenerationMetrics.accelerator}` : ''}
            </div>
          )}

          <ModelSelector onNavigateToModelHub={onNavigateToModelHub} />

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-ide-bg border border-ide-border text-xs">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-ide-muted font-mono">
              {ragStatus?.totalVectors ? `${ragStatus.totalVectors} vectors` : 'RAG Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ==================================================
            LEFT COLUMN: Context / File / Tasks History
            ================================================== */}
        <div className="w-64 border-r border-ide-border bg-ide-sidebar/40 flex flex-col shrink-0 overflow-hidden">
          {/* Active Context Card */}
          <div className="p-3 border-b border-ide-border/60 bg-ide-panel/40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ide-muted uppercase tracking-wider mb-2">
              <span>Active Context</span>
              {selectedFile && (
                <button
                  onClick={() => onNavigateToFiles?.(selectedFile.path)}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-0.5 text-[10px] lowercase font-normal"
                >
                  open <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {selectedFile ? (
              <div className="p-2.5 rounded-lg bg-ide-bg/80 border border-ide-border space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-white truncate">
                  <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <div className="text-[10px] text-ide-muted font-mono truncate">
                  {selectedFile.relativePath}
                </div>

                {selectedSymbolContext?.symbol && (
                  <div className="pt-1.5 border-t border-ide-border/50 flex items-center gap-1.5 text-[11px] text-purple-300">
                    <Code className="w-3 h-3 text-purple-400" />
                    <span className="font-mono text-[10px] truncate">
                      {selectedSymbolContext.symbol.kind} {selectedSymbolContext.symbol.name}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-ide-bg/40 border border-dashed border-ide-border text-center text-ide-muted text-[11px]">
                <Folder className="w-5 h-5 mx-auto mb-1 opacity-40 text-purple-400" />
                <p>No file selected</p>
                <p className="text-[10px] text-ide-muted/70 mt-0.5">Select a file in Explorer or ask a project question</p>
              </div>
            )}
          </div>

          {/* AI Task History Header */}
          <div className="px-3 py-2 border-b border-ide-border/60 flex items-center justify-between text-[11px] font-semibold text-ide-muted uppercase tracking-wider bg-ide-panel/20">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>Recent Tasks ({taskHistory.length})</span>
            </div>
            {taskHistory.length > 0 && (
              <button
                onClick={() => clearTasks()}
                title="Clear task history"
                className="text-ide-muted hover:text-rose-400 p-1 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* AI Task History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {taskHistory.length === 0 ? (
              <div className="p-4 text-center text-ide-muted text-xs">
                <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-purple-400" />
                <p className="text-[11px]">No tasks run yet</p>
                <p className="text-[10px] text-ide-muted/70 mt-0.5">Use Quick Actions to run AI tasks</p>
              </div>
            ) : (
              taskHistory.map((task) => {
                const isSelected = activeTask?.id === task.id;
                let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                if (task.taskType === 'bug_analysis') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                if (task.taskType === 'review') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                if (task.taskType === 'test_generation') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                if (task.taskType === 'improve') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                if (task.taskType === 'documentation') badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectHistoryTask(task)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-900/25 border-purple-500/60 shadow-sm'
                        : 'bg-ide-panel/60 hover:bg-ide-panel border-ide-border/60 hover:border-ide-border text-ide-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                        {task.taskType.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {task.status === 'applied' && (
                          <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" /> applied
                          </span>
                        )}
                        {task.status === 'rejected' && (
                          <span className="text-[9px] text-rose-400 flex items-center gap-0.5 font-medium">
                            <X className="w-2.5 h-2.5" /> rejected
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="text-ide-muted/50 hover:text-rose-400 p-0.5 rounded"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-white truncate line-clamp-1">
                      {task.userRequest}
                    </div>
                    <div className="text-[10px] text-ide-muted truncate mt-0.5">
                      {task.summary}
                    </div>
                    {task.patch && (
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-purple-300 font-mono">
                        <FileCode className="w-2.5 h-2.5" /> Diff patch available
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================
            CENTER COLUMN: Quick Actions & Conversation
            ================================================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-ide-bg overflow-hidden border-r border-ide-border">
          {/* Quick Actions Bar */}
          <div className="border-b border-ide-border/60 bg-ide-sidebar/50 px-4 py-2 flex items-center justify-between shrink-0">
            <QuickActionsBar
              onSelectAction={handleQuickAction}
              disabled={isActionLoading || isChatGenerating}
              activeAction={activeAction}
              hasFileSelected={Boolean(selectedFile)}
            />
          </div>

          {/* Bug Analysis Error Input Drawer (Collapsible) */}
          {showErrorDrawer && (
            <div className="p-3 bg-rose-950/20 border-b border-rose-500/30 shrink-0">
              <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-rose-300">
                <div className="flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bug / Stack Trace Input (Optional)</span>
                </div>
                <button
                  onClick={() => setShowErrorDrawer(false)}
                  className="text-rose-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={errorMessageInput}
                onChange={(e) => setErrorMessageInput(e.target.value)}
                placeholder="Paste error message, stack trace, or describe unexpected behavior..."
                className="w-full h-16 p-2 rounded-lg bg-ide-bg border border-rose-500/30 text-xs text-ide-text placeholder:text-ide-muted/50 font-mono resize-none focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowErrorDrawer(false)}
                  className="px-2.5 py-1 rounded text-xs text-ide-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowErrorDrawer(false);
                    executeDeveloperTask('bug_analysis', errorMessageInput);
                  }}
                  disabled={isActionLoading}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Bug className="w-3 h-3" />
                  Analyze Error
                </button>
              </div>
            </div>
          )}

          {/* Chat Error Alert */}
          {chatError && (
            <div className="m-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          {/* Action Notification Banner */}
          {patchNotification && (
            <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{patchNotification}</span>
              </div>
              <button
                onClick={() => setPatchNotification(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Action Error Alert */}
          {actionError && (
            <div className="m-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">AI Developer Action Notice</div>
                  <div className="text-[11px] text-rose-300/90 mt-0.5">{actionError}</div>
                </div>
              </div>
              <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-text">
            {messages.length === 0 && !isActionLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-ide-muted py-12">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-snap-crimson/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Rain Code Studio Developer Assistant</h2>
                <p className="text-xs text-ide-muted/80 max-w-sm mt-1 mb-4">
                  Select a code file and use quick actions above (Explain, Find Bug, Improve, Review, Tests, Docs) or ask any architectural question.
                </p>

                <div className="grid grid-cols-2 gap-2 max-w-md w-full text-left text-xs">
                  <button
                    onClick={() => handleQuickAction('explain')}
                    className="p-2.5 rounded-lg bg-ide-panel/80 hover:bg-ide-panel border border-ide-border hover:border-purple-500/40 text-ide-text transition-all flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Explain selected file</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction('bug_analysis')}
                    className="p-2.5 rounded-lg bg-ide-panel/80 hover:bg-ide-panel border border-ide-border hover:border-purple-500/40 text-ide-text transition-all flex items-center gap-2"
                  >
                    <Bug className="w-3.5 h-3.5 text-rose-400" />
                    <span>Analyze bugs or crashes</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction('test_generation')}
                    className="p-2.5 rounded-lg bg-ide-panel/80 hover:bg-ide-panel border border-ide-border hover:border-purple-500/40 text-ide-text transition-all flex items-center gap-2"
                  >
                    <TestTube2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate unit test suite</span>
                  </button>
                  <button
                    onClick={() => handleQuickAction('review')}
                    className="p-2.5 rounded-lg bg-ide-panel/80 hover:bg-ide-panel border border-ide-border hover:border-purple-500/40 text-ide-text transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Run AI code review</span>
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-purple-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 border shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-100 rounded-tr-sm'
                      : 'bg-ide-panel border-ide-border text-ide-text rounded-tl-sm'
                  }`}
                >
                  <pre className="font-sans whitespace-pre-wrap break-words">{msg.content}</pre>

                  {/* Assistant Footer Info */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-ide-border/40 flex items-center justify-between text-[10px] text-ide-muted">
                      <div className="flex items-center gap-2 font-mono">
                        {msg.generationTimeMs && (
                          <span>{(msg.generationTimeMs / 1000).toFixed(2)}s</span>
                        )}
                        {msg.tokensPerSecond && (
                          <span>{msg.tokensPerSecond.toFixed(1)} tok/s</span>
                        )}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <button
                          onClick={() => setActiveTab('sources')}
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <Database className="w-2.5 h-2.5" />
                          <span>{msg.sources.length} sources grounded</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-ide-muted" />
                  </div>
                )}
              </div>
            ))}

            {/* Active Action Loading Card */}
            {isActionLoading && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-ide-panel/80 border border-purple-500/30 text-xs">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white flex items-center gap-2">
                    <span>Local AI is generating {activeAction?.replace('_', ' ')}...</span>
                  </div>
                  <div className="text-[10px] text-ide-muted mt-0.5">
                    Analyzing code with local grounded RAG context • 100% on-device
                  </div>
                </div>
                <button
                  onClick={handleCancelActiveAction}
                  className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Input Console */}
          <div className="p-3 border-t border-ide-border bg-ide-sidebar/60">
            <form onSubmit={handleSendChat} className="relative">
              <textarea
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedFile
                    ? `Ask about ${selectedFile.name} or type instruction... (Enter to send)`
                    : 'Ask an architectural question or select a file for quick actions...'
                }
                rows={2}
                className="w-full px-3.5 py-2.5 pr-24 rounded-xl bg-ide-panel border border-ide-border text-xs text-white placeholder:text-ide-muted/60 focus:outline-none focus:border-purple-500 transition-colors resize-none font-sans"
              />

              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                {(isChatGenerating || isActionLoading) ? (
                  <button
                    type="button"
                    onClick={handleCancelActiveAction}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 shadow-md shadow-rose-900/30"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-900/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-center justify-between text-[10px] text-ide-muted mt-1.5 px-1">
              <span>Shift + Enter for new line • Enter to submit</span>
              {messages.length > 0 && (
                <button
                  onClick={() => clearChat()}
                  className="hover:text-rose-400 transition-colors"
                >
                  Clear chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            RIGHT COLUMN: Findings / Diff Preview / Sources
            ================================================== */}
        <div className="w-96 flex flex-col shrink-0 bg-ide-sidebar/30 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-ide-border bg-ide-sidebar/80 px-2 pt-2 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'findings'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-ide-muted hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Findings</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-all relative ${
                activeTab === 'diff'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-ide-muted hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Diff Preview</span>
              {activePatch && activePatch.status === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'sources'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-ide-muted hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sources</span>
            </button>
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {/* TAB: DIFF PREVIEW */}
            {activeTab === 'diff' && (
              <DiffViewer
                patch={activePatch}
                onApply={handleApplyPatch}
                onReject={handleRejectPatch}
                isApplying={isApplyingPatch}
              />
            )}

            {/* TAB: STRUCTURED FINDINGS */}
            {activeTab === 'findings' && (
              <div className="space-y-3">
                {/* 1. Bug Analysis Results Card */}
                {bugData && (
                  <div className="p-3.5 rounded-xl bg-ide-panel border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">Bug Analysis</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {bugData.severity}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-ide-muted uppercase mb-1">Likely Cause</div>
                      <p className="text-xs text-rose-200/90 leading-relaxed font-sans">{bugData.likely_cause}</p>
                    </div>

                    {bugData.evidence && (
                      <div>
                        <div className="text-[11px] font-semibold text-ide-muted uppercase mb-1">Evidence</div>
                        <pre className="p-2 rounded bg-ide-bg text-[10px] text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
                          {bugData.evidence}
                        </pre>
                      </div>
                    )}

                    <div>
                      <div className="text-[11px] font-semibold text-ide-muted uppercase mb-1">Suggested Fix</div>
                      <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">{bugData.suggested_fix}</p>
                    </div>

                    <button
                      onClick={handleGenerateFixForBug}
                      disabled={isActionLoading}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-snap-crimson to-purple-600 hover:from-rose-600 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Safe Diff Patch</span>
                    </button>
                  </div>
                )}

                {/* 2. Code Review Findings Card */}
                {reviewData && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-ide-panel border border-ide-border flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Code Review Summary</div>
                        <div className="text-[11px] text-ide-muted mt-0.5">{reviewData.summary}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-400 font-mono">
                          {reviewData.overallScore}/100
                        </div>
                        <div className="text-[9px] text-ide-muted uppercase">Health Score</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {reviewData.findings.map((finding, idx) => {
                        let badge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                        if (finding.severity === 'critical') badge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                        if (finding.severity === 'warning') badge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

                        return (
                          <div key={idx} className="p-2.5 rounded-lg bg-ide-panel/80 border border-ide-border space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${badge}`}>
                                {finding.severity} • {finding.category}
                              </span>
                              {finding.line && (
                                <span className="text-[10px] font-mono text-ide-muted">line {finding.line}</span>
                              )}
                            </div>
                            <p className="text-xs text-white">{finding.explanation}</p>
                            <p className="text-[11px] text-emerald-300/90 font-mono bg-emerald-950/20 p-1.5 rounded border border-emerald-500/20">
                              Suggestion: {finding.suggestion}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Test Generation Card */}
                {testData && (
                  <div className="p-3.5 rounded-xl bg-ide-panel border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TestTube2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          {testData.framework} Tests
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {testData.test_cases.length} tests
                      </span>
                    </div>

                    <p className="text-xs text-ide-muted">{testData.summary}</p>

                    <div className="space-y-1.5">
                      {testData.test_cases.map((tc, idx) => (
                        <div key={idx} className="p-2 rounded bg-ide-bg border border-ide-border/60 text-xs">
                          <div className="font-semibold text-white font-mono text-[11px]">{tc.name}</div>
                          <div className="text-[10px] text-ide-muted">{tc.description}</div>
                        </div>
                      ))}
                    </div>

                    {activePatch && (
                      <button
                        onClick={() => setActiveTab('diff')}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Preview Diff & Apply Tests</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 4. Documentation Card */}
                {docData && (
                  <div className="p-3.5 rounded-xl bg-ide-panel border border-cyan-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          Documentation ({docData.docType})
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-ide-muted">{docData.summary}</p>
                    <pre className="p-2.5 rounded-lg bg-ide-bg text-[11px] text-cyan-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-60 border border-ide-border">
                      {docData.generated_documentation}
                    </pre>
                  </div>
                )}

                {/* 5. Code Explanation Card */}
                {explanationData && (
                  <div className="p-3.5 rounded-xl bg-ide-panel border border-blue-500/30 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wide">Code Explanation</span>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-ide-muted uppercase mb-0.5">Summary</div>
                      <p className="text-xs text-white leading-relaxed">{explanationData.summary}</p>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-ide-muted uppercase mb-0.5">Purpose</div>
                      <p className="text-xs text-blue-200/90 leading-relaxed">{explanationData.purpose}</p>
                    </div>

                    {explanationData.key_components.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-ide-muted uppercase mb-1">Key Components</div>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-ide-text">
                          {explanationData.key_components.map((c, i) => (
                            <li key={i}><span className="font-mono text-[11px] text-purple-300">{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Improvement Card */}
                {improveData && (
                  <div className="p-3.5 rounded-xl bg-ide-panel border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                          Code Improvement ({improveData.category})
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white leading-relaxed">{improveData.summary}</p>
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans">{improveData.explanation}</p>
                    {improveData.suggested_code && (
                      <pre className="p-2.5 rounded-lg bg-ide-bg text-[11px] text-amber-100 font-mono whitespace-pre-wrap overflow-x-auto max-h-60 border border-ide-border">
                        {improveData.suggested_code}
                      </pre>
                    )}
                    {activePatch && (
                      <button
                        onClick={() => setActiveTab('diff')}
                        className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30 transition-all"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Preview Diff & Apply Improvement</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!bugData && !reviewData && !testData && !docData && !explanationData && !improveData && (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-ide-muted">
                    <FileQuestion className="w-8 h-8 mb-2 opacity-30 text-purple-400" />
                    <p className="text-xs font-medium">No active findings</p>
                    <p className="text-[10px] text-ide-muted/80 max-w-xs mt-1">
                      Execute Explain, Find Bug, Review, or Generate Tests from the Quick Actions toolbar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: RAG SOURCES */}
            {activeTab === 'sources' && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-ide-muted uppercase tracking-wider mb-1">
                  Grounded Sources ({lastSources.length})
                </div>

                {lastSources.length === 0 ? (
                  <div className="p-6 text-center text-ide-muted text-xs">
                    <Database className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-purple-400" />
                    <p>No RAG sources in current context</p>
                  </div>
                ) : (
                  lastSources.map((source, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        selectFileByPath(source.filePath, {
                          startLine: source.startLine,
                          endLine: source.endLine
                        });
                        onNavigateToFiles?.(source.filePath, {
                          startLine: source.startLine,
                          endLine: source.endLine
                        });
                      }}
                      className="p-2.5 rounded-lg bg-ide-panel/80 hover:bg-ide-panel border border-ide-border hover:border-purple-500/40 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white font-mono truncate">
                          {source.filePath.replace(/\\/g, '/').split('/').pop()}
                        </span>
                        <span className="text-[10px] font-mono text-purple-300">
                          L{source.startLine}-{source.endLine}
                        </span>
                      </div>
                      <div className="text-[10px] text-ide-muted font-mono truncate">
                        {source.filePath}
                      </div>
                      {source.snippet && (
                        <pre className="p-1.5 rounded bg-ide-bg text-[9px] text-gray-300 font-mono truncate overflow-hidden">
                          {source.snippet.slice(0, 100)}...
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
