/**
 * SnapDev AI - Code Analysis & Intelligence Dashboard
 * Phase 3: Structural code inspection, symbol search, file symbol outlines, and context viewer.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Code2,
  FileCode,
  RefreshCw,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { CodeSymbol, SymbolKind, ProjectIndexStatus } from '../../shared/types';
import { truncatePath } from '../utils/formatters';

export const AnalysisPage: React.FC = () => {
  const {
    activeProject,
    indexStatus,
    indexProgress,
    statistics,
    activeFileSymbols,
    selectedSymbolContext,
    triggerReindex,
    searchSymbols,
    selectSymbolForContext,
    clearSymbolContext,
    openProjectDialog,
    loadDemoProject
  } = useProject();

  const [activeTab, setActiveTab] = useState<'symbols' | 'files' | 'diagnostics'>('symbols');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<CodeSymbol[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Perform symbol search
  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      if (!activeProject) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchSymbols({
          query: searchQuery,
          kind: selectedKind as SymbolKind | 'all',
          limit: 100
        });
        if (!isCancelled) {
          setSearchResults(results);
          setIsSearching(false);
        }
      } catch (err) {
        console.error('Search failed:', err);
        if (!isCancelled) setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedKind, activeProject, searchSymbols, indexStatus]);

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto select-none">
        <div className="w-14 h-14 rounded-2xl bg-ide-surface border border-ide-border flex items-center justify-center text-snap-crimson mb-5 shadow-lg">
          <Code2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Code Intelligence Inactive</h2>
        <p className="text-xs text-ide-muted mb-6 leading-relaxed">
          Open a local workspace or load the demo project to parse and index functions, classes, interfaces, and dependencies.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => openProjectDialog()}
            className="px-4 py-2 bg-ide-surface hover:bg-ide-hover border border-ide-border text-white text-xs font-semibold rounded-lg transition"
          >
            Open Project
          </button>
          <button
            onClick={() => loadDemoProject()}
            className="px-4 py-2 bg-snap-crimson/20 hover:bg-snap-crimson/30 border border-snap-crimson/40 text-rose-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Project</span>
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: ProjectIndexStatus) => {
    switch (status) {
      case 'indexed':
        return {
          label: 'Indexed',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        };
      case 'indexing':
        return {
          label: 'Indexing...',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
        };
      case 'updating':
        return {
          label: 'Updating...',
          className: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
        };
      case 'partial':
        return {
          label: 'Partial',
          className: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        };
      case 'error':
        return {
          label: 'Error',
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        };
      case 'not_indexed':
      default:
        return {
          label: 'Not Indexed',
          className: 'bg-ide-surface text-ide-muted border-ide-border'
        };
    }
  };

  const statusBadge = getStatusBadge(indexStatus);

  const getKindBadgeClass = (kind: string) => {
    switch (kind) {
      case 'function':
      case 'method':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'class':
      case 'struct':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'interface':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'type':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'constant':
      case 'variable':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-ide-muted bg-ide-surface border-ide-border';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-ide-bg">
      {/* Top Header & Metrics Banner */}
      <div className="p-6 border-b border-ide-border bg-ide-sidebar/40 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ide-surface border border-ide-border flex items-center justify-center text-snap-crimson">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Code Intelligence</h1>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-muted">
                  Phase 3
                </span>
              </div>
              <p className="text-xs text-ide-muted font-mono truncate max-w-xl">
                {activeProject.name} — {truncatePath(activeProject.path, 60)}
              </p>
            </div>
          </div>

          <button
            onClick={() => triggerReindex()}
            disabled={indexStatus === 'indexing'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ide-surface hover:bg-ide-hover border border-ide-border text-xs text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${indexStatus === 'indexing' ? 'animate-spin' : ''}`} />
            <span>{indexStatus === 'indexing' ? 'Indexing...' : 'Re-Index Project'}</span>
          </button>
        </div>

        {/* Live Indexing Progress Bar */}
        {indexStatus === 'indexing' && indexProgress && (
          <div className="mb-4 p-3 rounded-lg bg-ide-surface border border-ide-border text-xs space-y-1.5">
            <div className="flex justify-between text-ide-muted text-[11px]">
              <span>
                Parsing source files: {indexProgress.parsedFiles + indexProgress.errorFiles} / {indexProgress.sourceFiles}
              </span>
              <span className="font-mono text-white truncate max-w-xs">
                {indexProgress.currentFile || 'Discovering files...'}
              </span>
            </div>
            <div className="w-full bg-ide-bg rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-snap-crimson h-full transition-all duration-200"
                style={{
                  width: `${
                    indexProgress.sourceFiles > 0
                      ? Math.round(
                          ((indexProgress.parsedFiles + indexProgress.errorFiles) /
                            indexProgress.sourceFiles) *
                            100
                        )
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
        )}

        {/* Real Statistics Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-ide-muted uppercase">Files</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.sourceFiles ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-ide-muted uppercase">Symbols</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.totalSymbols ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-sky-400 uppercase">Functions</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.functions ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-amber-400 uppercase">Classes</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.classes ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-emerald-400 uppercase">Interfaces</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.interfaces ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-purple-400 uppercase">Types</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.types ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-ide-muted uppercase">Imports</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.imports ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-ide-surface/80 border border-ide-border">
            <div className="text-[10px] text-rose-400 uppercase">Errors</div>
            <div className="text-sm font-semibold text-white font-mono mt-0.5">
              {statistics?.parseErrors ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="h-10 px-6 border-b border-ide-border flex items-center justify-between bg-ide-sidebar/20 shrink-0">
        <div className="flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('symbols')}
            className={`pb-2.5 -mb-px transition-colors ${
              activeTab === 'symbols'
                ? 'text-white border-b-2 border-snap-crimson font-semibold'
                : 'text-ide-muted hover:text-white'
            }`}
          >
            Symbol Search
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 -mb-px transition-colors ${
              activeTab === 'files'
                ? 'text-white border-b-2 border-snap-crimson font-semibold'
                : 'text-ide-muted hover:text-white'
            }`}
          >
            File Symbol View
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-2.5 -mb-px transition-colors flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'text-white border-b-2 border-snap-crimson font-semibold'
                : 'text-ide-muted hover:text-white'
            }`}
          >
            <span>Diagnostics</span>
            {(statistics?.parseErrors ?? 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                {statistics?.parseErrors}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab 1: Symbol Search */}
        {activeTab === 'symbols' && (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* Search Controls */}
            <div className="flex gap-3 mb-4 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ide-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search symbols by name (e.g. authenticate, calculate, User)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-ide-surface border border-ide-border rounded-lg text-xs text-white placeholder-ide-muted focus:outline-none focus:border-snap-blue font-mono"
                />
              </div>

              <select
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value)}
                className="px-3 py-2 bg-ide-surface border border-ide-border rounded-lg text-xs text-white focus:outline-none focus:border-snap-blue"
              >
                <option value="all">All Kinds</option>
                <option value="function">Functions</option>
                <option value="method">Methods</option>
                <option value="class">Classes</option>
                <option value="interface">Interfaces</option>
                <option value="type">Types</option>
                <option value="constant">Constants</option>
              </select>
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-y-auto border border-ide-border rounded-lg bg-ide-surface/30">
              {isSearching ? (
                <div className="p-8 text-center text-xs text-ide-muted">Searching symbols...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-ide-muted">
                  No symbols matched your query.
                </div>
              ) : (
                <div className="divide-y divide-ide-border">
                  {searchResults.map((sym) => (
                    <div
                      key={sym.id}
                      onClick={() => selectSymbolForContext(sym.id)}
                      className="p-3 hover:bg-ide-hover/50 cursor-pointer transition flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize shrink-0 ${getKindBadgeClass(
                            sym.kind
                          )}`}
                        >
                          {sym.kind}
                        </span>
                        <div className="truncate">
                          <div className="font-mono text-white font-medium group-hover:text-snap-blue transition-colors">
                            {sym.name}
                            {sym.parentSymbol && (
                              <span className="text-ide-muted text-[11px] font-normal ml-1">
                                in {sym.parentSymbol}
                              </span>
                            )}
                          </div>
                          {sym.signature && (
                            <div className="text-[11px] text-ide-muted font-mono truncate">
                              {sym.signature}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-ide-muted font-mono text-[11px]">
                        <span className="truncate max-w-[200px]">{sym.relativePath}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border">
                          L{sym.startLine}-{sym.endLine}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: File Symbol View */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {activeFileSymbols ? (
              <div className="space-y-4 max-w-4xl">
                <div className="p-4 rounded-xl bg-ide-surface border border-ide-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-snap-blue" />
                      <span className="font-mono font-semibold text-white text-sm">
                        {activeFileSymbols.relativePath}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                      {activeFileSymbols.parseStatus}
                    </span>
                  </div>

                  <div className="text-xs text-ide-muted flex gap-4 font-mono">
                    <span>Language: {activeFileSymbols.language}</span>
                    <span>Lines: {activeFileSymbols.lineCount}</span>
                    <span>Symbols: {activeFileSymbols.symbols.length}</span>
                    <span>Imports: {activeFileSymbols.imports.length}</span>
                  </div>
                </div>

                {/* Symbols in this file */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-ide-muted">
                    File Symbols & Outline
                  </div>
                  <div className="border border-ide-border rounded-lg bg-ide-surface/30 divide-y divide-ide-border">
                    {activeFileSymbols.symbols.length === 0 ? (
                      <div className="p-4 text-xs text-ide-muted text-center">
                        No structural symbols in this file.
                      </div>
                    ) : (
                      activeFileSymbols.symbols.map((sym) => (
                        <div
                          key={sym.id}
                          onClick={() => selectSymbolForContext(sym.id)}
                          className="p-3 hover:bg-ide-hover/50 cursor-pointer transition flex items-center justify-between text-xs group"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize shrink-0 ${getKindBadgeClass(
                                sym.kind
                              )}`}
                            >
                              {sym.kind}
                            </span>
                            <span className="font-mono text-white group-hover:text-snap-blue transition-colors">
                              {sym.name}
                            </span>
                            {sym.signature && (
                              <span className="text-ide-muted font-mono text-[11px] truncate hidden sm:inline">
                                {sym.signature}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-ide-muted">
                            Lines {sym.startLine}–{sym.endLine}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Imports in this file */}
                {activeFileSymbols.imports.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ide-muted">
                      Dependencies & Imports
                    </div>
                    <div className="border border-ide-border rounded-lg bg-ide-surface/30 p-3 space-y-1.5 font-mono text-xs text-ide-muted">
                      {activeFileSymbols.imports.map((imp) => (
                        <div key={imp.id} className="flex justify-between items-center">
                          <span className="text-white">{imp.source}</span>
                          <span className="text-[11px] text-ide-muted">
                            [{imp.specifiers.join(', ') || 'default'}] (line {imp.line})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ide-muted">
                <FileText className="w-10 h-10 mb-3 opacity-40" />
                <div className="text-sm font-medium text-white mb-1">No File Selected</div>
                <p className="text-xs max-w-sm leading-relaxed">
                  Open the <strong>Files</strong> tab to select any source file, or search for a symbol above to inspect its outline.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl">
            {(statistics?.parseErrors ?? 0) === 0 ? (
              <div className="p-6 rounded-xl bg-ide-surface border border-ide-border text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  ✓
                </div>
                <div className="font-semibold text-white text-sm">Clean AST Parse</div>
                <p className="text-xs text-ide-muted leading-relaxed">
                  All supported source files parsed successfully with zero syntax errors.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Parse Errors & Diagnostics</span>
                </div>
                <p className="text-xs text-ide-muted">
                  These files contained syntax errors or unsupported constructs. The rest of the project was parsed normally.
                </p>
                <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300 font-mono">
                  {statistics?.parseErrors} syntax diagnostic flags detected during parse pass.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Context Drawer / Modal (Section 20 requirement) */}
        {selectedSymbolContext && (
          <div className="w-96 border-l border-ide-border bg-ide-sidebar/90 flex flex-col shrink-0 overflow-hidden select-none">
            <div className="h-10 px-4 border-b border-ide-border flex items-center justify-between text-xs font-semibold text-white">
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-3.5 h-3.5 text-snap-crimson" />
                <span className="truncate">Symbol Context</span>
              </div>
              <button
                onClick={() => clearSymbolContext()}
                className="text-ide-muted hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${getKindBadgeClass(
                      selectedSymbolContext.symbol.kind
                    )}`}
                  >
                    {selectedSymbolContext.symbol.kind}
                  </span>
                  <span className="font-mono font-bold text-white text-sm truncate">
                    {selectedSymbolContext.symbol.name}
                  </span>
                </div>
                <div className="text-[11px] text-ide-muted font-mono truncate">
                  {selectedSymbolContext.relativePath} (Lines {selectedSymbolContext.startLine}–{selectedSymbolContext.endLine})
                </div>
              </div>

              {selectedSymbolContext.symbol.signature && (
                <div className="p-2.5 rounded bg-ide-surface border border-ide-border font-mono text-[11px] text-sky-300 break-words">
                  {selectedSymbolContext.symbol.signature}
                </div>
              )}

              {/* Exact Source Code Range */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-ide-muted uppercase">Source Snippet</div>
                <div className="p-3 bg-[#080b11] border border-ide-border rounded-lg font-mono text-[11px] text-ide-text overflow-x-auto leading-relaxed select-text">
                  <pre>{selectedSymbolContext.content}</pre>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-ide-muted/80 leading-normal">
                Extracted for future Phase 4 RAG local chunking. Pure structural source range.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
