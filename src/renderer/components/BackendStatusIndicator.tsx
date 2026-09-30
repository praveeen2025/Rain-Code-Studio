/**
 * SnapDev AI - Backend Status Indicator
 * Renders real backend health state: Connected / Starting / Connection Error.
 * Includes detailed popover for debugging and diagnostics.
 */

import React, { useState } from 'react';
import { RefreshCw, Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { formatUptime } from '../utils/formatters';

interface Props {
  className?: string;
}

export const BackendStatusIndicator: React.FC<Props> = ({ className = '' }) => {
  const { status, details, error, refreshHealth, restartBackend } = useBackendHealth();
  const [showDetails, setShowDetails] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Connected',
          dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
          textClass: 'text-emerald-400',
          borderClass: 'border-emerald-500/30'
        };
      case 'starting':
        return {
          label: 'Starting...',
          dotClass: 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]',
          textClass: 'text-amber-400',
          borderClass: 'border-amber-500/30'
        };
      case 'error':
      default:
        return {
          label: 'Connection Error',
          dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
          textClass: 'text-rose-400',
          borderClass: 'border-rose-500/30'
        };
    }
  };

  const current = getStatusDisplay();

  const handleRestart = async () => {
    setIsRestarting(true);
    await restartBackend();
    setTimeout(() => setIsRestarting(false), 2000);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-ide-surface hover:bg-ide-hover transition-colors border ${current.borderClass} text-ide-text`}
        title="Local Python FastAPI Backend Status"
      >
        <span className="text-ide-muted hidden sm:inline">Local Backend</span>
        <span className={`w-2 h-2 rounded-full ${current.dotClass}`} />
        <span className={`${current.textClass} font-mono`}>{current.label}</span>
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-80 bg-ide-surface border border-ide-border rounded-lg shadow-2xl p-4 z-50 text-xs text-ide-text">
          <div className="flex items-center justify-between pb-3 border-b border-ide-border">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-ide-muted" />
              <span className="font-semibold text-sm">Local Python Backend</span>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-ide-muted hover:text-ide-text p-1"
            >
              ×
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-ide-muted">State:</span>
              <div className="flex items-center gap-1.5 font-medium">
                {status === 'connected' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                <span className={current.textClass}>{current.label}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-ide-muted">Service:</span>
              <span className="font-mono text-ide-text">{details?.service || 'snapdev-ai-backend'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-ide-muted">Target Port:</span>
              <span className="font-mono text-ide-text">{details?.port || 8765}</span>
            </div>

            {details?.uptime_seconds !== undefined && (
              <div className="flex justify-between">
                <span className="text-ide-muted">Uptime:</span>
                <span className="font-mono text-ide-text">{formatUptime(details.uptime_seconds)}</span>
              </div>
            )}

            {details?.device && (
              <div className="flex justify-between">
                <span className="text-ide-muted">Device Target:</span>
                <span className="text-snap-blue text-[11px] truncate max-w-[170px]" title={details.device}>
                  {details.device}
                </span>
              </div>
            )}

            {error && (
              <div className="mt-2 p-2 bg-rose-950/40 border border-rose-800/40 rounded text-rose-300 text-[11px] break-words">
                <div className="font-semibold mb-0.5">Diagnostic Error:</div>
                {error}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-ide-border flex gap-2">
            <button
              onClick={() => refreshHealth()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-ide-sidebar hover:bg-ide-hover border border-ide-border rounded text-ide-text transition"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button
              onClick={handleRestart}
              disabled={isRestarting}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-snap-crimson/20 hover:bg-snap-crimson/30 border border-snap-crimson/40 text-rose-200 rounded transition disabled:opacity-50"
            >
              {isRestarting ? 'Restarting...' : 'Restart'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
