/**
 * SnapDev AI - Files Page (Project Explorer & Code Viewer)
 * Phase 9: Fast tree navigation, search filter, syntax-styled code view, symbol jump, and empty states.
 */

import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Copy,
  Check,
  Code,
  Search
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { ProjectFile } from '../../shared/types';
import { formatBytes } from '../utils/formatters';
import { notificationStore } from '../stores/notificationStore';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { FileIcon } from '../components/FileIcon';

interface FileTreeItemProps {
  file: ProjectFile;
  level?: number;
  selectedPath?: string;
  onSelect: (file: ProjectFile) => void;
  filterQuery?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  level = 0,
  selectedPath,
  onSelect,
  filterQuery = ''
}) => {
  const [isOpen, setIsOpen] = useState(level === 0 || filterQuery.length > 0);
  const isSelected = selectedPath === file.path;

  // Filter check
  const matchesFilter = (item: ProjectFile): boolean => {
    if (!filterQuery) return true;
    const lower = filterQuery.toLowerCase();
    if (item.name.toLowerCase().includes(lower)) return true;
    if (item.children) {
      return item.children.some(matchesFilter);
    }
    return false;
  };

  if (!matchesFilter(file)) return null;

  const handleClick = () => {
    if (file.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelect(file);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        className={`flex items-center gap-1.5 py-1 pr-2 rounded cursor-pointer text-xs transition-colors group select-none ${
          isSelected
            ? 'bg-ide-active text-ide-text-bright font-semibold shadow-xs'
            : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
        }`}
      >
        {file.isDirectory && (
          <span className="text-ide-muted group-hover:text-ide-text-bright">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        {!file.isDirectory && <span className="w-3.5" />}
        <FileIcon file={file} isOpen={isOpen} size={15} />
        <span className="truncate font-mono text-[12px]">{file.name}</span>
      </div>

      {file.isDirectory && isOpen && file.children && (
        <div>
          {file.children.map((child) => (
            <FileTreeItem
              key={child.path}
              file={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              filterQuery={filterQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FilesPage: React.FC = () => {
  const {
    activeProject,
    fileTree,
    selectedFile,
    selectedFileContent,
    isLoading,
    selectFile,
    openProjectDialog,
    loadDemoProject,
    targetLineRange,
    activeFileSymbols
  } = useProject();

  const [filterQuery, setFilterQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedSymbolLine, setSelectedSymbolLine] = useState<number | null>(null);

  const handleCopy = () => {
    if (selectedFileContent) {
      navigator.clipboard.writeText(selectedFileContent);
      setCopied(true);
      notificationStore.success('Copied to clipboard', selectedFile?.name || 'File content');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJumpToSymbol = (line: number) => {
    setSelectedSymbolLine(line);
    // Smooth scroll to target line
    const el = document.getElementById(`code-line-${line}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!activeProject) {
    return (
      <EmptyState
        icon={<Folder className="w-6 h-6 text-amber-400" />}
        title="No Workspace Opened"
        description="Open an existing project directory or launch the bundled demo project to browse code files and view AST intelligence."
        action={{
          label: 'Open Project',
          onClick: openProjectDialog,
          variant: 'primary'
        }}
        secondaryAction={{
          label: 'Demo Project',
          onClick: loadDemoProject,
          icon: <Sparkles className="w-3.5 h-3.5 text-snap-crimson" />
        }}
        className="my-auto"
      />
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* File Tree Column */}
      <div className="w-72 bg-ide-sidebar/70 border-r border-ide-border flex flex-col shrink-0">
        {/* Workspace Header */}
        <div className="p-3 border-b border-ide-border flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-2 truncate">
            <Code className="w-4 h-4 text-snap-blue shrink-0" />
            <span className="truncate">{activeProject.name}</span>
          </div>
          <span className="text-[10px] font-mono text-ide-muted">
            {activeProject.fileCount} files
          </span>
        </div>

        {/* Tree Search & Filter Input */}
        <div className="p-2 border-b border-ide-border/60 bg-ide-surface/30">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-ide-sidebar border border-ide-border focus-within:border-snap-blue transition">
            <Search className="w-3.5 h-3.5 text-ide-muted shrink-0" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter files..."
              className="bg-transparent text-xs text-white placeholder-ide-muted/60 focus:outline-none w-full font-sans"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="text-ide-muted hover:text-white text-[10px] font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tree Body */}
        <div className="flex-1 p-2 overflow-y-auto">
          {fileTree.length === 0 ? (
            <div className="p-4 text-center text-xs text-ide-muted">
              No files found in directory.
            </div>
          ) : (
            fileTree.map((item) => (
              <FileTreeItem
                key={item.path}
                file={item}
                selectedPath={selectedFile?.path}
                onSelect={(file) => {
                  setSelectedSymbolLine(null);
                  selectFile(file);
                }}
                filterQuery={filterQuery}
              />
            ))
          )}
        </div>
      </div>

      {/* Code / Content Viewer Pane */}
      <div className="flex-1 flex flex-col bg-ide-bg overflow-hidden">
        {selectedFile ? (
          <>
            {/* File Path Header */}
            <div className="h-10 px-4 border-b border-ide-border flex items-center justify-between bg-ide-surface/60 select-none shrink-0 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-ide-text truncate">
                <FileCode className="w-3.5 h-3.5 text-snap-blue shrink-0" />
                <span className="truncate">{selectedFile.path}</span>
                {targetLineRange && (
                  <Badge variant="snap" size="xs">
                    Target Lines {targetLineRange.startLine}–{targetLineRange.endLine}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                {/* Symbol quick jump dropdown if symbols exist */}
                {activeFileSymbols && activeFileSymbols.symbols.length > 0 && (
                  <select
                    value={selectedSymbolLine || ''}
                    onChange={(e) => {
                      const line = Number(e.target.value);
                      if (line) handleJumpToSymbol(line);
                    }}
                    className="bg-ide-surface border border-ide-border rounded px-2 py-0.5 text-[11px] text-ide-text focus:outline-none font-mono"
                  >
                    <option value="">Jump to Symbol...</option>
                    {activeFileSymbols.symbols.map((sym) => (
                      <option key={sym.id} value={sym.startLine}>
                        {sym.kind}: {sym.name} (L{sym.startLine})
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-ide-muted font-mono text-[11px]">
                  {formatBytes(selectedFile.size)}
                </span>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 bg-ide-surface hover:bg-ide-hover border border-ide-border rounded text-[11px] text-ide-muted hover:text-white transition"
                  title="Copy file contents"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-ide-text leading-relaxed bg-[#080b11]">
              {isLoading ? (
                <div className="text-ide-muted animate-pulse">Loading file content...</div>
              ) : selectedFileContent !== null ? (
                <div className="select-text font-mono">
                  {selectedFileContent.split('\n').map((line, idx) => {
                    const lineNum = idx + 1;
                    const isTarget =
                      targetLineRange &&
                      lineNum >= targetLineRange.startLine &&
                      lineNum <= targetLineRange.endLine;
                    const isSymbolJump = selectedSymbolLine === lineNum;

                    return (
                      <div
                        id={`code-line-${lineNum}`}
                        key={lineNum}
                        className={`flex items-start px-2 py-0.5 rounded-sm transition-colors ${
                          isSymbolJump
                            ? 'bg-sky-500/20 border-l-2 border-sky-400 text-white font-medium'
                            : isTarget
                            ? 'bg-snap-crimson/15 border-l-2 border-snap-crimson text-white font-medium'
                            : 'hover:bg-ide-hover/30'
                        }`}
                      >
                        <span className="w-10 text-right pr-4 text-ide-muted/50 select-none text-[11px] shrink-0">
                          {lineNum}
                        </span>
                        <span className="whitespace-pre overflow-x-auto">{line || ' '}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-ide-muted">Click a file from the explorer to preview.</div>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<FileCode className="w-8 h-8 text-ide-muted opacity-60" />}
            title="Select a File to Preview"
            description="Click on any source file from the workspace explorer on the left or press Ctrl+P to quick-search by filename."
            className="my-auto"
          />
        )}
      </div>
    </div>
  );
};
