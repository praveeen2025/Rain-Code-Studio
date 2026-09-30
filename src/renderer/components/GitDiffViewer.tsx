/**
 * SnapDev AI - GitDiffViewer Component
 * Phase 7: Real-time unified diff preview for staged, unstaged, and historical commits.
 * Matches Rain Code Studio design language with line numbering, additions/deletions, and copy controls.
 */

import React, { useState } from 'react';
import { FileCode, Copy, Check, Split } from 'lucide-react';
import { parseDiffMetrics } from '../../main/git/git-diff';

interface GitDiffViewerProps {
  diffText: string;
  filePath?: string;
  title?: string;
  isStaged?: boolean;
  onToggleStaged?: () => void;
  emptyMessage?: string;
}

export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({
  diffText,
  filePath,
  title,
  isStaged,
  onToggleStaged,
  emptyMessage = 'No changes to display'
}) => {
  const [copied, setCopied] = useState(false);

  if (!diffText || !diffText.trim()) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-ide-muted h-full bg-ide-panel rounded-xl border border-ide-border">
        <FileCode className="w-10 h-10 mb-2 opacity-30 text-purple-400" />
        <p className="text-sm font-medium">{emptyMessage}</p>
        <p className="text-xs text-ide-muted/80 max-w-xs mt-1">
          Select a modified file or toggle staged/unstaged views to inspect unified diffs.
        </p>
      </div>
    );
  }

  const { additions, deletions } = parseDiffMetrics(diffText);
  const lines = diffText.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayTitle = title || (filePath ? filePath.replace(/\\/g, '/').split('/').pop() : 'Diff Preview');

  return (
    <div className="flex flex-col h-full bg-ide-panel rounded-xl border border-ide-border overflow-hidden shadow-lg">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-ide-sidebar/95 border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white truncate font-mono">
                {displayTitle}
              </span>
              {filePath && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-ide-bg text-ide-muted font-mono truncate max-w-[200px]">
                  {filePath}
                </span>
              )}
              {isStaged !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    isStaged
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isStaged ? 'STAGED' : 'WORKING TREE'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ide-muted mt-0.5">
              <span className="text-emerald-400 font-mono font-medium">+{additions}</span>
              <span className="text-rose-400 font-mono font-medium">-{deletions}</span>
              <span className="text-ide-muted/70">{lines.length} diff lines</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleStaged && isStaged !== undefined && (
            <button
              onClick={onToggleStaged}
              className="px-2.5 py-1 rounded-lg bg-ide-bg hover:bg-ide-hover text-ide-muted hover:text-white transition-colors border border-ide-border text-xs flex items-center gap-1.5"
              title="Toggle between Staged and Unstaged diffs"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{isStaged ? 'View Unstaged' : 'View Staged'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy unified diff to clipboard"
            className="p-1.5 rounded-lg hover:bg-ide-bg text-ide-muted hover:text-white transition-colors border border-ide-border/50 text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Diff Code View */}
      <div className="flex-1 overflow-auto font-mono text-xs p-3 space-y-0.5 select-text bg-[#0d1117]">
        {lines.map((line, idx) => {
          let lineBg = 'bg-transparent text-gray-300';
          let prefixColor = 'text-gray-500';

          if (line.startsWith('---') || line.startsWith('+++')) {
            lineBg = 'bg-purple-950/30 text-purple-300 font-semibold';
            prefixColor = 'text-purple-400';
          } else if (line.startsWith('@@')) {
            lineBg =
              'bg-purple-900/30 text-purple-200 font-medium py-1 px-1 my-1 rounded border-y border-purple-500/20';
            prefixColor = 'text-purple-400';
          } else if (line.startsWith('+')) {
            lineBg =
              'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/30 border-l-2 border-emerald-500 pl-1';
            prefixColor = 'text-emerald-400 font-bold';
          } else if (line.startsWith('-')) {
            lineBg = 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/30 border-l-2 border-rose-500 pl-1';
            prefixColor = 'text-rose-400 font-bold';
          }

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 px-2 py-0.5 rounded-sm leading-relaxed transition-colors ${lineBg}`}
            >
              <span className="w-8 shrink-0 text-right select-none text-[10px] text-gray-600 font-mono">
                {idx + 1}
              </span>
              <pre className="flex-1 whitespace-pre-wrap break-all font-mono">
                <span className={prefixColor}>{line.charAt(0)}</span>
                {line.slice(1)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};
