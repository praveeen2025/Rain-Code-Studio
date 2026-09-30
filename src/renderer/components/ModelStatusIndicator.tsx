/**
 * SnapDev AI - Model Status Indicator
 * Displays the real on-device Local AI model state and configured model name in the TopBar.
 * 100% on-device local execution; zero telemetry.
 */

import React from 'react';
import { Bot, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { ModelStatus } from '../../shared/types';

export const ModelStatusIndicator: React.FC = () => {
  const { modelStatus, modelInfo, isGenerating } = useChat();

  const getStatusBadge = (status: ModelStatus, generating: boolean) => {
    if (generating || status === 'generating') {
      return {
        dotClass: 'bg-purple-400 animate-ping',
        textClass: 'text-purple-300',
        label: 'Generating...',
        icon: <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
      };
    }

    switch (status) {
      case 'ready':
        return {
          dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
          textClass: 'text-emerald-300',
          label: 'Ready',
          icon: <Sparkles className="w-3 h-3 text-emerald-400" />
        };
      case 'loading':
        return {
          dotClass: 'bg-amber-400 animate-pulse',
          textClass: 'text-amber-300',
          label: 'Loading...',
          icon: <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
        };
      case 'stopping':
      case 'unloading':
        return {
          dotClass: 'bg-amber-400',
          textClass: 'text-amber-300',
          label: status === 'stopping' ? 'Stopping...' : 'Unloading...',
          icon: <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
        };
      case 'not_configured':
        return {
          dotClass: 'bg-zinc-500',
          textClass: 'text-zinc-400',
          label: 'Model unavailable',
          icon: <Bot className="w-3 h-3 text-zinc-400" />
        };
      case 'error':
      default:
        return {
          dotClass: 'bg-rose-500',
          textClass: 'text-rose-300',
          label: 'Error',
          icon: <AlertCircle className="w-3 h-3 text-rose-400" />
        };
    }
  };

  const badge = getStatusBadge(modelStatus, isGenerating);
  const modelName = modelInfo?.modelName || 'snapdev-local-code-q4';

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded bg-ide-surface/90 border border-ide-border text-xs shadow-sm hover:border-ide-muted/50 transition-colors"
      title={`Local AI Status: ${badge.label}\nModel: ${modelName}\nDevice: ${modelInfo?.device || 'cpu'}\nRuntime: ${modelInfo?.runtime || 'Local Grounded Inference Runtime'}`}
    >
      <div className="flex items-center gap-1.5 font-medium">
        <span className="relative flex h-2 w-2">
          {badge.dotClass.includes('animate-ping') && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dotClass}`}></span>
        </span>
        <span className="text-ide-muted text-[11px] font-mono">Local AI:</span>
        <span className={`font-semibold ${badge.textClass}`}>{badge.label}</span>
      </div>

      <div className="h-3 w-px bg-ide-border" />

      <div className="flex items-center gap-1 text-[11px] font-mono text-ide-muted max-w-[130px] truncate">
        <span className="text-zinc-400 truncate">{modelName}</span>
      </div>
    </div>
  );
};
