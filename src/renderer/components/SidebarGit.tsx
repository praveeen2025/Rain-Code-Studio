/**
 * Rain Code Studio - Sidebar Source Control (Git) Panel
 * VS Code-style Git panel with staging, unstaging, commit creation, and file change lists.
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Check,
  Plus,
  Minus,
  RefreshCw,
  FolderGit2,
  Play
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { GitStatus, GitFileStatus } from '../../shared/types';
import { notificationStore } from '../stores/notificationStore';
import { FileIcon } from './FileIcon';

interface SidebarGitProps {
  onOpenFile: (filePath: string) => void;
  onOpenDiff?: (filePath: string) => void;
  onNavigateGitPage: () => void;
}

export const SidebarGit: React.FC<SidebarGitProps> = ({
  onOpenFile,
  onOpenDiff,
  onNavigateGitPage
}) => {
  const handleOpenFileOrDiff = (filePath: string) => {
    if (onOpenDiff) {
      onOpenDiff(filePath);
    } else {
      onOpenFile(filePath);
    }
  };
  const { activeProject } = useProject();
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const fetchStatus = async () => {
    if (!activeProject || !window.electronAPI) return;
    setIsLoading(true);
    try {
      const status = await window.electronAPI.gitGetStatus(activeProject.path);
      setGitStatus(status);
    } catch {
      setGitStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [activeProject?.id]);

  const handleStageFile = async (filePath: string) => {
    if (!activeProject || !window.electronAPI) return;
    try {
      const res = await window.electronAPI.gitStageFile(filePath, activeProject.path);
      if (res.success) {
        await fetchStatus();
      } else {
        notificationStore.error('Stage failed', res.error || 'Could not stage file');
      }
    } catch (err: unknown) {
      notificationStore.error('Stage error', String(err));
    }
  };

  const handleUnstageFile = async (filePath: string) => {
    if (!activeProject || !window.electronAPI) return;
    try {
      const res = await window.electronAPI.gitUnstageFile(filePath, activeProject.path);
      if (res.success) {
        await fetchStatus();
      } else {
        notificationStore.error('Unstage failed', res.error || 'Could not unstage file');
      }
    } catch (err: unknown) {
      notificationStore.error('Unstage error', String(err));
    }
  };

  const handleStageAll = async () => {
    if (!activeProject || !window.electronAPI) return;
    try {
      const res = await window.electronAPI.gitStageAll(activeProject.path);
      if (res.success) {
        notificationStore.info('Staged all changes');
        await fetchStatus();
      }
    } catch (err: unknown) {
      notificationStore.error('Stage all error', String(err));
    }
  };

  const handleUnstageAll = async () => {
    if (!activeProject || !window.electronAPI) return;
    try {
      const res = await window.electronAPI.gitUnstageAll(activeProject.path);
      if (res.success) {
        notificationStore.info('Unstaged all changes');
        await fetchStatus();
      }
    } catch (err: unknown) {
      notificationStore.error('Unstage all error', String(err));
    }
  };

  const handleCommit = async () => {
    if (!activeProject || !commitMessage.trim() || !window.electronAPI || isCommitting) return;
    setIsCommitting(true);
    try {
      const res = await window.electronAPI.gitCommit(commitMessage.trim(), activeProject.path);
      if (res.success) {
        notificationStore.success('Committed successfully', res.commitHash ? `Hash: ${res.commitHash.slice(0, 7)}` : '');
        setCommitMessage('');
        await fetchStatus();
      } else {
        notificationStore.error('Commit failed', res.error || 'Ensure changes are staged');
      }
    } catch (err: unknown) {
      notificationStore.error('Commit error', String(err));
    } finally {
      setIsCommitting(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="p-4 text-center text-ide-muted text-xs">
        No active project workspace opened.
      </div>
    );
  }

  if (gitStatus && !gitStatus.isRepo) {
    return (
      <div className="p-4 text-center space-y-3 text-xs bg-ide-sidebar">
        <FolderGit2 className="w-8 h-8 text-ide-muted mx-auto" />
        <p className="text-ide-text">This workspace is not initialized as a Git repository.</p>
        <button
          onClick={async () => {
            if (window.electronAPI) {
              await window.electronAPI.gitInitRepo(activeProject.path);
              await fetchStatus();
              notificationStore.success('Git repository initialized');
            }
          }}
          className="w-full py-1.5 px-3 rounded bg-ide-accent hover:bg-sky-600 text-white font-medium text-xs shadow-xs transition"
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  const stagedFiles = gitStatus?.staged || [];
  const unstagedFiles = [...(gitStatus?.unstaged || []), ...(gitStatus?.untracked || [])];

  const renderStatusBadge = (status: GitFileStatus['status']) => {
    if (status === 'modified') return <span className="text-amber-500 font-bold text-[10px]">M</span>;
    if (status === 'added' || status === 'untracked') return <span className="text-emerald-500 font-bold text-[10px]">U</span>;
    if (status === 'deleted') return <span className="text-rose-500 font-bold text-[10px]">D</span>;
    return <span className="text-sky-500 font-bold text-[10px]">●</span>;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs bg-ide-sidebar select-none">
      {/* Branch & Actions Bar */}
      <div className="p-3 border-b border-ide-border flex items-center justify-between bg-ide-sidebar">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-ide-text-bright truncate">
          <GitBranch className="w-3.5 h-3.5 text-ide-accent shrink-0" />
          <span className="truncate font-semibold">{gitStatus?.branch || 'main'}</span>
        </div>

        <div className="flex items-center gap-1 text-ide-muted">
          <button
            onClick={fetchStatus}
            title="Refresh Status"
            className="p-1 hover:text-ide-text-bright rounded hover:bg-ide-hover transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateGitPage}
            title="Open Full Git Manager View"
            className="p-1 hover:text-ide-text-bright rounded hover:bg-ide-hover transition"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Commit Input Box */}
      <div className="p-3 border-b border-ide-border space-y-2 bg-ide-sidebar">
        <div className="relative">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleCommit();
              }
            }}
            placeholder="Message (Ctrl+Enter to commit)"
            rows={2}
            className="w-full bg-ide-surface border border-ide-border rounded p-2 text-xs text-ide-text placeholder:text-ide-muted/80 focus:outline-none focus:border-ide-accent resize-none font-sans"
          />
        </div>

        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim() || isCommitting || stagedFiles.length === 0}
          className={`w-full py-1.5 px-3 rounded text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition ${
            commitMessage.trim() && stagedFiles.length > 0 && !isCommitting
              ? 'bg-ide-accent hover:bg-sky-600 cursor-pointer'
              : 'bg-ide-accent/50 opacity-60 cursor-not-allowed'
          }`}
        >
          <Check className={`w-3.5 h-3.5 ${isCommitting ? 'animate-spin' : ''}`} />
          <span>Commit ({stagedFiles.length} staged)</span>
        </button>
      </div>

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ide-border/40">
        {/* Staged Changes Section */}
        <div>
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-ide-text hover:text-ide-text-bright uppercase tracking-wider bg-ide-surface/60">
            <span className="flex items-center gap-1.5">
              <span>Staged Changes</span>
              <span className="font-mono text-[10px] text-ide-muted font-normal">
                {stagedFiles.length}
              </span>
            </span>
            {stagedFiles.length > 0 && (
              <button
                onClick={handleUnstageAll}
                title="Unstage All Changes"
                className="p-0.5 hover:text-ide-text-bright text-ide-muted rounded hover:bg-ide-hover"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="py-0.5">
            {stagedFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleOpenFileOrDiff(file.path)}
                className="flex items-center justify-between px-3 py-1 text-ide-text hover:text-ide-text-bright hover:bg-ide-hover cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 truncate flex-1 font-mono text-[11px]">
                  <FileIcon fileName={file.relativePath} size={14} />
                  <span className="truncate">{file.relativePath}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {renderStatusBadge(file.status)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnstageFile(file.path);
                    }}
                    title="Unstage File"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-ide-text-bright text-ide-muted rounded hover:bg-ide-hover"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unstaged / Untracked Changes Section */}
        <div>
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-ide-text hover:text-ide-text-bright uppercase tracking-wider bg-ide-surface/60">
            <span className="flex items-center gap-1.5">
              <span>Changes</span>
              <span className="font-mono text-[10px] text-ide-muted font-normal">
                {unstagedFiles.length}
              </span>
            </span>
            {unstagedFiles.length > 0 && (
              <button
                onClick={handleStageAll}
                title="Stage All Changes"
                className="p-0.5 hover:text-ide-text-bright text-ide-muted rounded hover:bg-ide-hover"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="py-0.5">
            {unstagedFiles.length === 0 && stagedFiles.length === 0 ? (
              <div className="p-4 text-center text-ide-muted text-[11px]">
                No changes detected in working tree.
              </div>
            ) : (
              unstagedFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleOpenFileOrDiff(file.path)}
                  className="flex items-center justify-between px-3 py-1 text-ide-text hover:text-ide-text-bright hover:bg-ide-hover cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 font-mono text-[11px]">
                    <FileIcon fileName={file.relativePath} size={14} />
                    <span className="truncate">{file.relativePath}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {renderStatusBadge(file.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageFile(file.path);
                      }}
                      title="Stage File"
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-ide-text-bright text-ide-muted rounded hover:bg-ide-hover"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
