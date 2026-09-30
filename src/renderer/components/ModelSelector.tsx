/**
 * Rain Code Studio - AI Model Selector Component
 * Interactive dropdown to select, activate, and use local AI models (Ollama, GGUF, SafeTensors, ONNX)
 * directly from the Chat Workspace and Copilot headers.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  ChevronDown,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  Search
} from 'lucide-react';
import { LocalModel, ModelRegistry, LocalModelFormat } from '../../shared/types';
import { useChat } from '../hooks/useChat';
import { chatStore } from '../stores/chatStore';
import { notificationStore } from '../stores/notificationStore';

interface ModelSelectorProps {
  onNavigateToModelHub?: () => void;
  compact?: boolean;
}

function fmtFormatIcon(format?: LocalModelFormat): string {
  switch (format) {
    case 'gguf': return '🦙';
    case 'safetensors': return '🔒';
    case 'onnx': return '⚡';
    case 'pytorch': return '🔥';
    default: return '📦';
  }
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes;
  let unit = 0;
  while (val >= 1024 && unit < units.length - 1) {
    val /= 1024;
    unit++;
  }
  return `${val.toFixed(1)} ${units[unit]}`;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  onNavigateToModelHub,
  compact = false
}) => {
  const { modelInfo, modelStatus } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [registry, setRegistry] = useState<ModelRegistry | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isActivatingId, setIsActivatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const api = window.electronAPI;

  const loadRegistry = async () => {
    if (!api?.modelHubGetRegistry) return;
    try {
      const reg = await api.modelHubGetRegistry();
      setRegistry(reg);
      // Auto-discover if no models found yet
      if (reg.models.length === 0 && !isScanning) {
        handleScan();
      }
    } catch (err) {
      console.error('[ModelSelector] Failed to load registry:', err);
    }
  };

  const handleScan = async () => {
    if (!api?.modelHubDiscover || isScanning) return;
    setIsScanning(true);
    try {
      const res = await api.modelHubDiscover();
      setRegistry(res.registry);
      notificationStore.info(
        'Models Scanned',
        `Discovered ${res.registry.models.length} model(s)`
      );
    } catch (err) {
      notificationStore.error('Scan Failed', String(err));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectModel = async (model: LocalModel) => {
    if (!api?.modelHubActivate) return;
    setIsActivatingId(model.id);

    try {
      const res = await api.modelHubActivate(model.id);
      if (res.success) {
        notificationStore.success(
          'Model Activated',
          `Using ${model.name} for local inference.`
        );
        // Refresh local chat status
        await chatStore.refreshStatus();
        await loadRegistry();
        setIsOpen(false);
      } else {
        notificationStore.error('Activation Failed', res.message);
      }
    } catch (err) {
      notificationStore.error('Activation Error', String(err));
    } finally {
      setIsActivatingId(null);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initial load
  useEffect(() => {
    loadRegistry();
  }, []);

  const activeModel = registry?.models.find((m) => m.status === 'Active');
  const currentDisplayName = activeModel?.name || modelInfo?.modelName?.split('/').pop() || 'Select Model';

  const filteredModels = (registry?.models ?? []).filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.family.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.parameterCount.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadRegistry();
        }}
        title={`Active Model: ${currentDisplayName} (Click to switch)`}
        className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-lg border transition duration-150 ${
          isOpen
            ? 'bg-ide-panel border-purple-500/60 shadow-lg shadow-purple-500/10'
            : 'bg-ide-bg hover:bg-ide-panel/80 border-ide-border hover:border-ide-border/80'
        } text-xs group cursor-pointer`}
      >
        <span className="text-sm select-none">
          {fmtFormatIcon(activeModel?.format || 'gguf')}
        </span>

        <span className="text-white font-mono text-[11px] font-medium tracking-tight truncate max-w-[150px]">
          {currentDisplayName}
        </span>

        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            modelStatus === 'ready' || activeModel
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
              : modelStatus === 'generating'
              ? 'bg-purple-400 animate-ping'
              : 'bg-amber-400'
          }`}
        />

        <ChevronDown
          className={`w-3 h-3 text-ide-muted transition-transform duration-200 group-hover:text-white ${
            isOpen ? 'rotate-180 text-purple-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 rounded-xl bg-ide-sidebar/95 backdrop-blur-md border border-ide-border shadow-2xl shadow-black/60 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3 border-b border-ide-border/60 bg-ide-panel/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-snap-crimson" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Choose AI Model
              </span>
              {registry && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-ide-muted border border-white/10">
                  {registry.models.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                title="Rescan local models (Ollama, GGUF, local paths)"
                className="p-1 rounded text-ide-muted hover:text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-purple-400' : ''}`}
                />
              </button>

              {onNavigateToModelHub && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToModelHub();
                  }}
                  title="Open full Model Hub manager"
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 px-1.5 py-0.5 rounded hover:bg-purple-500/10 transition"
                >
                  <span>Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Search Box if models exist */}
          {(registry?.models.length ?? 0) > 3 && (
            <div className="p-2 border-b border-ide-border/40 bg-ide-bg/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-ide-muted absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter models (name, family, size)…"
                  className="w-full bg-ide-bg text-white text-[11px] pl-8 pr-3 py-1 rounded-md border border-ide-border focus:border-purple-500 focus:outline-none placeholder-ide-muted"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Model List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-ide-border/30 p-1">
            {isScanning && (!registry || registry.models.length === 0) ? (
              <div className="p-6 text-center text-ide-muted space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                <p className="text-xs">Detecting local models & Ollama…</p>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="p-6 text-center text-ide-muted space-y-3">
                <Layers className="w-7 h-7 mx-auto text-ide-muted/60" />
                <div>
                  <p className="text-xs font-medium text-ide-text">No models found</p>
                  <p className="text-[10px] text-ide-muted mt-0.5">
                    Start Ollama or place GGUF files in model paths.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 transition cursor-pointer"
                >
                  🔍 Scan Now
                </button>
              </div>
            ) : (
              filteredModels.map((model) => {
                const isActive = model.status === 'Active' || model.id === registry?.activeModelId;
                const isActivating = isActivatingId === model.id;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model)}
                    disabled={isActivating}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 transition cursor-pointer ${
                      isActive
                        ? 'bg-purple-500/15 border border-purple-500/40 text-white'
                        : 'hover:bg-ide-panel/80 text-ide-text border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base select-none shrink-0">
                        {fmtFormatIcon(model.format)}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-medium truncate ${
                              isActive ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}
                          >
                            {model.name}
                          </span>
                          {isActive && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-ide-muted mt-0.5">
                          <span className="capitalize px-1 rounded bg-white/5 text-purple-300/80">
                            {model.provider}
                          </span>
                          {model.parameterCount !== 'Unknown' && (
                            <span>• {model.parameterCount}</span>
                          )}
                          {model.fileSize > 0 && (
                            <span>• {formatBytes(model.fileSize)}</span>
                          )}
                          {model.contextLength && (
                            <span>• {Math.round(model.contextLength / 1024)}k ctx</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isActivating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      ) : isActive ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-ide-muted hover:text-white px-2 py-0.5 rounded border border-ide-border hover:border-purple-400/50 transition">
                          Use
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          {onNavigateToModelHub && (
            <div className="p-2 border-t border-ide-border/50 bg-ide-panel/40 flex items-center justify-between text-[11px]">
              <span className="text-ide-muted text-[10px]">
                {activeModel ? `Running: ${activeModel.name}` : 'Select a model above'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToModelHub();
                }}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <span>Full Model Hub</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
