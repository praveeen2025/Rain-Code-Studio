/**
 * Rain Code Studio - IDE Status Bar
 * VS Code-style bottom status bar with Git, language, encoding, model, hardware, and theme toggle.
 */

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Database,
  Cpu,
  ShieldCheck,
  Sun,
  Moon,
  Bell
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { useChat } from '../hooks/useChat';
import { HardwareInfo, GitStatus } from '../../shared/types';
import { themeStore } from '../stores/themeStore';
import { projectStore } from '../stores/projectStore';
import { FileIcon } from './FileIcon';

interface StatusBarProps {
  onNavigateGit?: () => void;
  onNavigatePerformance?: () => void;
  onNavigateFiles?: () => void;
  onNavigateModelHub?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  onNavigateGit,
  onNavigatePerformance,
  onNavigateFiles,
  onNavigateModelHub
}) => {
  const { activeProject, selectedFile, selectedFileContent, indexStatus } =
    useProject();
  const { modelStatus, modelInfo } = useChat();

  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [isDark, setIsDark] = useState<boolean>(themeStore.isDark());
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

  useEffect(() => {
    return themeStore.subscribe(() => {
      setIsDark(themeStore.isDark());
    });
  }, []);

  useEffect(() => {
    return projectStore.subscribe(() => {
      const pos = projectStore.getState().cursorPosition;
      if (pos) {
        setCursorPos(pos);
      }
    });
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI
        .getHardwareInfo()
        .then(setHardwareInfo)
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (window.electronAPI && activeProject) {
      window.electronAPI
        .gitGetStatus(activeProject.path)
        .then(setGitStatus)
        .catch(() => setGitStatus(null));
    } else {
      setGitStatus(null);
    }
  }, [activeProject?.id]);

  const lineCount = selectedFileContent
    ? selectedFileContent.split('\n').length
    : null;

  const dirtyCount = gitStatus
    ? (gitStatus.staged?.length || 0) +
      (gitStatus.unstaged?.length || 0) +
      (gitStatus.untracked?.length || 0)
    : 0;

  const detectLanguage = () => {
    if (!selectedFile?.extension) return 'Plain Text';
    const ext = selectedFile.extension.toLowerCase();
    if (ext === '.ts') return 'TypeScript';
    if (ext === '.tsx') return 'TypeScript React';
    if (ext === '.js') return 'JavaScript';
    if (ext === '.jsx') return 'JavaScript React';
    if (ext === '.py') return 'Python';
    if (ext === '.json') return 'JSON';
    if (ext === '.md') return 'Markdown';
    if (ext === '.css') return 'CSS';
    if (ext === '.html') return 'HTML';
    if (ext === '.rs') return 'Rust';
    if (ext === '.go') return 'Go';
    if (ext === '.c' || ext === '.cpp' || ext === '.h') return 'C/C++';
    return ext.replace('.', '').toUpperCase();
  };

  return (
    <footer className="h-6 bg-ide-statusbar text-white flex items-center justify-between px-3 text-[11px] font-mono select-none shrink-0 z-30 shadow-md">
      {/* Left Section: Remote Badge & Git & Diagnostics */}
      <div className="flex items-center gap-2">
        {/* VS Code Remote-Style On-Device Badge */}
        <div
          title="Rain Code Studio: 100% On-Device AI Execution"
          className="bg-black/25 hover:bg-black/35 px-2 py-0.5 rounded flex items-center gap-1.5 cursor-pointer text-white font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">On-Device AI</span>
        </div>

        {/* Git Branch & Dirty indicator */}
        {gitStatus?.isRepo ? (
          <button
            onClick={onNavigateGit}
            title={`Git branch: ${gitStatus.branch || 'HEAD'} (${dirtyCount} changed files)`}
            className="flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded transition text-white"
          >
            <GitBranch className="w-3 h-3 shrink-0" />
            <span className="font-semibold">{gitStatus.branch || 'HEAD'}</span>
            {!gitStatus.isClean && (
              <span className="text-[10px] text-amber-200 font-bold ml-0.5">
                ● {dirtyCount}
              </span>
            )}
          </button>
        ) : (
          <span className="flex items-center gap-1 opacity-80 px-1">
            <GitBranch className="w-3 h-3 opacity-60" />
            <span>No Git</span>
          </span>
        )}

        {/* Indexing / Project Status */}
        {activeProject && (
          <div className="hidden sm:flex items-center gap-1 opacity-90 hover:opacity-100 px-1">
            {indexStatus === 'indexing' ? (
              <span className="text-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" />
                <span>Indexing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-300" />
                <span>{activeProject.fileCount} files</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Section: Active File Info */}
      <div className="hidden md:flex items-center gap-2 truncate max-w-sm">
        {selectedFile && (
          <button
            onClick={onNavigateFiles}
            title={selectedFile.path}
            className="flex items-center gap-1.5 hover:bg-white/15 px-2 py-0.5 rounded transition truncate text-white"
          >
            <FileIcon fileName={selectedFile.name} size={13} />
            <span className="truncate">{selectedFile.name}</span>
            {lineCount !== null && (
              <span className="text-white/80 text-[10px]">
                ({lineCount} lines)
              </span>
            )}
          </button>
        )}
      </div>

      {/* Right Section: Editor Info, Language, Model, Theme Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Editor Line/Col */}
        {selectedFile && (
          <span className="hidden xl:inline text-white/90">
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
        )}

        {/* Spaces / Tabs */}
        <span className="hidden lg:inline text-white/90">Spaces: 2</span>

        {/* Encoding */}
        <span className="hidden lg:inline text-white/90">UTF-8</span>

        {/* Language Mode */}
        <span className="hidden sm:inline font-medium hover:bg-white/15 px-1 py-0.5 rounded cursor-pointer transition text-white">
          {detectLanguage()}
        </span>

        {/* Local AI Model Status */}
        <button
          type="button"
          onClick={onNavigateModelHub}
          title={`Active Model: ${modelInfo?.modelName || 'Local AI'} (${modelStatus}) • Click to select or manage models`}
          className="flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded cursor-pointer transition text-white"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              modelStatus === 'ready'
                ? 'bg-emerald-300'
                : modelStatus === 'loading'
                ? 'bg-amber-300 animate-pulse'
                : 'bg-white/60'
            }`}
          />
          <span className="hidden sm:inline truncate max-w-[120px]">
            {modelInfo?.modelName ? modelInfo.modelName.split('/').pop() : 'snapdev-local-code-q4'}
          </span>
        </button>

        {/* Snapdragon / Hardware Badge */}
        <button
          onClick={onNavigatePerformance}
          title={
            hardwareInfo?.snapdragonDetected === 'Snapdragon Detected'
              ? 'Snapdragon Optimised PC Active'
              : `Host Platform: ${hardwareInfo?.cpuName || 'Windows PC'}`
          }
          className="hidden md:flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded transition text-white"
        >
          <Cpu className="w-3 h-3 text-amber-200" />
          <span className="hidden xl:inline">
            {hardwareInfo?.snapdragonDetected === 'Snapdragon Detected'
              ? 'Snapdragon PC'
              : 'Desktop PC'}
          </span>
        </button>

        {/* Instant Theme Toggle Button */}
        <button
          onClick={() => themeStore.toggleTheme()}
          title={`Switch Theme (Currently ${isDark ? 'Dark Mode' : 'Light Mode'})`}
          className="flex items-center gap-1 hover:bg-white/20 px-2 py-0.5 rounded transition font-medium text-white shadow-xs"
        >
          {isDark ? (
            <>
              <Sun className="w-3 h-3 text-amber-200" />
              <span className="text-[10px]">Dark</span>
            </>
          ) : (
            <>
              <Moon className="w-3 h-3 text-cyan-200" />
              <span className="text-[10px]">Light</span>
            </>
          )}
        </button>

        {/* Notifications Icon */}
        <button
          title="Notifications"
          className="hover:bg-white/15 p-1 rounded transition text-white/90"
        >
          <Bell className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};
