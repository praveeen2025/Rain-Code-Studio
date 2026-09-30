/**
 * SnapDev AI - Command Palette & Quick Search
 * Phase 9: Unified developer command palette (Ctrl+Shift+P) and file finder (Ctrl+P).
 * Fast, keyboard-navigable, accessible with category filtering.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  Sparkles,
  FileCode,
  SearchCode,
  Bug,
  FlaskConical,
  BookOpen,
  GitBranch,
  Gauge,
  Sliders,
  PanelRight,
  FolderGit2,
  Save,
  SunMoon,
  Globe,
  Smartphone,
  Play,
  Brain
} from 'lucide-react';
import { NavigationPage, ProjectFile } from '../../shared/types';
import { useProject } from '../hooks/useProject';
import { FileIcon } from './FileIcon';
import { themeStore } from '../stores/themeStore';
import { projectStore } from '../stores/projectStore';
import { editorConfigStore } from '../stores/editorConfigStore';
import { notificationStore } from '../stores/notificationStore';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavigationPage) => void;
  onToggleRightPanel?: () => void;
  mode?: 'commands' | 'files';
}

interface PaletteCommand {
  id: string;
  title: string;
  category: 'Navigation' | 'AI Copilot' | 'Git' | 'Performance' | 'Project' | 'View';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleRightPanel,
  mode = 'commands'
}) => {
  const {
    openProjectDialog,
    loadDemoProject,
    fileTree,
    selectFileByPath
  } = useProject();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<'commands' | 'files'>(mode);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveMode(mode);
    setQuery('');
    setSelectedIndex(0);
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, mode]);

  // Flatten file tree for file search mode
  const allFiles = useMemo(() => {
    const list: ProjectFile[] = [];
    const traverse = (items: ProjectFile[]) => {
      for (const item of items) {
        if (!item.isDirectory) {
          list.push(item);
        }
        if (item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(fileTree);
    return list;
  }, [fileTree]);

  // Command definitions
  const commands: PaletteCommand[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-projects',
        title: 'Go to Projects Workspace',
        category: 'Navigation',
        shortcut: 'Ctrl+1',
        icon: <FolderOpen className="w-4 h-4 text-amber-400" />,
        action: () => onNavigate('projects'),
        keywords: ['workspaces', 'folders', 'recents']
      },
      {
        id: 'nav-files',
        title: 'Go to Project Explorer (Files)',
        category: 'Navigation',
        shortcut: 'Ctrl+2',
        icon: <FileCode className="w-4 h-4 text-sky-400" />,
        action: () => onNavigate('files'),
        keywords: ['code', 'explorer', 'tree', 'editor']
      },
      {
        id: 'nav-chat',
        title: 'Go to AI Developer Workspace',
        category: 'Navigation',
        shortcut: 'Ctrl+3',
        icon: <Sparkles className="w-4 h-4 text-snap-crimson" />,
        action: () => onNavigate('chat'),
        keywords: ['chat', 'copilot', 'assistant', 'ask']
      },
      {
        id: 'nav-analysis',
        title: 'Go to Code Analysis & AST Index',
        category: 'Navigation',
        shortcut: 'Ctrl+4',
        icon: <SearchCode className="w-4 h-4 text-indigo-400" />,
        action: () => onNavigate('analysis'),
        keywords: ['ast', 'symbols', 'dependencies', 'functions']
      },
      {
        id: 'nav-intelligence',
        title: 'Go to Project Intelligence & Architecture',
        category: 'Navigation',
        shortcut: 'Ctrl+I',
        icon: <Brain className="w-4 h-4 text-blue-400" />,
        action: () => onNavigate('intelligence'),
        keywords: ['intelligence', 'health', 'architecture', 'onboarding', 'impact', 'refactor', 'similarity', 'knowledge']
      },
      {
        id: 'nav-bugs',
        title: 'Go to Bug & Error Detection',
        category: 'Navigation',
        shortcut: 'Ctrl+5',
        icon: <Bug className="w-4 h-4 text-rose-400" />,
        action: () => onNavigate('bugs'),
        keywords: ['issues', 'flaws', 'defects', 'analyze']
      },
      {
        id: 'nav-tests',
        title: 'Go to Test Generator',
        category: 'Navigation',
        shortcut: 'Ctrl+6',
        icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
        action: () => onNavigate('tests'),
        keywords: ['unit', 'vitest', 'pytest', 'jest']
      },
      {
        id: 'nav-docs',
        title: 'Go to Documentation Generator',
        category: 'Navigation',
        shortcut: 'Ctrl+7',
        icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
        action: () => onNavigate('docs'),
        keywords: ['docstrings', 'api', 'markdown']
      },
      {
        id: 'nav-git',
        title: 'Go to Git & Developer Tools',
        category: 'Navigation',
        shortcut: 'Ctrl+8',
        icon: <GitBranch className="w-4 h-4 text-orange-400" />,
        action: () => onNavigate('git'),
        keywords: ['commit', 'diff', 'branches', 'stage']
      },
      {
        id: 'nav-performance',
        title: 'Go to Snapdragon Performance Dashboard',
        category: 'Navigation',
        shortcut: 'Ctrl+9',
        icon: <Gauge className="w-4 h-4 text-snap-red" />,
        action: () => onNavigate('performance'),
        keywords: ['benchmark', 'npu', 'cpu', 'telemetry', 'hardware']
      },
      {
        id: 'nav-settings',
        title: 'Go to Settings & Diagnostics',
        category: 'Navigation',
        shortcut: 'Ctrl+,',
        icon: <Sliders className="w-4 h-4 text-zinc-400" />,
        action: () => onNavigate('settings'),
        keywords: ['preferences', 'config', 'theme', 'privacy']
      },

      // Project actions
      {
        id: 'proj-open',
        title: 'Open Local Project Directory...',
        category: 'Project',
        shortcut: 'Ctrl+O',
        icon: <FolderOpen className="w-4 h-4 text-amber-400" />,
        action: () => openProjectDialog(),
        keywords: ['folder', 'browse', 'directory']
      },
      {
        id: 'proj-demo',
        title: 'Load Bundled Demo Project',
        category: 'Project',
        icon: <Sparkles className="w-4 h-4 text-snap-blue" />,
        action: () => loadDemoProject(),
        keywords: ['sample', 'demo', 'example']
      },

      // AI actions
      {
        id: 'ai-explain',
        title: 'AI: Explain Active Source Code',
        category: 'AI Copilot',
        icon: <Sparkles className="w-4 h-4 text-snap-crimson" />,
        action: () => onNavigate('chat'),
        keywords: ['explain', 'understand', 'walkthrough']
      },
      {
        id: 'ai-review',
        title: 'AI: Review Code Quality & Security',
        category: 'AI Copilot',
        icon: <SearchCode className="w-4 h-4 text-emerald-400" />,
        action: () => onNavigate('chat'),
        keywords: ['lint', 'review', 'smells', 'audit']
      },
      {
        id: 'ai-tests',
        title: 'AI: Generate Automated Unit Tests',
        category: 'AI Copilot',
        icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
        action: () => onNavigate('tests'),
        keywords: ['test', 'generate', 'suite']
      },

      // Git actions
      {
        id: 'git-status',
        title: 'Git: Inspect Working Tree Status & Diff',
        category: 'Git',
        icon: <GitBranch className="w-4 h-4 text-orange-400" />,
        action: () => onNavigate('git'),
        keywords: ['status', 'unstaged', 'changes']
      },
      {
        id: 'git-commit',
        title: 'Git: Generate Commit Message with AI',
        category: 'Git',
        icon: <FolderGit2 className="w-4 h-4 text-orange-400" />,
        action: () => onNavigate('git'),
        keywords: ['ai commit', 'message', 'staged']
      },

      // View & Tools
      {
        id: 'view-context-panel',
        title: 'View: Toggle Right Context Panel',
        category: 'View',
        shortcut: 'Ctrl+J',
        icon: <PanelRight className="w-4 h-4 text-ide-muted" />,
        action: () => onToggleRightPanel && onToggleRightPanel(),
        keywords: ['sidebar', 'drawer', 'context', 'panel']
      },
      {
        id: 'view-quick-files',
        title: 'View: Quick Open File (File Finder)',
        category: 'View',
        shortcut: 'Ctrl+P',
        icon: <Search className="w-4 h-4 text-sky-400" />,
        action: () => setActiveMode('files'),
        keywords: ['file search', 'find']
      },
      {
        id: 'view-theme',
        title: 'Preferences: Toggle Color Theme (Dark / Light)',
        category: 'View',
        shortcut: 'Ctrl+K Ctrl+T',
        icon: <SunMoon className="w-4 h-4 text-amber-400" />,
        action: () => {
          themeStore.toggleTheme();
          onClose();
        },
        keywords: ['theme', 'dark', 'light', 'color']
      },
      {
        id: 'file-save',
        title: 'File: Save Active File',
        category: 'Project',
        shortcut: 'Ctrl+S',
        icon: <Save className="w-4 h-4 text-emerald-400" />,
        action: async () => {
          onClose();
          const ok = await projectStore.saveCurrentFile();
          if (ok) notificationStore.success('File Saved', 'Buffer written to disk');
        },
        keywords: ['save', 'write', 'disk']
      },
      {
        id: 'file-auto-save',
        title: 'File: Toggle Auto Save',
        category: 'Project',
        icon: <Save className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          const next = editorConfigStore.toggleAutoSave();
          notificationStore.info('Auto Save', next ? 'Enabled' : 'Disabled');
        },
        keywords: ['auto save', 'delay', 'disk']
      },
      {
        id: 'run-all-tests',
        title: 'Run: Run Vitest & Pytest Automated Suites',
        category: 'View',
        shortcut: 'F5',
        icon: <Play className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          onNavigate('tests');
        },
        keywords: ['test', 'vitest', 'pytest', 'run']
      },
      {
        id: 'run-benchmark',
        title: 'Run: Snapdragon Hardware Telemetry Benchmark',
        category: 'Performance',
        icon: <Gauge className="w-4 h-4 text-snap-crimson" />,
        action: () => {
          onClose();
          onNavigate('performance');
        },
        keywords: ['benchmark', 'npu', 'snapdragon', 'speed']
      },
      {
        id: 'view-web-preview',
        title: 'View: Toggle Web Preview (Integrated Browser)',
        category: 'View',
        icon: <Globe className="w-4 h-4 text-sky-400" />,
        action: () => {
          onClose();
          notificationStore.info('Web Preview', 'Use the globe icon in the top header or editor bar to open');
        },
        keywords: ['browser', 'preview', 'web', 'html']
      },
      {
        id: 'help-android',
        title: 'Help: Android APK Packaging & Export Architecture',
        category: 'Project',
        icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onClose();
          notificationStore.info('Android Export', 'Use the smartphone icon in the top header to view guide');
        },
        keywords: ['android', 'apk', 'capacitor', 'mobile']
      }
    ],
    [onNavigate, openProjectDialog, loadDemoProject, onToggleRightPanel]
  );

  // Filter items
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        c.keywords?.some((k) => k.toLowerCase().includes(lower))
    );
  }, [commands, query]);

  const filteredFiles = useMemo(() => {
    if (!query.trim()) return allFiles.slice(0, 30);
    const lower = query.toLowerCase();
    return allFiles
      .filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.relativePath.toLowerCase().includes(lower)
      )
      .slice(0, 30);
  }, [allFiles, query]);

  const totalCount =
    activeMode === 'commands' ? filteredCommands.length : filteredFiles.length;

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalCount) % Math.max(1, totalCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeMode === 'commands' && filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      } else if (activeMode === 'files' && filteredFiles[selectedIndex]) {
        const file = filteredFiles[selectedIndex];
        selectFileByPath(file.path);
        onNavigate('files');
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setActiveMode(activeMode === 'commands' ? 'files' : 'commands');
      setSelectedIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-ide-surface border border-ide-border rounded-xl shadow-2xl overflow-hidden flex flex-col focus:outline-none animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Mode Switcher Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-ide-border text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveMode('commands');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMode === 'commands'
                  ? 'bg-ide-active text-ide-text-bright font-bold'
                  : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
              }`}
            >
              Commands
            </button>
            <button
              onClick={() => {
                setActiveMode('files');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md transition ${
                activeMode === 'files'
                  ? 'bg-ide-active text-ide-text-bright font-bold'
                  : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
              }`}
            >
              Files {allFiles.length > 0 && `(${allFiles.length})`}
            </button>
          </div>
          <span className="text-[10px] text-ide-muted">
            Tab to switch • Esc to close
          </span>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ide-border bg-ide-sidebar">
          <Search className="w-4 h-4 text-ide-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              activeMode === 'commands'
                ? 'Type a command or search actions...'
                : 'Search files by name or path...'
            }
            className="flex-1 bg-transparent text-sm text-ide-text-bright placeholder:text-ide-muted focus:outline-none font-sans"
          />
          {activeMode === 'commands' && (
            <kbd className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-[10px] font-mono text-ide-muted">
              Ctrl+Shift+P
            </kbd>
          )}
        </div>

        {/* Result List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2 divide-y divide-ide-border/30"
        >
          {activeMode === 'commands' ? (
            filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-xs text-ide-muted">
                No matching commands found.
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition text-xs select-none ${
                      isSelected
                        ? 'bg-ide-active text-ide-text-bright font-semibold shadow-xs'
                        : 'text-ide-text hover:bg-ide-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="shrink-0">{cmd.icon}</span>
                      <span className="truncate">{cmd.title}</span>
                      <span className="text-[10px] font-mono text-ide-muted uppercase px-1.5 py-0.2 rounded bg-ide-surface border border-ide-border">
                        {cmd.category}
                      </span>
                    </div>

                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono text-ide-muted px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border shrink-0 ml-2">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })
            )
          ) : filteredFiles.length === 0 ? (
            <div className="p-6 text-center text-xs text-ide-muted">
              No files found matching query.
            </div>
          ) : (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={file.path}
                  onClick={() => {
                    selectFileByPath(file.path);
                    onNavigate('files');
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition text-xs select-none ${
                    isSelected
                      ? 'bg-ide-active text-ide-text-bright font-semibold shadow-xs'
                      : 'text-ide-text hover:bg-ide-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate font-mono">
                    <FileIcon fileName={file.name} size={15} />
                    <span className="text-ide-text-bright truncate font-semibold">{file.name}</span>
                    <span className="text-ide-muted text-[11px] truncate">
                      {file.relativePath}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-ide-muted shrink-0 ml-2">
                    {file.extension || 'file'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-ide-border flex items-center justify-between text-[11px] text-ide-muted bg-ide-sidebar/40">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="font-mono text-[10px]">Rain Code Studio Quick Access</span>
        </div>
      </div>
    </div>
  );
};
