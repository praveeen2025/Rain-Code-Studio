/**
 * Rain Code Studio - Top Bar
 * VS Code custom title bar with project title, search / Command Palette, layout controls, and theme switch.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  PanelLeft,
  PanelBottom,
  PanelRight,
  Sun,
  Moon,
  Settings,
  Folder,
  Globe,
  Smartphone
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { themeStore } from '../stores/themeStore';
import { AppLogo } from './AppLogo';
import { TopMenuBar } from './TopMenuBar';
import { NavigationPage } from '../../shared/types';

interface TopBarProps {
  onNavigateSettings: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isBottomPanelOpen?: boolean;
  onToggleBottomPanel?: () => void;
  onOpenCommandPalette?: (mode?: 'commands' | 'files') => void;
  onNavigatePage?: (page: NavigationPage) => void;
  onToggleWebPreview?: () => void;
  isWebPreviewOpen?: boolean;
  onOpenAndroidModal?: () => void;
  onOpenBottomTab?: (tab: 'terminal' | 'problems' | 'output' | 'debug' | 'task_history') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onNavigateSettings,
  isRightPanelOpen,
  onToggleRightPanel,
  isSidebarOpen = true,
  onToggleSidebar,
  isBottomPanelOpen = false,
  onToggleBottomPanel,
  onOpenCommandPalette,
  onNavigatePage,
  onToggleWebPreview,
  isWebPreviewOpen = false,
  onOpenAndroidModal,
  onOpenBottomTab
}) => {
  const { activeProject } = useProject();
  const [isDark, setIsDark] = useState<boolean>(themeStore.isDark());

  useEffect(() => {
    return themeStore.subscribe(() => {
      setIsDark(themeStore.isDark());
    });
  }, []);

  return (
    <header className="h-9 bg-ide-sidebar border-b border-ide-border flex items-center justify-between px-3 select-none shrink-0 drag-region z-20 text-xs">
      {/* Left: App Logo, Title & Top Menu Bar */}
      <div className="flex items-center gap-3 no-drag-region">
        <div className="flex items-center gap-2">
          <AppLogo size={18} />
          <span className="font-semibold tracking-tight text-ide-text-bright text-[12px] hidden md:inline">
            Rain Code Studio
          </span>
        </div>

        {/* Top Dropdown Menu Bar (File, Edit, Selection, View, Go, Run, Terminal, Help) */}
        <TopMenuBar
          onNavigatePage={onNavigatePage || (() => {})}
          onToggleSidebar={onToggleSidebar}
          onToggleBottomPanel={onToggleBottomPanel}
          onOpenBottomTab={onOpenBottomTab}
          onOpenCommandPalette={onOpenCommandPalette}
          onToggleWebPreview={onToggleWebPreview}
          onOpenAndroidModal={onOpenAndroidModal}
        />

        {activeProject && (
          <div className="hidden lg:flex items-center gap-1.5 text-ide-muted text-[11px] font-mono border-l border-ide-border/60 pl-2.5">
            <Folder className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate max-w-[140px] text-ide-text">{activeProject.name}</span>
          </div>
        )}
      </div>

      {/* Center: Command Palette Search Bar */}
      <div className="flex items-center justify-center flex-1 max-w-md px-4 no-drag-region">
        {onOpenCommandPalette && (
          <button
            onClick={() => onOpenCommandPalette('commands')}
            className="w-full flex items-center gap-2 px-3 py-1 rounded bg-ide-input border border-ide-input-border text-ide-muted hover:text-ide-text transition group shadow-inner text-left"
            title="Search files and run commands (Ctrl+P / Ctrl+Shift+P)"
          >
            <Search className="w-3.5 h-3.5 text-ide-muted group-hover:text-ide-text shrink-0" />
            <span className="text-[11px] truncate flex-1">
              {activeProject ? `Search in ${activeProject.name}` : 'Search files & commands'}
            </span>
            <kbd className="px-1.5 py-0.2 rounded bg-ide-sidebar border border-ide-border text-[10px] font-mono text-ide-muted">
              Ctrl+P
            </kbd>
          </button>
        )}
      </div>

      {/* Right: Layout Toggle Buttons, Theme Switcher, Settings */}
      <div className="flex items-center gap-1 no-drag-region text-ide-muted">
        {/* Toggle Primary Sidebar */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Hide Primary Side Bar (Ctrl+B)' : 'Show Primary Side Bar (Ctrl+B)'}
            className={`p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition ${
              isSidebarOpen ? 'text-ide-accent' : ''
            }`}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle Bottom Panel */}
        {onToggleBottomPanel && (
          <button
            onClick={onToggleBottomPanel}
            title={isBottomPanelOpen ? 'Hide Bottom Panel (Ctrl+`)' : 'Show Bottom Panel (Ctrl+`)'}
            className={`p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition ${
              isBottomPanelOpen ? 'text-ide-accent' : ''
            }`}
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle Secondary AI Panel */}
        <button
          onClick={onToggleRightPanel}
          title={isRightPanelOpen ? 'Hide AI Copilot (Ctrl+L)' : 'Show AI Copilot (Ctrl+L)'}
          className={`p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition ${
            isRightPanelOpen ? 'text-ide-accent' : ''
          }`}
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Web Preview */}
        {onToggleWebPreview && (
          <button
            onClick={onToggleWebPreview}
            title="Integrated Web Preview (Browser)"
            className={`p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition ${
              isWebPreviewOpen ? 'text-ide-accent bg-ide-surface' : ''
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Android / APK Packaging Architecture */}
        {onOpenAndroidModal && (
          <button
            onClick={onOpenAndroidModal}
            title="Android APK Architecture & Export Guide"
            className="p-1.5 rounded hover:text-emerald-400 hover:bg-ide-hover transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Instant Theme Toggle Button */}
        <button
          onClick={() => themeStore.toggleTheme()}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition ml-1"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 hover:scale-110 transition-transform" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-blue-400 hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onNavigateSettings}
          title="Settings (Ctrl+,)"
          className="p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
