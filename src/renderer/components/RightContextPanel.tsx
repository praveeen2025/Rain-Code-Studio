/**
 * Rain Code Studio - Right Context & AI Copilot Panel
 * VS Code-style secondary sidebar supporting real developer AI Copilot chat and workspace context.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Bot,
  Cpu,
  Send,
  Square,
  Trash2,
  Check,
  Copy,
  Wrench,
  Bug,
  BookOpen
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { useChat } from '../hooks/useChat';
import { HardwareInfo } from '../../shared/types';
import { notificationStore } from '../stores/notificationStore';
import { FileIcon } from './FileIcon';

interface RightContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateAI?: () => void;
  onNavigatePerformance?: () => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'context'>('copilot');
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    activeProject,
    selectedFile,
    activeFileSymbols,
    ragStatus
  } = useProject();

  const {
    messages,
    isGenerating: isChatLoading,
    sendMessage,
    stopGeneration,
    clearChat,
    modelInfo
  } = useChat();

  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI
        .getHardwareInfo()
        .then(setHardwareInfo)
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'copilot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!inputValue.trim() || isChatLoading) return;
    const q = inputValue;
    setInputValue('');
    await sendMessage(q, activeProject?.id);
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputValue(promptText);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    notificationStore.success('Copied to clipboard', 'Code snippet copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="w-80 bg-ide-sidebar border-l border-ide-border flex flex-col shrink-0 select-none z-20 overflow-hidden">
      {/* Panel Header with Tabs */}
      <div className="h-9 px-2 border-b border-ide-border flex items-center justify-between bg-ide-sidebar shrink-0 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'copilot'
                ? 'bg-ide-active text-ide-text-bright'
                : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-snap-crimson" />
            <span>AI Copilot</span>
          </button>

          <button
            onClick={() => setActiveTab('context')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'context'
                ? 'bg-ide-active text-ide-text-bright'
                : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Context</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-ide-muted hover:text-ide-text-bright p-1 rounded text-[11px] font-mono hover:bg-ide-hover"
          title="Hide Panel (Ctrl+L)"
        >
          ✕
        </button>
      </div>

      {/* Tab 1: AI Copilot */}
      {activeTab === 'copilot' && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Active Model & Context Banner */}
          <div className="p-2 border-b border-ide-border/60 bg-ide-surface flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-ide-muted font-mono truncate max-w-[190px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{modelInfo?.modelName?.split('/').pop() || 'snapdev-local-code-q4'}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear Chat"
                className="p-1 hover:text-ide-text-bright text-ide-muted rounded hover:bg-ide-hover transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Active File Context Tag */}
          {selectedFile && (
            <div className="px-3 py-1.5 bg-ide-editor border-b border-ide-border text-[10px] text-ide-muted flex items-center gap-1.5 truncate">
              <FileIcon fileName={selectedFile.name} size={13} />
              <span className="truncate text-ide-text font-mono">Context: {selectedFile.name}</span>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 select-text bg-ide-editor">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-ide-muted space-y-3">
                <div className="w-10 h-10 rounded-xl bg-ide-surface border border-ide-border flex items-center justify-center">
                  <Bot className="w-5 h-5 text-snap-crimson" />
                </div>
                <div>
                  <h4 className="font-bold text-ide-text-bright text-xs">Rain Code Copilot</h4>
                  <p className="text-[11px] text-ide-muted mt-1">
                    Ask architectural questions or use quick developer prompts.
                  </p>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-left">
                  <button
                    onClick={() => handleQuickPrompt(`Explain ${selectedFile ? selectedFile.name : 'the project structure'}`)}
                    className="w-full p-2 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text text-[11px] flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="truncate">Explain active file</span>
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('Find potential bugs or edge cases in this code')}
                    className="w-full p-2 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text text-[11px] flex items-center gap-1.5 transition"
                  >
                    <Bug className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">Audit for potential bugs</span>
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('Suggest performance and maintainability improvements')}
                    className="w-full p-2 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text text-[11px] flex items-center gap-1.5 transition"
                  >
                    <Wrench className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">Improve code efficiency</span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-lg text-xs leading-relaxed space-y-1.5 ${
                    msg.role === 'user'
                      ? 'bg-ide-active text-ide-text-bright ml-4 border border-ide-border font-medium'
                      : 'bg-ide-surface text-ide-text mr-2 border border-ide-border'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold text-ide-muted mb-1">
                    <span>{msg.role === 'user' ? 'Developer' : 'Rain Code Copilot'}</span>
                    <button
                      onClick={() => handleCopyCode(msg.id, msg.content)}
                      className="hover:text-ide-text-bright p-0.5 text-ide-muted"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2 border-t border-ide-border bg-ide-sidebar">
            <div className="relative rounded-lg bg-ide-input border border-ide-input-border focus-within:border-ide-accent transition">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Rain Code AI (Enter to send)..."
                rows={2}
                className="w-full p-2 bg-transparent text-xs text-ide-text placeholder:text-ide-muted focus:outline-none resize-none font-sans"
              />

              <div className="flex items-center justify-between p-1.5 pt-0">
                <span className="text-[10px] text-ide-muted font-mono">100% On-Device</span>
                {isChatLoading ? (
                  <button
                    onClick={stopGeneration}
                    className="p-1 rounded bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 text-xs flex items-center gap-1 transition font-medium"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="p-1.5 rounded bg-ide-accent hover:bg-sky-600 disabled:opacity-40 text-white text-xs flex items-center gap-1 transition font-medium"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Context Inspector */}
      {activeTab === 'context' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-ide-sidebar">
          {/* Active File Context */}
          <div className="p-3 bg-ide-surface rounded-lg border border-ide-border space-y-1.5">
            <div className="flex items-center justify-between font-bold text-ide-text-bright">
              <span>Active File</span>
              <span className="text-ide-muted font-mono text-[10px]">
                {selectedFile?.extension || 'none'}
              </span>
            </div>
            <div className="text-[11px] text-ide-text font-mono truncate">
              {selectedFile ? selectedFile.name : 'No file selected'}
            </div>
            {selectedFile && (
              <div className="text-[10px] text-ide-muted truncate">
                {selectedFile.path}
              </div>
            )}
          </div>

          {/* AST Symbols in Scope */}
          {activeFileSymbols && activeFileSymbols.symbols && activeFileSymbols.symbols.length > 0 && (
            <div className="p-3 bg-ide-surface rounded-lg border border-ide-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ide-text-bright">File Symbols</span>
                <span className="text-[10px] font-mono text-ide-muted">
                  {activeFileSymbols.symbols.length} detected
                </span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-[11px]">
                {activeFileSymbols.symbols.slice(0, 10).map((sym, i) => (
                  <div key={i} className="flex justify-between text-ide-text hover:text-ide-text-bright py-0.5">
                    <span className="truncate text-sky-500 font-semibold">{sym.name}</span>
                    <span className="text-ide-muted">L{sym.startLine}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RAG Knowledge Store */}
          {ragStatus && (
            <div className="p-3 bg-ide-surface rounded-lg border border-ide-border space-y-1.5">
              <div className="flex items-center justify-between font-bold text-ide-text-bright">
                <span>RAG Vector Store</span>
                <span className="text-snap-crimson font-mono text-[11px] font-semibold">Active</span>
              </div>
              <div className="text-[11px] text-ide-text font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-ide-muted">Vectors:</span>
                  <span className="text-ide-text-bright font-semibold">{ragStatus.totalVectors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ide-muted">Dimension:</span>
                  <span className="text-ide-text-bright font-semibold">{ragStatus.embeddingDimension || 384}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hardware & Snapdragon Status */}
          <div className="p-3 bg-ide-surface rounded-lg border border-ide-border space-y-1.5">
            <div className="flex items-center justify-between font-bold text-ide-text-bright">
              <span>Platform Diagnostics</span>
              <Cpu className="w-3.5 h-3.5 text-snap-red" />
            </div>
            <div className="text-[11px] text-ide-text font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-ide-muted">Host:</span>
                <span className="text-ide-text-bright font-semibold truncate max-w-[140px]">{hardwareInfo?.cpuName || 'Windows'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ide-muted">Architecture:</span>
                <span className="text-ide-text-bright font-semibold">{hardwareInfo?.architecture || 'x64'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ide-muted">Privacy:</span>
                <span className="text-emerald-500 font-semibold">100% On-Device</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
