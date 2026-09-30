/**
 * Rain Code Studio - Monaco-style Code Editor Area
 * VS Code-style interactive code editor with line gutter, auto-save, code minimap, split editor, and AI toolbar.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Bug,
  Wrench,
  FlaskConical,
  BookOpen,
  Copy,
  Check,
  FolderOpen,
  Save,
  Columns,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ProjectFile } from '../../shared/types';
import { formatBytes } from '../utils/formatters';
import { notificationStore } from '../stores/notificationStore';
import { projectStore } from '../stores/projectStore';
import { editorTabsStore } from '../stores/editorTabsStore';
import { editorConfigStore, EditorConfig } from '../stores/editorConfigStore';
import { AppLogo } from './AppLogo';

interface CodeEditorAreaProps {
  selectedFile: ProjectFile | null;
  content: string | null;
  isLoading?: boolean;
  onOpenFolder?: () => void;
  onLoadDemo?: () => void;
  onRunQuickAction?: (action: 'explain' | 'bug_analysis' | 'improve' | 'test_generation' | 'documentation') => void;
  selectedLine?: number | null;
}

export const CodeEditorArea: React.FC<CodeEditorAreaProps> = ({
  selectedFile,
  content,
  isLoading,
  onOpenFolder,
  onLoadDemo,
  onRunQuickAction,
  selectedLine
}) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [config, setConfig] = useState<EditorConfig>(editorConfigStore.getConfig());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const splitTextareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to editor settings
  useEffect(() => {
    return editorConfigStore.subscribe(() => {
      setConfig(editorConfigStore.getConfig());
    });
  }, []);

  // Sync dirty status from editorTabsStore
  useEffect(() => {
    if (!selectedFile) {
      setIsDirty(false);
      return;
    }
    const tabId = `file-${selectedFile.path}`;
    const tab = editorTabsStore.getTabs().find((t) => t.id === tabId);
    setIsDirty(Boolean(tab?.isDirty));

    const unsubscribe = editorTabsStore.subscribe(() => {
      const currentTab = editorTabsStore.getTabs().find((t) => t.id === tabId);
      setIsDirty(Boolean(currentTab?.isDirty));
    });
    return unsubscribe;
  }, [selectedFile?.path]);

  // Handle Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile?.path, content]);

  // Jump to selected line if requested
  useEffect(() => {
    if (selectedLine && textareaRef.current) {
      const lineHeight = 24;
      const targetScroll = Math.max(0, (selectedLine - 3) * lineHeight);
      textareaRef.current.scrollTop = targetScroll;
      if (gutterRef.current) {
        gutterRef.current.scrollTop = targetScroll;
      }
      projectStore.setCursorPosition(selectedLine, 1);
    }
  }, [selectedLine]);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      notificationStore.success('Copied to clipboard', selectedFile?.name || 'File content');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || isSaving) return;
    setIsSaving(true);
    const success = await projectStore.saveCurrentFile();
    setIsSaving(false);
    if (success) {
      setIsDirty(false);
    }
  };

  const handleTextareaScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      if (gutterRef.current) {
        gutterRef.current.scrollTop = scrollTop;
      }
      if (minimapRef.current) {
        const scrollRatio =
          scrollTop / (textareaRef.current.scrollHeight - textareaRef.current.clientHeight || 1);
        const maxMinimapScroll =
          minimapRef.current.scrollHeight - minimapRef.current.clientHeight;
        minimapRef.current.scrollTop = scrollRatio * maxMinimapScroll;
      }
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const textBefore = value.substring(0, selectionStart);
    const lines = textBefore.split('\n');
    const currentLine = lines.length;
    const currentColumn = lines[lines.length - 1].length + 1;
    projectStore.setCursorPosition(currentLine, currentColumn);
  };

  const handleKeyDownInTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const spaces = ' '.repeat(config.tabSize || 2);
      const newVal = val.substring(0, start) + spaces + val.substring(end);
      projectStore.updateSelectedFileContent(newVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + (config.tabSize || 2);
        updateCursorPosition();
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    projectStore.updateSelectedFileContent(e.target.value);
    updateCursorPosition();

    // Trigger debounced auto-save if enabled
    if (config.autoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, config.autoSaveDelay || 1000);
    }
  };

  const handleBlur = () => {
    if (config.autoSave && isDirty) {
      handleSave();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-ide-editor text-ide-muted select-none">
        <div className="w-8 h-8 border-2 border-ide-accent border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Reading document stream...</span>
      </div>
    );
  }

  // Welcome Screen if no file is open
  if (!selectedFile || content === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-ide-editor p-8 select-none text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="flex flex-col items-center gap-3">
            <AppLogo size={56} />
            <div>
              <h2 className="text-xl font-bold text-ide-text-bright tracking-tight">Rain Code Studio</h2>
              <p className="text-xs text-ide-muted mt-1 font-mono">Privacy-First On-Device AI Developer Copilot</p>
            </div>
          </div>

          {/* Quick Start Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={onOpenFolder}
              className="w-full py-2.5 px-4 rounded-lg bg-ide-accent hover:bg-sky-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-white" />
              <span>Open Folder</span>
              <span className="text-[10px] font-mono text-white/80 ml-auto">Ctrl+O</span>
            </button>

            <button
              onClick={onLoadDemo}
              className="w-full py-2.5 px-4 rounded-lg bg-ide-surface hover:bg-ide-hover text-ide-text-bright font-medium text-xs flex items-center justify-center gap-2 border border-ide-border transition cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-snap-crimson" />
              <span>Load Bundled Demo Project</span>
            </button>
          </div>

          {/* Useful VS Code Shortcuts */}
          <div className="p-4 rounded-xl bg-ide-surface border border-ide-border text-left space-y-2">
            <span className="text-[11px] font-bold text-ide-text-bright uppercase tracking-wider block">
              Keyboard Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-ide-text font-mono">
              <div className="flex items-center justify-between">
                <span>Go to File</span>
                <span className="px-1.5 py-0.5 rounded bg-ide-sidebar border border-ide-border text-[10px] text-ide-text-bright">Ctrl+P</span>
              </div>
              <div className="flex items-center justify-between">
                <span>All Commands</span>
                <span className="px-1.5 py-0.5 rounded bg-ide-sidebar border border-ide-border text-[10px] text-ide-text-bright">Ctrl+Shift+P</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Save File</span>
                <span className="px-1.5 py-0.5 rounded bg-ide-sidebar border border-ide-border text-[10px] text-ide-text-bright">Ctrl+S</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Toggle Terminal</span>
                <span className="px-1.5 py-0.5 rounded bg-ide-sidebar border border-ide-border text-[10px] text-ide-text-bright">Ctrl+`</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="flex-1 flex flex-col bg-ide-editor overflow-hidden select-text">
      {/* Code Actions Toolbar */}
      <div className="h-9 px-4 bg-ide-sidebar border-b border-ide-border flex items-center justify-between select-none shrink-0 text-xs">
        {/* Left: Quick AI Action Buttons on Active Code */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-ide-muted tracking-wider mr-1">Actions:</span>
          <button
            onClick={() => onRunQuickAction && onRunQuickAction('explain')}
            className="px-2 py-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text hover:text-ide-text-bright flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
            title="Explain this code with Rain Code AI"
          >
            <Code2 className="w-3 h-3 text-sky-500" />
            <span>Explain</span>
          </button>
          <button
            onClick={() => onRunQuickAction && onRunQuickAction('bug_analysis')}
            className="px-2 py-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text hover:text-ide-text-bright flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
            title="Find bugs or edge-case flaws in this code"
          >
            <Bug className="w-3 h-3 text-rose-500" />
            <span>Find Bugs</span>
          </button>
          <button
            onClick={() => onRunQuickAction && onRunQuickAction('improve')}
            className="px-2 py-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text hover:text-ide-text-bright flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
            title="Suggest performance & maintainability refactorings"
          >
            <Wrench className="w-3 h-3 text-amber-500" />
            <span>Improve</span>
          </button>
          <button
            onClick={() => onRunQuickAction && onRunQuickAction('test_generation')}
            className="px-2 py-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text hover:text-ide-text-bright flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
            title="Generate automated unit test suite"
          >
            <FlaskConical className="w-3 h-3 text-emerald-500" />
            <span>Add Tests</span>
          </button>
          <button
            onClick={() => onRunQuickAction && onRunQuickAction('documentation')}
            className="px-2 py-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text hover:text-ide-text-bright flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
            title="Generate docstrings and API documentation"
          >
            <BookOpen className="w-3 h-3 text-purple-500" />
            <span>Docs</span>
          </button>
        </div>

        {/* Right: File Metrics, Auto-Save Status, Split Editor, Save & Copy */}
        <div className="flex items-center gap-2 text-ide-muted text-[11px] font-mono">
          <span className="hidden sm:inline">{lines.length} lines</span>
          <span className="hidden sm:inline">{formatBytes(selectedFile.size || content.length)}</span>

          {/* Auto Save State Indicator */}
          {config.autoSave && (
            <div
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-ide-surface border border-ide-border"
              title="Auto Save is active (saves automatically 1s after typing)"
            >
              {isDirty ? (
                <>
                  <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                  <span className="text-amber-400">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Auto Save: On</span>
                </>
              )}
            </div>
          )}

          {/* Split Editor Toggle */}
          <button
            onClick={() => setIsSplit(!isSplit)}
            className={`p-1 px-1.5 rounded border transition flex items-center gap-1 text-[11px] cursor-pointer ${
              isSplit
                ? 'bg-ide-accent text-white border-ide-accent font-semibold'
                : 'bg-ide-surface hover:bg-ide-hover text-ide-text border-ide-border'
            }`}
            title={isSplit ? 'Close Split Editor Group' : 'Split Editor Right'}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isSplit ? 'Split On' : 'Split'}</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-2 py-1 rounded border flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer ${
              isDirty
                ? 'bg-ide-accent hover:bg-sky-600 text-white border-ide-accent font-semibold'
                : 'bg-ide-surface hover:bg-ide-hover text-ide-text border-ide-border'
            }`}
            title="Save file to disk (Ctrl+S)"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isDirty ? 'Save *' : 'Saved'}</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 px-2 hover:text-ide-text-bright rounded bg-ide-surface hover:bg-ide-hover border border-ide-border transition flex items-center gap-1 text-ide-text cursor-pointer"
            title="Copy file contents"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Content: Line Gutter + Interactive Textarea + Optional Minimap / Split */}
      <div className="flex-1 flex overflow-hidden font-mono text-[13px] leading-6 bg-ide-editor text-ide-text relative">
        {/* Line Numbers Gutter */}
        {config.lineNumbers && (
          <div
            ref={gutterRef}
            className="py-2 px-3 text-right text-ide-gutter-text select-none border-r border-ide-border bg-ide-gutter shrink-0 min-w-[50px] overflow-hidden leading-6"
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isTarget = selectedLine === lineNum;
              return (
                <div
                  key={lineNum}
                  className={`h-6 ${isTarget ? 'text-ide-accent font-bold bg-ide-highlight/50 px-1 -mx-1 rounded' : ''}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        {/* Primary Code Editor Pane */}
        <div className="flex-1 relative h-full overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDownInTextarea}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onSelect={updateCursorPosition}
            onScroll={handleTextareaScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap={config.wordWrap ? 'on' : 'off'}
            style={{ fontSize: `${config.fontSize || 13}px` }}
            className="w-full h-full p-2 px-4 resize-none bg-transparent text-ide-text font-mono leading-6 focus:outline-none overflow-auto border-none selection:bg-sky-500/30 dark:selection:bg-sky-500/40 tab-4"
            aria-label={`Code editor for ${selectedFile.name}`}
          />
        </div>

        {/* Split Editor Pane (if split is active) */}
        {isSplit && (
          <div className="flex-1 relative h-full overflow-hidden border-l border-ide-border bg-ide-editor/60 flex flex-col">
            <div className="h-6 px-3 bg-ide-sidebar border-b border-ide-border text-[10px] text-ide-muted flex items-center justify-between select-none">
              <span>Split Group: {selectedFile.name} (Synchronized)</span>
              <button
                onClick={() => setIsSplit(false)}
                className="hover:text-ide-text-bright p-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
            <textarea
              ref={splitTextareaRef}
              value={content}
              onChange={handleChange}
              onBlur={handleBlur}
              spellCheck={false}
              wrap={config.wordWrap ? 'on' : 'off'}
              style={{ fontSize: `${config.fontSize || 13}px` }}
              className="w-full flex-1 p-2 px-4 resize-none bg-transparent text-ide-text font-mono leading-6 focus:outline-none overflow-auto border-none selection:bg-sky-500/30 dark:selection:bg-sky-500/40 tab-4"
              aria-label={`Split editor for ${selectedFile.name}`}
            />
          </div>
        )}

        {/* Code Minimap (Right strip) */}
        {config.minimap && (
          <div
            ref={minimapRef}
            onClick={(e) => {
              if (minimapRef.current && textareaRef.current) {
                const rect = minimapRef.current.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const ratio = clickY / rect.height;
                textareaRef.current.scrollTop = ratio * textareaRef.current.scrollHeight;
              }
            }}
            className="w-20 border-l border-ide-border/50 bg-ide-sidebar/40 select-none overflow-hidden py-1 px-1 shrink-0 hidden lg:block cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            title="Code Minimap (Click to navigate)"
          >
            <div className="font-mono text-[3px] leading-[5px] text-ide-muted/70 tracking-tighter truncate space-y-0.5">
              {lines.slice(0, 150).map((line, idx) => (
                <div
                  key={idx}
                  className={`truncate whitespace-pre ${selectedLine === idx + 1 ? 'text-sky-400 bg-sky-500/20' : ''}`}
                >
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
