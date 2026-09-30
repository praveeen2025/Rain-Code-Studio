/**
 * SnapDev AI - Automated Test Suite Generator
 * Phase 6 Active: Practical Developer AI Test Generation.
 */

import React from 'react';
import { TestTube2, Sparkles, CheckCircle2, ArrowRight, Layers, Cpu } from 'lucide-react';
import { useProject } from '../hooks/useProject';

interface TestsPageProps {
  onNavigateToWorkspace?: () => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({ onNavigateToWorkspace }) => {
  const { activeProject, selectedFile, selectedSymbolContext } = useProject();

  return (
    <div className="flex-1 flex flex-col h-full bg-ide-bg text-ide-text overflow-y-auto p-8 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-ide-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TestTube2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-wide">Automated Test Generation</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Phase 6 Active
                </span>
              </div>
              <p className="text-xs text-ide-muted mt-1">
                Synthesize unit and integration test suites with automatic framework detection (Vitest, Jest, Pytest).
              </p>
            </div>
          </div>

          {onNavigateToWorkspace && (
            <button
              onClick={onNavigateToWorkspace}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open in Developer Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Card */}
        <div className="p-5 rounded-2xl bg-ide-panel border border-ide-border space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Test Synthesis Engine Status</span>
            </div>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border/60">
              <div className="text-[10px] text-ide-muted uppercase font-mono">Target Project</div>
              <div className="font-semibold text-white truncate mt-0.5">
                {activeProject?.name || 'No project open'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border/60">
              <div className="text-[10px] text-ide-muted uppercase font-mono">Selected Symbol</div>
              <div className="font-semibold text-emerald-400 truncate mt-0.5">
                {selectedSymbolContext?.symbol?.name || selectedFile?.name || 'None selected'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-ide-bg/80 border border-ide-border/60">
              <div className="text-[10px] text-ide-muted uppercase font-mono">Execution Safety</div>
              <div className="font-semibold text-purple-300 truncate mt-0.5">
                No Auto Execution
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-ide-panel/80 border border-ide-border space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Framework Adaptation</span>
            </div>
            <p className="text-xs text-ide-muted leading-relaxed">
              Detects Vitest, Jest, Pytest, or JUnit from project configurations and writes idiomatic test fixtures with mocks and assertions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-ide-panel/80 border border-ide-border space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Preview Before Writing</span>
            </div>
            <p className="text-xs text-ide-muted leading-relaxed">
              Generated test cases appear in a unified diff preview. You explicitly choose to apply them to your test directory or reject them.
            </p>
          </div>
        </div>

        {/* Quick Launch CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-purple-950/30 border border-emerald-500/30 text-center space-y-3">
          <h2 className="text-sm font-bold text-white">Generate tests for your code</h2>
          <p className="text-xs text-ide-muted max-w-md mx-auto">
            Select any function or module in Explorer and click Generate Tests in the AI Developer Workspace.
          </p>
          {onNavigateToWorkspace && (
            <button
              onClick={onNavigateToWorkspace}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/25 transition-all"
            >
              <TestTube2 className="w-4 h-4" />
              <span>Open Test Generator in Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
