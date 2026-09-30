/**
 * SnapDev AI - DiffViewer Component
 * Phase 6: Safe Diff Preview with explicit User Review and Apply/Reject controls.
 * Guarantees zero silent modifications. Every patch must be previewed and confirmed.
 */

import React, { useState } from 'react';
import {
  FileCode,
  Check,
  X,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { FilePatch, PatchResult } from '../../shared/types';

interface DiffViewerProps {
  patch: FilePatch | null;
  onApply?: (patch: FilePatch) => Promise<PatchResult | void>;
  onReject?: (patch: FilePatch) => Promise<void> | void;
  isApplying?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  patch,
  onApply,
  onReject,
  isApplying = false
}) => {
  const [copied, setCopied] = useState(false);
  const [applyResult, setApplyResult] = useState<PatchResult | null>(null);

  if (!patch) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-ide-muted h-full">
        <FileCode className="w-10 h-10 mb-2 opacity-30 text-purple-400" />
        <p className="text-sm font-medium">No active diff to preview</p>
        <p className="text-xs text-ide-muted/80 max-w-xs mt-1">
          When AI generates a fix, test, or documentation patch, the unified diff will appear here for review.
        </p>
      </div>
    );
  }

  const lines = patch.diff.split('\n');

  // Count additions and deletions
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++;
    if (line.startsWith('-') && !line.startsWith('---')) deletions++;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(patch.diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = async () => {
    if (!onApply || isApplying) return;
    try {
      const res = await onApply(patch);
      if (res) {
        setApplyResult(res);
      }
    } catch (err) {
      console.error('Failed to apply patch:', err);
    }
  };

  const handleRejectClick = async () => {
    if (!onReject) return;
    await onReject(patch);
  };

  const fileName = patch.filePath.replace(/\\/g, '/').split('/').pop() || patch.filePath;

  return (
    <div className="flex flex-col h-full bg-ide-panel rounded-xl border border-ide-border overflow-hidden shadow-lg">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-ide-sidebar/90 border-b border-ide-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white truncate font-mono">
                {fileName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ide-bg text-ide-muted font-mono truncate max-w-[180px]">
                {patch.filePath}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ide-muted mt-0.5">
              <span className="text-emerald-400 font-mono font-medium">+{additions}</span>
              <span className="text-rose-400 font-mono font-medium">-{deletions}</span>
              <span className="text-ide-muted/70">SHA: {patch.originalContentHash.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            title="Copy diff to clipboard"
            className="p-1.5 rounded-lg hover:bg-ide-bg text-ide-muted hover:text-white transition-colors border border-ide-border/50 text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {patch.status === 'pending' && (
            <>
              <button
                onClick={handleRejectClick}
                disabled={isApplying}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                onClick={handleApplyClick}
                disabled={isApplying}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
              >
                {isApplying ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Apply Changes
              </button>
            </>
          )}

          {patch.status === 'applied' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Applied Cleanly
            </div>
          )}

          {patch.status === 'rejected' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-medium">
              <X className="w-3.5 h-3.5" />
              Rejected by User
            </div>
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-ide-bg/60 border-b border-ide-border/50 px-4 py-2 flex items-center justify-between text-[11px] text-ide-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Safe Patch Pipeline: Verified SHA-256 hash & path confinement</span>
        </div>
        <span className="text-[10px] font-mono text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded">
          User Confirmation Required
        </span>
      </div>

      {/* Error or Success Alert */}
      {applyResult && !applyResult.success && (
        <div className="m-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Patch Application Blocked</div>
            <div className="text-[11px] text-rose-300/90 mt-0.5">{applyResult.error}</div>
            {applyResult.staleConflict && (
              <div className="text-[10px] text-rose-300/70 mt-1">
                The file on disk has changed since this patch was generated. Please regenerate the fix.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diff Code View */}
      <div className="flex-1 overflow-auto font-mono text-xs p-3 space-y-0.5 select-text bg-[#0d1117]">
        {lines.map((line, idx) => {
          let lineBg = 'bg-transparent text-gray-300';
          let prefixColor = 'text-gray-500';

          if (line.startsWith('---') || line.startsWith('+++')) {
            lineBg = 'bg-purple-950/20 text-purple-300 font-semibold';
            prefixColor = 'text-purple-400';
          } else if (line.startsWith('@@')) {
            lineBg = 'bg-purple-900/30 text-purple-200 font-medium py-1 px-1 my-1 rounded border-y border-purple-500/20';
            prefixColor = 'text-purple-400';
          } else if (line.startsWith('+')) {
            lineBg = 'bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/30 border-l-2 border-emerald-500 pl-1';
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
