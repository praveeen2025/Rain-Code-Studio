/**
 * SnapDev AI - Git & Developer Tools Page
 * Phase 7: Professional Git Intelligence and Developer Workflow.
 * 100% on-device, local, secure, and user-controlled.
 * AI never automatically commits, switches branches, or discards changes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  FolderGit2,
  Check,
  Database,
  Cpu,
  Activity,
  History,
  Terminal,
  Split,
  FileWarning
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import {
  GitRepositoryInfo,
  GitStatus,
  GitFileStatus,
  GitBranch,
  GitCommit,
  GitConflict,
  CommitMessageSuggestion,
  CommitAnalysis,
  CodeReviewResult,
  DeveloperToolsInfo,
  ProjectHealthSummary
} from '../../shared/types';
import { GitDiffViewer } from '../components/GitDiffViewer';
import { notificationStore } from '../stores/notificationStore';
import {
  generateCommitMessage,
  explainCommit,
  reviewCode
} from '../services/api';

type GitTab = 'changes' | 'history' | 'branches' | 'devtools';

export const GitPage: React.FC = () => {
  const { activeProject } = useProject();

  // Active view tab
  const [activeTab, setActiveTab] = useState<GitTab>('changes');

  // Git state
  const [repoInfo, setRepoInfo] = useState<GitRepositoryInfo | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commitLog, setCommitLog] = useState<GitCommit[]>([]);
  const [conflicts, setConflicts] = useState<GitConflict[]>([]);

  // Selected file and diff
  const [selectedFile, setSelectedFile] = useState<GitFileStatus | null>(null);
  const [activeDiff, setActiveDiff] = useState<string>('');
  const [isViewingStagedDiff, setIsViewingStagedDiff] = useState<boolean>(false);

  // Commit panel state
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitFeedback, setCommitFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // AI Assistance state
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiCommitSuggestion, setAiCommitSuggestion] = useState<CommitMessageSuggestion | null>(null);
  const [aiReviewResult, setAiReviewResult] = useState<CodeReviewResult | null>(null);
  const [aiCommitAnalysis, setAiCommitAnalysis] = useState<CommitAnalysis | null>(null);

  // History state
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null);
  const [selectedCommitDiff, setSelectedCommitDiff] = useState<string>('');
  const [selectedCommitFiles, setSelectedCommitFiles] = useState<string[]>([]);

  // Branch switching safety modal
  const [pendingBranchSwitch, setPendingBranchSwitch] = useState<string | null>(null);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState<boolean>(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  // Developer Tools & Health state
  const [devToolsInfo, setDevToolsInfo] = useState<DeveloperToolsInfo | null>(null);
  const [projectHealth, setProjectHealth] = useState<ProjectHealthSummary | null>(null);

  // Loading & refresh state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Load Git repository status and branch information.
   */
  const loadGitData = useCallback(async () => {
    if (!window.electronAPI) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const projectPath = activeProject?.path;
      const info = await window.electronAPI.gitGetRepoInfo(projectPath);
      setRepoInfo(info);

      if (info.isRepo) {
        const status = await window.electronAPI.gitGetStatus(projectPath);
        setGitStatus(status);

        const branchList = await window.electronAPI.gitGetBranches(projectPath);
        setBranches(branchList);

        const historyList = await window.electronAPI.gitGetLog(40, projectPath);
        setCommitLog(historyList);

        const conflictList = await window.electronAPI.gitGetConflicts(projectPath);
        setConflicts(conflictList);

        // Load default diff if no file selected
        if (!selectedFile) {
          const defaultDiff = await window.electronAPI.gitGetDiff(undefined, false, projectPath);
          setActiveDiff(defaultDiff);
        }
      }
    } catch (err: unknown) {
      console.error('[GitPage] Error loading git data:', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, selectedFile]);

  // Initial load and reload on project change
  useEffect(() => {
    loadGitData();
  }, [activeProject?.path]);

  // Load Developer Tools when switching to devtools tab
  useEffect(() => {
    if (activeTab === 'devtools' && window.electronAPI) {
      const projectPath = activeProject?.path;
      window.electronAPI
        .gitGetDevToolsInfo(projectPath)
        .then(setDevToolsInfo)
        .catch(console.error);

      window.electronAPI
        .gitGetProjectHealth(projectPath)
        .then(setProjectHealth)
        .catch(console.error);
    }
  }, [activeTab, activeProject?.path]);

  /**
   * Handle selecting a modified/staged file to inspect its diff.
   */
  const handleSelectFile = async (file: GitFileStatus) => {
    setSelectedFile(file);
    setIsViewingStagedDiff(file.staged);

    if (window.electronAPI) {
      try {
        const diff = await window.electronAPI.gitGetDiff(
          file.relativePath,
          file.staged,
          activeProject?.path
        );
        setActiveDiff(diff);
      } catch (err) {
        console.error('Failed to load file diff:', err);
      }
    }
  };

  /**
   * Toggle between staged diff and unstaged diff for selected file or whole repo.
   */
  const handleToggleStagedDiff = async () => {
    const nextStaged = !isViewingStagedDiff;
    setIsViewingStagedDiff(nextStaged);

    if (window.electronAPI) {
      try {
        const diff = await window.electronAPI.gitGetDiff(
          selectedFile?.relativePath,
          nextStaged,
          activeProject?.path
        );
        setActiveDiff(diff);
      } catch (err) {
        console.error('Failed to toggle diff mode:', err);
      }
    }
  };

  /**
   * Stage a file explicitly.
   */
  const handleStageFile = async (file: GitFileStatus) => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.gitStageFile(file.relativePath, activeProject?.path);
    if (res.success) {
      await loadGitData();
      if (selectedFile?.relativePath === file.relativePath) {
        handleSelectFile({ ...file, staged: true });
      }
    }
  };

  /**
   * Unstage a file explicitly.
   */
  const handleUnstageFile = async (file: GitFileStatus) => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.gitUnstageFile(file.relativePath, activeProject?.path);
    if (res.success) {
      await loadGitData();
      if (selectedFile?.relativePath === file.relativePath) {
        handleSelectFile({ ...file, staged: false });
      }
    }
  };

  /**
   * Stage all files explicitly.
   */
  const handleStageAll = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.gitStageAll(activeProject?.path);
    if (res.success) {
      await loadGitData();
    }
  };

  /**
   * Unstage all files explicitly.
   */
  const handleUnstageAll = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.gitUnstageAll(activeProject?.path);
    if (res.success) {
      await loadGitData();
    }
  };

  /**
   * Initialize Git repository explicitly.
   */
  const handleInitRepo = async () => {
    if (!window.electronAPI) return;
    const res = await window.electronAPI.gitInitRepo(activeProject?.path);
    if (res.success) {
      await loadGitData();
    }
  };

  /**
   * Generate conventional commit message with local AI.
   * AI DOES NOT COMMIT AUTOMATICALLY. User reviews and edits.
   */
  const handleGenerateCommitMessage = async () => {
    if (!window.electronAPI) return;
    setIsAiLoading(true);
    setAiCommitSuggestion(null);

    try {
      // 1. Fetch staged diff
      const stagedDiff = await window.electronAPI.gitGetDiff(undefined, true, activeProject?.path);

      if (!stagedDiff || !stagedDiff.trim()) {
        notificationStore.warning('No staged files', 'Please stage at least one file before generating an AI commit message.');
        setIsAiLoading(false);
        return;
      }

      // 2. Call local AI endpoint
      const res = await generateCommitMessage({
        stagedDiff,
        projectId: activeProject?.id,
        includeRagContext: true
      });

      if (res.success && res.data) {
        setAiCommitSuggestion(res.data);
        setCommitMessage(res.data.suggestedMessage);
        notificationStore.success('Commit Message Generated', res.data.conventionalType);
      } else {
        notificationStore.error('Commit Message Failed', res.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Commit message generation error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Commit staged changes explicitly.
   */
  const handleCommit = async () => {
    if (!window.electronAPI || !commitMessage.trim()) return;
    setIsCommitting(true);
    setCommitFeedback(null);

    try {
      const res = await window.electronAPI.gitCommit(commitMessage.trim(), activeProject?.path);
      if (res.success) {
        const hash = res.commitHash ? res.commitHash.slice(0, 7) : 'HEAD';
        setCommitFeedback({
          success: true,
          message: `Commit created cleanly: ${hash}`
        });
        notificationStore.success('Commit Created', hash);
        setCommitMessage('');
        setAiCommitSuggestion(null);
        await loadGitData();
        setTimeout(() => setCommitFeedback(null), 5000);
      } else {
        setCommitFeedback({
          success: false,
          message: res.error || 'Commit failed.'
        });
        notificationStore.error('Commit Failed', res.error || 'Unable to create commit');
      }
    } catch (err: unknown) {
      setCommitFeedback({
        success: false,
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsCommitting(false);
    }
  };

  /**
   * Review working tree or staged diff changes with local AI (Phase 6 Code Review Service reuse).
   */
  const handleReviewChanges = async () => {
    setIsAiLoading(true);
    setAiReviewResult(null);

    try {
      const diffToReview = activeDiff || (await window.electronAPI?.gitGetDiff(undefined, false, activeProject?.path)) || '';

      if (!diffToReview.trim()) {
        notificationStore.warning('No changes to review', 'No active unstaged or staged changes detected.');
        setIsAiLoading(false);
        return;
      }

      const res = await reviewCode({
        projectId: activeProject?.id,
        selectedCode: diffToReview,
        relativePath: selectedFile?.relativePath || 'git_diff',
        query: 'Review the git diff changes for correctness, security, and edge-case testing.',
        includeRagContext: true
      });

      if (res.success && res.data) {
        setAiReviewResult(res.data);
        notificationStore.success('Code Review Complete', `${res.data.findings.length} findings identified`);
      } else {
        notificationStore.error('Review Failed', res.error || 'Local AI unavailable');
      }
    } catch (err) {
      console.error('Review changes error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Select a commit from history log and view its diff & metadata.
   */
  const handleSelectCommit = async (commit: GitCommit) => {
    setSelectedCommit(commit);
    setAiCommitAnalysis(null);

    if (window.electronAPI) {
      try {
        const details = await window.electronAPI.gitGetCommitDetails(commit.hash, activeProject?.path);
        setSelectedCommitDiff(details.diff);
        setSelectedCommitFiles(details.files);
      } catch (err) {
        console.error('Failed to load commit details:', err);
      }
    }
  };

  /**
   * Explain selected commit with local AI.
   */
  const handleExplainCommit = async () => {
    if (!selectedCommit || !selectedCommitDiff) return;
    setIsAiLoading(true);

    try {
      const res = await explainCommit({
        hash: selectedCommit.hash,
        message: selectedCommit.message,
        author: selectedCommit.author,
        date: selectedCommit.date,
        diff: selectedCommitDiff,
        projectId: activeProject?.id,
        includeRagContext: true
      });

      if (res.success && res.data) {
        setAiCommitAnalysis(res.data);
        notificationStore.success('Commit Explained', selectedCommit.hash.slice(0, 7));
      } else {
        notificationStore.error('Commit Analysis Failed', res.error || 'Local AI unavailable');
      }
    } catch (err) {
      console.error('Explain commit error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Safe branch checkout workflow.
   */
  const handleInitiateBranchSwitch = (targetBranch: string) => {
    setBranchError(null);
    setPendingBranchSwitch(targetBranch);
  };

  const handleConfirmBranchSwitch = async () => {
    if (!pendingBranchSwitch || !window.electronAPI) return;
    setIsSwitchingBranch(true);
    setBranchError(null);

    try {
      const res = await window.electronAPI.gitCheckoutBranch(pendingBranchSwitch, activeProject?.path);
      if (res.success) {
        setPendingBranchSwitch(null);
        await loadGitData();
      } else {
        setBranchError(res.error || 'Branch switch blocked.');
      }
    } catch (err: unknown) {
      setBranchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: NON-GIT REPOSITORY VIEW
  // -------------------------------------------------------------
  if (repoInfo && !repoInfo.isRepo) {
    return (
      <div className="flex flex-col h-full bg-ide-bg p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto my-auto text-center bg-ide-panel border border-ide-border rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <FolderGit2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Git: Not a repository</h2>
          <p className="text-sm text-ide-muted mb-6 leading-relaxed">
            The active workspace <span className="text-white font-mono">{activeProject?.name || 'Project'}</span> is not currently initialized as a Git repository.
            You can continue developing normally, or initialize Git locally to enable staged diffs, branch tracking, and semantic commits.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleInitRepo}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-snap-crimson hover:bg-snap-crimson-hover text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-snap-crimson/20 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Initialize Git Repository
            </button>
            <button
              onClick={loadGitData}
              className="px-4 py-2.5 rounded-xl bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: FULL GIT WORKSPACE
  // -------------------------------------------------------------
  const stagedCount = gitStatus?.staged.length || 0;
  const unstagedCount = gitStatus?.unstaged.length || 0;
  const untrackedCount = gitStatus?.untracked.length || 0;
  const conflictedCount = gitStatus?.conflicted.length || 0;

  return (
    <div className="flex flex-col h-full bg-ide-bg select-none overflow-hidden">
      {/* Top Header & Repository Diagnostics Bar */}
      <header className="px-5 py-3 bg-ide-sidebar border-b border-ide-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <GitBranchIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">Git & Developer Tools</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Git: Connected
              </span>
              {gitStatus?.isClean ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                  Clean Working Tree
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                  {stagedCount + unstagedCount + untrackedCount} Changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-ide-muted mt-0.5 font-mono">
              <span className="flex items-center gap-1 text-white">
                <GitBranchIcon className="w-3.5 h-3.5 text-purple-400" />
                {repoInfo?.currentBranch || 'HEAD'}
              </span>
              {repoInfo?.repoRoot && (
                <span className="truncate max-w-sm text-ide-muted/70">
                  {repoInfo.repoRoot}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-ide-panel border border-ide-border">
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'changes'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-ide-muted hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              Changes
              {(stagedCount + unstagedCount + untrackedCount > 0) && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {stagedCount + unstagedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-ide-muted hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
              {commitLog.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {commitLog.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('branches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'branches'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-ide-muted hover:text-white'
              }`}
            >
              <GitBranchIcon className="w-3.5 h-3.5" />
              Branches
            </button>

            <button
              onClick={() => setActiveTab('devtools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'devtools'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-ide-muted hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Health & Tools
            </button>
          </div>

          <button
            onClick={loadGitData}
            title="Refresh Git status"
            disabled={isLoading}
            className="p-2 rounded-xl bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="px-4 py-2 bg-rose-500/15 border-b border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* ========================================================= */}
        {/* TAB 1: CHANGES VIEW                                       */}
        {/* ========================================================= */}
        {activeTab === 'changes' && (
          <div className="grid grid-cols-12 h-full overflow-hidden">
            {/* Left Column: File Groups & Commit Panel */}
            <div className="col-span-4 border-r border-ide-border flex flex-col h-full bg-ide-panel/50 overflow-hidden">
              {/* Conflicts Banner (Phase 7 Requirement 15) */}
              {conflictedCount > 0 && (
                <div className="m-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <FileWarning className="w-4 h-4 text-rose-400" />
                    <span>CONFLICT DETECTED ({conflictedCount} files)</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 mt-1">
                    Automatic resolution is disabled. Manual resolution required. Inspect files, resolve conflict markers, and stage them.
                  </p>
                  <div className="mt-2 space-y-1">
                    {conflicts.length > 0
                      ? conflicts.map((c) => (
                          <div
                            key={c.filePath}
                            className="p-1.5 rounded bg-rose-950/40 text-[11px] font-mono text-rose-300"
                          >
                            <div className="font-bold">{c.filePath}</div>
                            <div className="text-[10px] text-rose-400/80">{c.description}</div>
                          </div>
                        ))
                      : gitStatus?.conflicted.map((f) => (
                          <div
                            key={f.relativePath}
                            onClick={() => handleSelectFile(f)}
                            className="px-2 py-1 rounded bg-rose-950/40 text-[11px] font-mono cursor-pointer hover:bg-rose-950/60 truncate"
                          >
                            {f.relativePath}
                          </div>
                        ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="p-3 border-b border-ide-border flex items-center justify-between text-xs shrink-0">
                <span className="font-semibold text-white">Working Changes</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReviewChanges}
                    disabled={isAiLoading || (stagedCount === 0 && unstagedCount === 0)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
                    title="Run Phase 6 multi-dimensional AI code review on current diff"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Review Changes
                  </button>
                  <button
                    onClick={handleStageAll}
                    disabled={unstagedCount === 0 && untrackedCount === 0}
                    className="p-1.5 rounded-lg bg-ide-bg hover:bg-ide-hover text-ide-muted hover:text-white border border-ide-border disabled:opacity-40"
                    title="Stage All Files"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleUnstageAll}
                    disabled={stagedCount === 0}
                    className="p-1.5 rounded-lg bg-ide-bg hover:bg-ide-hover text-ide-muted hover:text-white border border-ide-border disabled:opacity-40"
                    title="Unstage All Files"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable File List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* 1. Staged Changes Section */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 px-1">
                    <span>Staged Changes ({stagedCount})</span>
                  </div>
                  {stagedCount === 0 ? (
                    <div className="text-[11px] text-ide-muted/70 italic px-2 py-1">
                      No files staged for commit
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {gitStatus?.staged.map((f) => (
                        <div
                          key={`staged-${f.relativePath}`}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group ${
                            selectedFile?.relativePath === f.relativePath && isViewingStagedDiff
                              ? 'bg-purple-950/40 border border-purple-500/40 text-white'
                              : 'hover:bg-ide-hover text-ide-text'
                          }`}
                          onClick={() => handleSelectFile(f)}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400">
                              {f.status.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="truncate font-mono">{f.relativePath}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstageFile(f);
                            }}
                            title="Unstage file"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-rose-300 transition-opacity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Unstaged Changes Section */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5 px-1">
                    <span>Changes ({unstagedCount})</span>
                  </div>
                  {unstagedCount === 0 ? (
                    <div className="text-[11px] text-ide-muted/70 italic px-2 py-1">
                      Working tree clean
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {gitStatus?.unstaged.map((f) => (
                        <div
                          key={`unstaged-${f.relativePath}`}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group ${
                            selectedFile?.relativePath === f.relativePath && !isViewingStagedDiff
                              ? 'bg-purple-950/40 border border-purple-500/40 text-white'
                              : 'hover:bg-ide-hover text-ide-text'
                          }`}
                          onClick={() => handleSelectFile(f)}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                              {f.status.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="truncate font-mono">{f.relativePath}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageFile(f);
                            }}
                            title="Stage file"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-500/20 text-emerald-300 transition-opacity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Untracked Files Section */}
                {untrackedCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-ide-muted uppercase tracking-wider mb-1.5 px-1">
                      <span>Untracked Files ({untrackedCount})</span>
                    </div>
                    <div className="space-y-1">
                      {gitStatus?.untracked.map((f) => (
                        <div
                          key={`untracked-${f.relativePath}`}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-ide-hover text-ide-muted hover:text-white transition-colors cursor-pointer group"
                          onClick={() => handleSelectFile(f)}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="text-[10px] font-mono px-1 rounded bg-ide-bg text-ide-muted">
                              ?
                            </span>
                            <span className="truncate font-mono">{f.relativePath}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageFile(f);
                            }}
                            title="Stage file"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-500/20 text-emerald-300 transition-opacity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Commit Creation Panel */}
              <div className="p-3 border-t border-ide-border bg-ide-sidebar/90 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Create Commit</span>
                  <button
                    onClick={handleGenerateCommitMessage}
                    disabled={isAiLoading || stagedCount === 0}
                    className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-40"
                    title="Generate Conventional Commit message from staged diff using Local AI"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Generate with AI
                  </button>
                </div>

                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder={
                    stagedCount === 0
                      ? 'Stage files first to author commit message...'
                      : 'feat(core): brief imperative commit message...'
                  }
                  rows={3}
                  className="w-full px-2.5 py-2 rounded-lg bg-ide-bg border border-ide-border text-white text-xs font-mono placeholder:text-ide-muted/50 focus:outline-none focus:border-purple-500/60 resize-none"
                />

                {aiCommitSuggestion && (
                  <div className="text-[11px] text-purple-300/90 bg-purple-950/30 p-2 rounded border border-purple-500/20">
                    <span className="font-semibold text-purple-200">AI Suggestion:</span> {aiCommitSuggestion.reasoning}
                  </div>
                )}

                {commitFeedback && (
                  <div
                    className={`text-xs p-2 rounded flex items-center gap-1.5 ${
                      commitFeedback.success
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {commitFeedback.success ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="truncate">{commitFeedback.message}</span>
                  </div>
                )}

                <button
                  onClick={handleCommit}
                  disabled={isCommitting || !commitMessage.trim() || stagedCount === 0}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition-all disabled:opacity-40"
                >
                  {isCommitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <GitCommitIcon className="w-4 h-4" />
                  )}
                  Commit Staged Changes ({stagedCount})
                </button>
              </div>
            </div>

            {/* Right Column: Unified Diff Viewer & AI Review Results */}
            <div className="col-span-8 flex flex-col h-full overflow-hidden p-3 gap-3">
              {/* Optional AI Review Results Box */}
              {aiReviewResult && (
                <div className="bg-ide-panel rounded-xl border border-purple-500/40 p-3 max-h-56 overflow-y-auto shrink-0 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">AI Diff Review (Phase 6 Service)</span>
                    </div>
                    <button
                      onClick={() => setAiReviewResult(null)}
                      className="text-xs text-ide-muted hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-xs text-ide-muted mb-2">{aiReviewResult.summary}</p>
                  <div className="space-y-1.5">
                    {aiReviewResult.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-ide-bg/80 border border-ide-border text-xs flex items-start gap-2"
                      >
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold shrink-0 ${
                            finding.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : finding.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium">{finding.explanation}</div>
                          {finding.suggestion && (
                            <div className="text-[11px] text-emerald-400 mt-0.5">
                              Suggestion: {finding.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Unified Diff Viewer */}
              <div className="flex-1 overflow-hidden">
                <GitDiffViewer
                  diffText={activeDiff}
                  filePath={selectedFile?.relativePath}
                  title={selectedFile ? selectedFile.relativePath : 'Repository Diff Overview'}
                  isStaged={isViewingStagedDiff}
                  onToggleStaged={handleToggleStagedDiff}
                  emptyMessage={
                    gitStatus?.isClean
                      ? 'Working tree clean. No active changes.'
                      : 'Select a modified file on the left to preview unified diff.'
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: COMMIT HISTORY VIEW                                */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-12 h-full overflow-hidden">
            {/* Commit Log List */}
            <div className="col-span-5 border-r border-ide-border flex flex-col h-full bg-ide-panel/50 overflow-hidden">
              <div className="p-3 border-b border-ide-border flex items-center justify-between text-xs shrink-0">
                <span className="font-semibold text-white">Repository Log ({commitLog.length})</span>
                <span className="text-[11px] text-ide-muted font-mono">Branch: {repoInfo?.currentBranch}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {commitLog.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ide-muted">No commit history found</div>
                ) : (
                  commitLog.map((commit) => (
                    <div
                      key={commit.hash}
                      onClick={() => handleSelectCommit(commit)}
                      className={`p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                        selectedCommit?.hash === commit.hash
                          ? 'bg-purple-950/40 border-purple-500/50 text-white shadow-md'
                          : 'bg-ide-bg/60 border-ide-border/50 text-ide-text hover:bg-ide-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-purple-300 font-semibold">{commit.shortHash}</span>
                        <span className="text-[10px] text-ide-muted font-mono">{commit.relativeDate}</span>
                      </div>
                      <div className="font-medium truncate text-white">{commit.message}</div>
                      <div className="flex items-center justify-between text-[11px] text-ide-muted mt-1">
                        <span className="truncate">{commit.author}</span>
                        {commit.refs && commit.refs.length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono truncate max-w-[120px]">
                            {commit.refs[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Commit Details & Diff */}
            <div className="col-span-7 flex flex-col h-full overflow-hidden p-3 gap-3">
              {selectedCommit ? (
                <>
                  {/* Commit Details Card */}
                  <div className="p-4 rounded-xl bg-ide-panel border border-ide-border shrink-0 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {selectedCommit.hash}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-2 leading-snug">
                          {selectedCommit.message}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-ide-muted mt-1 font-mono">
                          <span>Author: {selectedCommit.author}</span>
                          <span>Date: {selectedCommit.date}</span>
                          {selectedCommitFiles.length > 0 && (
                            <span className="text-purple-300">
                              {selectedCommitFiles.length} files modified
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleExplainCommit}
                        disabled={isAiLoading}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all shrink-0 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Explain Commit
                      </button>
                    </div>

                    {/* AI Explanation Box */}
                    {aiCommitAnalysis && (
                      <div className="mt-3 p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          AI Commit Analysis
                        </div>
                        <p className="text-ide-text">{aiCommitAnalysis.summary}</p>
                        {aiCommitAnalysis.mainChanges.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-purple-300">Main Changes:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-ide-muted mt-0.5">
                              {aiCommitAnalysis.mainChanges.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiCommitAnalysis.potentialImpact && (
                          <div className="text-[11px] text-ide-muted">
                            <span className="font-semibold text-purple-300">Potential Impact: </span>
                            {aiCommitAnalysis.potentialImpact}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Commit Unified Diff */}
                  <div className="flex-1 overflow-hidden">
                    <GitDiffViewer
                      diffText={selectedCommitDiff}
                      title={`Commit Diff: ${selectedCommit.shortHash}`}
                      emptyMessage="Loading commit diff..."
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-ide-muted bg-ide-panel rounded-xl border border-ide-border p-8">
                  <History className="w-10 h-10 mb-2 opacity-30 text-purple-400" />
                  <p className="text-sm font-medium">No Commit Selected</p>
                  <p className="text-xs text-ide-muted/80 max-w-xs mt-1">
                    Select a commit from the history list on the left to inspect its diff and run AI explanation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BRANCHES & SAFE SWITCHING                          */}
        {/* ========================================================= */}
        {activeTab === 'branches' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Branch Management</h2>
                <p className="text-xs text-ide-muted mt-0.5">
                  Inspect local and remote tracking branches. Safe branch switching checks for uncommitted changes before checkout.
                </p>
              </div>

              {/* Branch list table */}
              <div className="bg-ide-panel rounded-xl border border-ide-border overflow-hidden shadow-lg">
                <div className="p-3 bg-ide-sidebar border-b border-ide-border flex items-center justify-between text-xs font-semibold text-white">
                  <span>Available Branches ({branches.length})</span>
                  <span className="text-ide-muted font-mono">Current: {repoInfo?.currentBranch}</span>
                </div>

                <div className="divide-y divide-ide-border/50">
                  {branches.map((b) => (
                    <div
                      key={b.name}
                      className="p-4 flex items-center justify-between hover:bg-ide-hover/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            b.isCurrent
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-ide-bg text-ide-muted border border-ide-border'
                          }`}
                        >
                          <GitBranchIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">{b.name}</span>
                            {b.isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
                                ACTIVE
                              </span>
                            )}
                            {b.isRemote && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-ide-bg text-ide-muted font-mono">
                                REMOTE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ide-muted mt-1 font-mono">
                            <span>Commit: {b.commitHash}</span>
                            {b.upstream && <span>Upstream: {b.upstream}</span>}
                          </div>
                        </div>
                      </div>

                      {!b.isCurrent && (
                        <button
                          onClick={() => handleInitiateBranchSwitch(b.name)}
                          className="px-3 py-1.5 rounded-lg bg-ide-surface hover:bg-purple-600 hover:text-white border border-ide-border text-ide-text text-xs font-medium transition-all"
                        >
                          Switch to Branch
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DEVELOPER TOOLBOX & HEALTH SUMMARY                 */}
        {/* ========================================================= */}
        {activeTab === 'devtools' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Project Health Card */}
              {projectHealth && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-ide-panel to-ide-panel border border-purple-500/30 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">Project Health Overview</h2>
                        <p className="text-xs text-ide-muted">Continuous local diagnostics across Git, AST index, RAG, and AI subsystems.</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                        projectHealth.projectStatus === 'healthy'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {projectHealth.projectStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border">
                      <div className="text-ide-muted font-medium">Git Working State</div>
                      <div className="text-sm font-bold text-white font-mono mt-1 capitalize">
                        {projectHealth.gitStatus}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border">
                      <div className="text-ide-muted font-medium">Indexed Code Files</div>
                      <div className="text-sm font-bold text-purple-300 font-mono mt-1">
                        {projectHealth.indexedFiles} / {projectHealth.fileCount}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border">
                      <div className="text-ide-muted font-medium">Local RAG Status</div>
                      <div className="text-sm font-bold text-emerald-300 font-mono mt-1">
                        {projectHealth.ragIndexStatus}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border">
                      <div className="text-ide-muted font-medium">Local AI Model</div>
                      <div className="text-sm font-bold text-blue-300 font-mono mt-1">
                        {projectHealth.aiModelStatus}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostic Grid */}
              {devToolsInfo && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Environment & Hardware Card */}
                  <div className="p-4 rounded-xl bg-ide-panel border border-ide-border shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-white">Environment & Hardware</h3>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">Platform / OS</span>
                        <span className="text-white">{devToolsInfo.environment.platform} ({devToolsInfo.environment.arch})</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">Snapdragon PC</span>
                        <span className={devToolsInfo.environment.isSnapdragon ? 'text-emerald-400 font-bold' : 'text-ide-muted'}>
                          {devToolsInfo.environment.isSnapdragon ? 'Detected (Optimized)' : 'Standard Architecture'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">Node.js</span>
                        <span className="text-white">{devToolsInfo.environment.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">Electron</span>
                        <span className="text-white">{devToolsInfo.environment.electronVersion}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-ide-muted">Git CLI</span>
                        <span className="text-white">{devToolsInfo.environment.gitVersion || 'Installed'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Local Storage & SQLite Database Card */}
                  <div className="p-4 rounded-xl bg-ide-panel border border-ide-border shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white">Database & Vector Store</h3>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">SQLite Database</span>
                        <span className="text-emerald-400 font-bold">{devToolsInfo.database.status}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">RAG Vector Status</span>
                        <span className="text-white">{devToolsInfo.rag.status}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-ide-border/40">
                        <span className="text-ide-muted">Total Vectors</span>
                        <span className="text-white">{devToolsInfo.rag.totalVectors}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-ide-muted">Indexed Symbols</span>
                        <span className="text-white">{devToolsInfo.indexing.totalSymbols} symbols</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Logs & Subprocess Activity */}
              {devToolsInfo && (
                <div className="p-4 rounded-xl bg-ide-panel border border-ide-border shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white">Recent Git Subprocess & Desktop Activity</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0d1117] font-mono text-[11px] text-ide-muted max-h-48 overflow-y-auto space-y-1">
                    {devToolsInfo.logs.length === 0 ? (
                      <div>No logged actions yet.</div>
                    ) : (
                      devToolsInfo.logs.map((log, i) => (
                        <div key={i} className="text-gray-300">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Safe Branch Switching Confirmation Modal */}
      {pendingBranchSwitch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ide-panel border border-ide-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Safe Branch Switching</h3>
                <p className="text-xs text-ide-muted">Verify working tree state before switching branches.</p>
              </div>
            </div>

            <div className="text-xs text-ide-muted leading-relaxed">
              You are about to switch to branch <span className="text-white font-mono font-bold">{pendingBranchSwitch}</span>.
              {!gitStatus?.isClean && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200">
                  <span className="font-semibold">Notice:</span> You have uncommitted changes in your working tree.
                  Git will only allow checkout if these changes do not conflict with the destination branch.
                </div>
              )}
            </div>

            {branchError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {branchError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPendingBranchSwitch(null)}
                disabled={isSwitchingBranch}
                className="px-4 py-2 rounded-xl bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBranchSwitch}
                disabled={isSwitchingBranch}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all disabled:opacity-50"
              >
                {isSwitchingBranch ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
