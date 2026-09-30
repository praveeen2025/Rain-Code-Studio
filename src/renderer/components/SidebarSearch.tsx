/**
 * Rain Code Studio - Sidebar Search Panel
 * VS Code-style Search panel supporting text search across project files with line highlights.
 */

import React, { useState, useRef } from 'react';
import {
  CaseSensitive,
  WholeWord,
  Regex,
  ChevronRight,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { ProjectFile } from '../../shared/types';
import { FileIcon } from './FileIcon';

interface SearchMatch {
  line: number;
  text: string;
  matchIndex: number;
  matchLength: number;
}

interface FileSearchResult {
  file: ProjectFile;
  matches: SearchMatch[];
  isExpanded: boolean;
}

interface SidebarSearchProps {
  onOpenFile: (file: ProjectFile, line?: number) => void;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({ onOpenFile }) => {
  const { fileTree, activeProject } = useProject();
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flatten file tree to get all readable source files
  const getAllFiles = (tree: ProjectFile[]): ProjectFile[] => {
    const list: ProjectFile[] = [];
    const traverse = (items: ProjectFile[]) => {
      for (const item of items) {
        if (!item.isDirectory) {
          list.push(item);
        } else if (item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(tree);
    return list;
  };

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim() || !window.electronAPI) {
      setResults([]);
      setSearchedQuery('');
      return;
    }

    setIsSearching(true);
    setSearchedQuery(searchTerm);

    try {
      const allFiles = getAllFiles(fileTree);
      const textFiles = allFiles.filter((f) => {
        const ext = f.extension?.toLowerCase() || '';
        return [
          '.ts', '.tsx', '.js', '.jsx', '.py', '.json',
          '.md', '.css', '.html', '.txt', '.yml', '.yaml',
          '.toml', '.sql', '.sh'
        ].includes(ext);
      });

      const searchResults: FileSearchResult[] = [];

      for (const file of textFiles) {
        try {
          const content = await window.electronAPI.readProjectFile(file.path);
          const lines = content.split('\n');
          const fileMatches: SearchMatch[] = [];

          let regex: RegExp;
          try {
            let pattern = searchTerm;
            if (!useRegex) {
              pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
            if (wholeWord) {
              pattern = `\\b${pattern}\\b`;
            }
            regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
          } catch {
            continue;
          }

          lines.forEach((lineText, idx) => {
            regex.lastIndex = 0;
            const match = regex.exec(lineText);
            if (match) {
              fileMatches.push({
                line: idx + 1,
                text: lineText.trim(),
                matchIndex: match.index,
                matchLength: match[0].length
              });
            }
          });

          if (fileMatches.length > 0) {
            searchResults.push({
              file,
              matches: fileMatches,
              isExpanded: true
            });
          }
        } catch {
          // Skip unreadable files
        }
      }

      setResults(searchResults);
    } catch (err) {
      console.error('[Search] Execution failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  const toggleFileExpanded = (filePath: string) => {
    setResults((prev) =>
      prev.map((r) =>
        r.file.path === filePath ? { ...r, isExpanded: !r.isExpanded } : r
      )
    );
  };

  const totalMatches = results.reduce((acc, r) => acc + r.matches.length, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs bg-ide-sidebar select-none">
      {/* Search Inputs & Filter Options */}
      <div className="p-3 border-b border-ide-border space-y-2 bg-ide-sidebar">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                executeSearch(query);
              }
            }}
            placeholder="Search in files (Press Enter)..."
            className="w-full bg-ide-surface border border-ide-border rounded px-2.5 py-1.5 text-xs text-ide-text placeholder:text-ide-muted/80 focus:outline-none focus:border-ide-accent pr-16"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setSearchedQuery('');
              }}
              className="absolute right-12 text-ide-muted hover:text-ide-text-bright p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Search Modifiers */}
          <div className="absolute right-1.5 flex items-center gap-0.5">
            <button
              onClick={() => {
                setCaseSensitive(!caseSensitive);
                executeSearch(query);
              }}
              title="Match Case"
              className={`p-1 rounded transition ${
                caseSensitive
                  ? 'bg-ide-accent text-white'
                  : 'text-ide-muted hover:text-ide-text-bright'
              }`}
            >
              <CaseSensitive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setWholeWord(!wholeWord);
                executeSearch(query);
              }}
              title="Match Whole Word"
              className={`p-1 rounded transition ${
                wholeWord
                  ? 'bg-ide-accent text-white'
                  : 'text-ide-muted hover:text-ide-text-bright'
              }`}
            >
              <WholeWord className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setUseRegex(!useRegex);
                executeSearch(query);
              }}
              title="Use Regular Expression"
              className={`p-1 rounded transition ${
                useRegex
                  ? 'bg-ide-accent text-white'
                  : 'text-ide-muted hover:text-ide-text-bright'
              }`}
            >
              <Regex className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status / Count bar */}
        <div className="flex items-center justify-between text-[11px] text-ide-muted px-0.5">
          {isSearching ? (
            <span className="flex items-center gap-1.5 text-ide-accent">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Searching workspace...</span>
            </span>
          ) : searchedQuery ? (
            <span>
              {totalMatches} {totalMatches === 1 ? 'result' : 'results'} in {results.length}{' '}
              {results.length === 1 ? 'file' : 'files'}
            </span>
          ) : (
            <span>Type to search across workspace</span>
          )}
        </div>
      </div>

      {/* Results Tree */}
      <div className="flex-1 overflow-y-auto p-1 divide-y divide-ide-border/20">
        {!activeProject ? (
          <div className="p-4 text-center text-ide-muted text-[11px]">
            Open a workspace folder to search across project files.
          </div>
        ) : results.length === 0 && searchedQuery && !isSearching ? (
          <div className="p-4 text-center text-ide-muted text-[11px]">
            No results found for &quot;{searchedQuery}&quot;.
          </div>
        ) : (
          results.map(({ file, matches, isExpanded }) => (
            <div key={file.path} className="py-1">
              {/* File Header */}
              <div
                onClick={() => toggleFileExpanded(file.path)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-ide-hover cursor-pointer text-ide-text hover:text-ide-text-bright group"
              >
                <span className="text-ide-muted">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
                <FileIcon file={file} size={14} />
                <span className="font-mono text-[11px] truncate flex-1 font-semibold">
                  {file.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-ide-surface text-ide-muted font-mono">
                  {matches.length}
                </span>
              </div>

              {/* Matching Lines */}
              {isExpanded && (
                <div className="pl-6 pr-2 py-0.5 space-y-0.5">
                  {matches.map((match, mIdx) => (
                    <div
                      key={`${file.path}-${match.line}-${mIdx}`}
                      onClick={() => onOpenFile(file, match.line)}
                      className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-ide-hover cursor-pointer text-ide-text group transition-colors"
                      title={`Line ${match.line}: ${match.text}`}
                    >
                      <span className="text-[10px] font-mono text-ide-muted shrink-0 min-w-[24px] text-right">
                        {match.line}
                      </span>
                      <span className="font-mono text-[11px] truncate text-ide-text group-hover:text-ide-text-bright">
                        {match.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
