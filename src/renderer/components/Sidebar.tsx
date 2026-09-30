/**
 * SnapDev AI - Left Sidebar Navigation
 * Phase 9: Collapsible left navigation bar with keyboard shortcut indicators and tooltips.
 */

import React from 'react';
import {
  FolderOpen,
  FolderTree,
  Sparkles,
  SearchCode,
  Bug,
  FlaskConical,
  BookOpen,
  GitBranch,
  Gauge,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Brain,
  LucideIcon
} from 'lucide-react';
import { NavigationPage } from '../../shared/types';
import { NAVIGATION_ITEMS } from '../../shared/constants';

interface SidebarProps {
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  onOpenOnboarding?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ICON_MAP: Record<NavigationPage, LucideIcon> = {
  projects: FolderOpen,
  files: FolderTree,
  chat: Sparkles,
  intelligence: Brain,
  analysis: SearchCode,
  bugs: Bug,
  tests: FlaskConical,
  docs: BookOpen,
  git: GitBranch,
  performance: Gauge,
  settings: Sliders
};

const SHORTCUT_MAP: Record<NavigationPage, string> = {
  projects: 'Ctrl+1',
  files: 'Ctrl+2',
  chat: 'Ctrl+3',
  intelligence: 'Ctrl+I',
  analysis: 'Ctrl+4',
  bugs: 'Ctrl+5',
  tests: 'Ctrl+6',
  docs: 'Ctrl+7',
  git: 'Ctrl+8',
  performance: 'Ctrl+9',
  settings: 'Ctrl+,'
};

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  onOpenOnboarding,
  isCollapsed = false,
  onToggleCollapse
}) => {
  return (
    <aside
      className={`bg-ide-sidebar border-r border-ide-border flex flex-col justify-between select-none shrink-0 transition-all duration-200 z-10 ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Top Nav List */}
      <div className="py-2.5 px-2 flex flex-col gap-1 overflow-y-auto">
        {/* Header / Collapse Toggle */}
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          {!isCollapsed && (
            <span className="text-[11px] font-semibold text-ide-muted uppercase tracking-wider">
              Workspaces
            </span>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              className="p-1 rounded text-ide-muted hover:text-white hover:bg-ide-hover transition ml-auto"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftClose className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.id];
          const isActive = activePage === item.id;
          const shortcut = SHORTCUT_MAP[item.id];

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center w-full rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-2.5 py-2'
              } ${
                isActive
                  ? 'bg-ide-active text-white border-l-2 border-snap-crimson font-semibold shadow-sm'
                  : 'text-ide-muted hover:text-ide-text hover:bg-ide-hover/70'
              }`}
              title={`${item.label} (${shortcut}) — ${item.description}`}
              aria-label={item.label}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-snap-crimson'
                      : 'text-ide-muted group-hover:text-ide-text'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate tracking-tight">{item.label}</span>
                )}
              </div>

              {!isCollapsed && shortcut && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-ide-surface/50 text-ide-muted/70 font-mono shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-ide-border text-[11px] text-ide-muted flex flex-col gap-2 bg-ide-sidebar/50">
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-between font-mono">
              <span>Rain Code Studio</span>
              <span className="text-white font-semibold">v0.9.0</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-emerald-400 font-medium">100% On-Device</span>
              {onOpenOnboarding && (
                <button
                  onClick={onOpenOnboarding}
                  className="text-ide-muted hover:text-white transition flex items-center gap-1"
                  title="Open welcome tour"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Tour</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            {onOpenOnboarding && (
              <button
                onClick={onOpenOnboarding}
                className="text-ide-muted hover:text-white transition p-1 rounded hover:bg-ide-hover"
                title="Open welcome tour"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
