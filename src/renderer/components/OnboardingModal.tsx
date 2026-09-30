/**
 * SnapDev AI - Lightweight First-Launch Onboarding
 * Phase 9: Non-intrusive walkthrough explaining key features and getting started.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  FolderOpen,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Code2,
  Terminal,
  Zap
} from 'lucide-react';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { useProject } from '../hooks/useProject';
import { NavigationPage } from '../../shared/types';
import { AppLogo } from './AppLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavigationPage) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { openProjectDialog, loadDemoProject } = useProject();
  const [currentStep, setCurrentStep] = useState(0);

  const handleFinish = () => {
    localStorage.setItem('snapdev_onboarding_completed', 'true');
    onClose();
  };

  const steps = [
    {
      title: 'Welcome to Rain Code Studio',
      subtitle: 'Privacy-First On-Device AI Developer Copilot',
      icon: <AppLogo size={36} />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-ide-muted">
          <p>
            Rain Code Studio is built specifically for modern developer workstations,
            optimised for <span className="text-white font-medium">Snapdragon PCs</span> while
            running natively on any Windows computer.
          </p>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="p-3 bg-ide-surface/80 rounded-lg border border-ide-border space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% On-Device</span>
              </div>
              <p className="text-[11px] text-ide-muted">
                Your source code never leaves your local hardware. Zero cloud dependencies.
              </p>
            </div>
            <div className="p-3 bg-ide-surface/80 rounded-lg border border-ide-border space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Hardware Aware</span>
              </div>
              <p className="text-[11px] text-ide-muted">
                Automatic CPU/GPU/NPU device awareness and live performance telemetry.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Open or Load a Project',
      subtitle: 'Connect your local repository to begin',
      icon: <FolderOpen className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="space-y-4 text-xs text-ide-muted">
          <p>
            Open any existing Git or source directory, or jumpstart with our
            bundled multi-language demo workspace.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                openProjectDialog();
                handleFinish();
              }}
              className="p-3 rounded-lg bg-ide-sidebar hover:bg-ide-hover border border-ide-border flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-amber-400 group-hover:scale-105 transition-transform" />
                <div>
                  <div className="text-white font-semibold">Open Local Folder</div>
                  <div className="text-[11px] text-ide-muted">Select an existing codebase from disk</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ide-muted group-hover:text-white transition" />
            </button>

            <button
              onClick={() => {
                loadDemoProject();
                handleFinish();
              }}
              className="p-3 rounded-lg bg-snap-crimson/10 hover:bg-snap-crimson/20 border border-snap-crimson/30 flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-snap-crimson group-hover:scale-105 transition-transform" />
                <div>
                  <div className="text-white font-semibold">Load Bundled Demo Project</div>
                  <div className="text-[11px] text-rose-200/80">
                    TypeScript, Python, and C/C++ examples ready to explore
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-white transition" />
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Local Code Intelligence & RAG',
      subtitle: 'Instant symbol indexing and semantic search',
      icon: <Code2 className="w-8 h-8 text-indigo-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-ide-muted">
          <p>
            When you open a project, Rain Code Studio automatically parses source code into an
            AST symbol graph and builds bounded vector embeddings locally.
          </p>
          <ul className="space-y-2 pt-1 font-mono text-[11px]">
            <li className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Deep AST parsing: TypeScript, JavaScript, Python, Go, C/C++</span>
            </li>
            <li className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Hybrid BM25 + Vector semantic retrieval (Phase 4 Local RAG)</span>
            </li>
            <li className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Safe Diffs: AI proposes patches, you inspect and apply explicitly</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Developer Productivity & Shortcuts',
      subtitle: 'Master navigation and command palette',
      icon: <Terminal className="w-8 h-8 text-sky-400" />,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-ide-muted">
          <p>
            Use our built-in command palette and keyboard shortcuts to navigate seamlessly:
          </p>
          <div className="space-y-1.5 font-mono text-[11px] bg-[#080b11] p-3 rounded-lg border border-ide-border">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-white">Command Palette</span>
              <kbd className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-text">
                Ctrl+Shift+P
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-white">Quick File Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-text">
                Ctrl+P
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-white">Toggle Context Panel</span>
              <kbd className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-text">
                Ctrl+J
              </kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-white">Switch Views</span>
              <kbd className="px-1.5 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-text">
                Ctrl+1 .. Ctrl+9
              </kbd>
            </div>
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleFinish}
      maxWidth="md"
      showCloseButton={true}
    >
      <div className="flex flex-col select-none">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ide-border">
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-snap-crimson'
                    : idx < currentStep
                    ? 'w-3 bg-emerald-400'
                    : 'w-3 bg-ide-border'
                }`}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-ide-muted">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Step Content */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ide-surface border border-ide-border flex items-center justify-center shrink-0 shadow-sm">
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight">
              {step.title}
            </h3>
            <p className="text-xs text-ide-muted font-medium mt-0.5 mb-3">
              {step.subtitle}
            </p>
            {step.content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-ide-border">
          <Button variant="ghost" size="sm" onClick={handleFinish}>
            Skip Tour
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Back
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="snap"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  handleFinish();
                  onNavigate('chat');
                }}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
