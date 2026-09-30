/**
 * SnapDev AI - QuickActionsBar Component
 * Phase 6: Contextual Developer AI Quick Actions.
 * Triggers Explain, Find Bug, Improve, Review, Generate Tests, and Generate Docs with on-device RAG grounding.
 */

import React from 'react';
import {
  FileText,
  Bug,
  Sparkles,
  ShieldCheck,
  TestTube2,
  BookOpen
} from 'lucide-react';
import { TaskType } from '../../shared/types';

interface QuickActionsBarProps {
  onSelectAction: (action: TaskType) => void;
  disabled?: boolean;
  activeAction?: TaskType | null;
  hasFileSelected?: boolean;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onSelectAction,
  disabled = false,
  activeAction = null,
  hasFileSelected = false
}) => {
  const actions: {
    id: TaskType;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }[] = [
    {
      id: 'explain',
      label: 'Explain',
      icon: <FileText className="w-3.5 h-3.5" />,
      color: 'hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10',
      description: 'Explain code architecture, purpose & logic'
    },
    {
      id: 'bug_analysis',
      label: 'Find Bug',
      icon: <Bug className="w-3.5 h-3.5" />,
      color: 'hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10',
      description: 'Analyze bugs, crashes, or stack traces'
    },
    {
      id: 'improve',
      label: 'Improve',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: 'hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10',
      description: 'Suggest performance, typing & clean code improvements'
    },
    {
      id: 'review',
      label: 'Review',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      color: 'hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/10',
      description: 'AI code review with categorized findings'
    },
    {
      id: 'test_generation',
      label: 'Generate Tests',
      icon: <TestTube2 className="w-3.5 h-3.5" />,
      color: 'hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10',
      description: 'Generate unit/integration tests with detected framework'
    },
    {
      id: 'documentation',
      label: 'Generate Docs',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      color: 'hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10',
      description: 'Generate docstrings, type annotations & API docs'
    }
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none">
      <span className="text-[11px] font-semibold text-ide-muted/80 uppercase tracking-wider px-2 shrink-0">
        AI Actions:
      </span>
      {actions.map((act) => {
        const isActive = activeAction === act.id;
        return (
          <button
            key={act.id}
            onClick={() => onSelectAction(act.id)}
            disabled={disabled}
            title={act.description}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm shadow-purple-500/20'
                : `bg-ide-panel/80 border-ide-border text-ide-text ${act.color}`
            }`}
          >
            {act.icon}
            <span>{act.label}</span>
            {hasFileSelected && act.id === 'explain' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
};
