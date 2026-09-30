/**
 * SnapDev AI - Projects Workspace Page
 * Primary landing view displaying project status, actions, and recent projects.
 */

import React from 'react';
import {
  FolderOpen,
  Sparkles,
  Shield,
  Cpu,
  Lock,
  ArrowRight,
  FolderGit2,
  Clock
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { truncatePath } from '../utils/formatters';

interface Props {
  onNavigateFiles: () => void;
}

export const ProjectsPage: React.FC<Props> = ({ onNavigateFiles }) => {
  const {
    activeProject,
    recentProjects,
    isLoading,
    error,
    openProjectDialog,
    loadDemoProject,
    loadProjectByPath
  } = useProject();

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      {/* Hero Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-snap-crimson/15 text-rose-300 border border-snap-crimson/30">
            Snapdragon PC Edition
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-ide-surface text-ide-muted border border-ide-border">
            Phase 1 — Foundation
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Rain Code <span className="text-snap-red">Studio</span>
        </h1>
        <p className="text-base text-ide-muted mt-1 font-normal">
          Privacy-First On-Device AI Developer Copilot
        </p>

        {/* Current Status Banner */}
        <div className="mt-5 p-4 rounded-xl bg-ide-surface/80 border border-ide-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <div>
              <div className="text-xs font-semibold text-white">Status:</div>
              <div className="text-xs text-ide-muted">
                {activeProject
                  ? `Active project loaded: ${activeProject.name}`
                  : 'Ready to analyse your project.'}
              </div>
            </div>
          </div>

          {activeProject && (
            <button
              onClick={onNavigateFiles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ide-active hover:bg-ide-hover border border-ide-border text-xs text-white transition"
            >
              <span>Explore Files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
          <div className="font-semibold mb-1">Action Error:</div>
          <div>{error}</div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => openProjectDialog()}
          disabled={isLoading}
          className="flex flex-col items-start p-5 rounded-xl bg-ide-surface hover:bg-ide-hover border border-ide-border hover:border-ide-muted/50 text-left transition group shadow-sm disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-lg bg-ide-sidebar border border-ide-border flex items-center justify-center text-snap-crimson mb-3 group-hover:scale-105 transition-transform">
            <FolderOpen className="w-5 h-5" />
          </div>
          <span className="font-semibold text-white text-sm mb-1 flex items-center gap-1.5">
            Open Project
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="text-xs text-ide-muted leading-relaxed">
            Select an existing codebase from your local disk. Files never leave your device.
          </span>
        </button>

        <button
          onClick={() => loadDemoProject()}
          disabled={isLoading}
          className="flex flex-col items-start p-5 rounded-xl bg-ide-surface hover:bg-ide-hover border border-ide-border hover:border-ide-muted/50 text-left transition group shadow-sm disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-lg bg-ide-sidebar border border-ide-border flex items-center justify-center text-snap-blue mb-3 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold text-white text-sm mb-1 flex items-center gap-1.5">
            Create Demo Project
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="text-xs text-ide-muted leading-relaxed">
            Load the bundled sample workspace to inspect project intelligence and desktop tools.
          </span>
        </button>
      </div>

      {/* Recent Projects List */}
      {recentProjects.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-ide-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Recent Workspaces</span>
          </div>

          <div className="space-y-2">
            {recentProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => loadProjectByPath(proj.path)}
                className="flex items-center justify-between p-3 rounded-lg bg-ide-surface hover:bg-ide-hover border border-ide-border cursor-pointer transition text-xs group"
              >
                <div className="flex items-center gap-3 truncate">
                  <FolderGit2 className="w-4 h-4 text-ide-muted group-hover:text-amber-400 shrink-0 transition-colors" />
                  <div className="truncate">
                    <div className="font-medium text-white group-hover:text-snap-blue transition-colors">
                      {proj.name}
                    </div>
                    <div className="text-[11px] text-ide-muted font-mono truncate">
                      {truncatePath(proj.path, 55)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {proj.isDemo && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Demo
                    </span>
                  )}
                  <span className="text-[11px] text-ide-muted font-mono hidden sm:inline">
                    {proj.fileCount} files
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ide-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy & Architecture Cards */}
      <div className="mt-auto pt-6 border-t border-ide-border grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-lg bg-ide-surface/40 border border-ide-border/60">
          <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
            <Lock className="w-4 h-4 text-snap-crimson" />
            <span>100% On-Device</span>
          </div>
          <p className="text-[11px] text-ide-muted leading-relaxed">
            Zero cloud code transmission. All file parsing and future AI inference execute locally on your hardware.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-ide-surface/40 border border-ide-border/60">
          <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
            <Cpu className="w-4 h-4 text-snap-blue" />
            <span>Snapdragon Engine</span>
          </div>
          <p className="text-[11px] text-ide-muted leading-relaxed">
            Architected for Qualcomm Snapdragon X Elite with dedicated NPU execution via QNN runtime.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-ide-surface/40 border border-ide-border/60">
          <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Phase 1 Verified</span>
          </div>
          <p className="text-[11px] text-ide-muted leading-relaxed">
            Secure Electron bridge with context isolation, active Python backend monitoring, and zero fake mocks.
          </p>
        </div>
      </div>
    </div>
  );
};
