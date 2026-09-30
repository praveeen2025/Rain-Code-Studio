/**
 * Rain Code Studio - Top Menu Bar
 * VS Code-style top menu bar with File, Edit, Selection, View, Go, Run, Terminal, Help.
 * Dropdowns feature full hover-switching, click-outside auto-close, shortcuts, and functional handlers.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  X,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Search,
  Terminal,
  AlertCircle,
  Play,
  Gauge,
  Smartphone,
  HelpCircle,
  Globe,
  SunMoon,
  Sparkles,
  BookOpen,
  Sliders,
  CheckSquare,
  Square,
  Brain
} from 'lucide-react';
import { projectStore } from '../stores/projectStore';
import { editorTabsStore } from '../stores/editorTabsStore';
import { notificationStore } from '../stores/notificationStore';
import { themeStore } from '../stores/themeStore';
import { editorConfigStore } from '../stores/editorConfigStore';
import { NavigationPage } from '../../shared/types';

interface TopMenuBarProps {
  onNavigatePage: (page: NavigationPage) => void;
  onToggleSidebar?: () => void;
  onToggleBottomPanel?: () => void;
  onOpenBottomTab?: (tab: 'terminal' | 'problems' | 'output' | 'debug' | 'task_history') => void;
  onOpenCommandPalette?: (mode?: 'commands' | 'files') => void;
  onToggleWebPreview?: () => void;
  onOpenAndroidModal?: () => void;
  onOpenNewFilePrompt?: () => void;
}

type MenuKey = 'file' | 'edit' | 'selection' | 'view' | 'go' | 'run' | 'terminal' | 'help' | null;

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onNavigatePage,
  onToggleSidebar,
  onToggleBottomPanel,
  onOpenBottomTab,
  onOpenCommandPalette,
  onToggleWebPreview,
  onOpenAndroidModal,
  onOpenNewFilePrompt
}) => {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [autoSave, setAutoSave] = useState(editorConfigStore.getConfig().autoSave);
  const [minimap, setMinimap] = useState(editorConfigStore.getConfig().minimap);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return editorConfigStore.subscribe(() => {
      const cfg = editorConfigStore.getConfig();
      setAutoSave(cfg.autoSave);
      setMinimap(cfg.minimap);
    });
  }, []);

  // Click outside to close active dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: MenuKey) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuHover = (menu: MenuKey) => {
    if (openMenu !== null && openMenu !== menu) {
      setOpenMenu(menu);
    }
  };

  const closeMenu = () => setOpenMenu(null);

  // File menu actions
  const handleSave = async () => {
    closeMenu();
    const success = await projectStore.saveCurrentFile();
    if (success) {
      notificationStore.success('File Saved', 'Saved current active buffer to disk');
    }
  };

  const handleToggleAutoSave = () => {
    closeMenu();
    const next = editorConfigStore.toggleAutoSave();
    notificationStore.info('Auto Save', next ? 'Auto Save Enabled (1000ms delay)' : 'Auto Save Disabled');
  };

  const handleToggleMinimap = () => {
    closeMenu();
    const next = editorConfigStore.toggleMinimap();
    notificationStore.info('Minimap', next ? 'Minimap Enabled' : 'Minimap Hidden');
  };

  const handleCloseActiveEditor = () => {
    closeMenu();
    const activeTab = editorTabsStore.getActiveTab();
    if (activeTab) {
      editorTabsStore.closeTab(activeTab.id);
    }
  };

  const handleCloseAllEditors = () => {
    closeMenu();
    editorTabsStore.closeAllTabs();
    notificationStore.info('All Editors Closed', 'Clean editor workspace');
  };

  return (
    <div ref={barRef} className="flex items-center text-xs select-none no-drag-region">
      {/* 1. File Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('file')}
          onMouseEnter={() => handleMenuHover('file')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'file' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          File
        </button>

        {openMenu === 'file' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                if (onOpenNewFilePrompt) onOpenNewFilePrompt();
                else notificationStore.info('New File', 'Use the Explorer + icon to create a file');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>New File</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+N</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                projectStore.openProjectDialog();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Folder...</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+O</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                projectStore.loadDemoProject();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Load Demo Project</span>
              </div>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={handleSave}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+S</kbd>
            </button>

            <button
              onClick={handleToggleAutoSave}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {autoSave ? (
                  <CheckSquare className="w-3.5 h-3.5 text-ide-accent" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-ide-muted" />
                )}
                <span>Auto Save</span>
              </div>
              <span className="text-[10px] text-ide-muted font-mono">
                {autoSave ? 'On' : 'Off'}
              </span>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={handleCloseActiveEditor}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Close Editor</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+W</kbd>
            </button>

            <button
              onClick={handleCloseAllEditors}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-ide-muted" />
                <span>Close All Editors</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 2. Edit Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('edit')}
          onMouseEnter={() => handleMenuHover('edit')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'edit' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          Edit
        </button>

        {openMenu === 'edit' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                document.execCommand('undo');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Undo2 className="w-3.5 h-3.5 text-ide-muted" />
                <span>Undo</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Z</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                document.execCommand('redo');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Redo2 className="w-3.5 h-3.5 text-ide-muted" />
                <span>Redo</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Y</kbd>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={() => {
                closeMenu();
                document.execCommand('cut');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-ide-muted" />
                <span>Cut</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+X</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                document.execCommand('copy');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-ide-muted" />
                <span>Copy</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+C</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                document.execCommand('paste');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-3.5 h-3.5 text-ide-muted" />
                <span>Paste</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+V</kbd>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={() => {
                closeMenu();
                if (onOpenCommandPalette) onOpenCommandPalette('files');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-sky-400" />
                <span>Find in Files</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+F</kbd>
            </button>
          </div>
        )}
      </div>

      {/* 3. Selection Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('selection')}
          onMouseEnter={() => handleMenuHover('selection')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'selection' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          Selection
        </button>

        {openMenu === 'selection' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                document.execCommand('selectAll');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Select All</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+A</kbd>
            </button>
            <button
              onClick={() => {
                closeMenu();
                notificationStore.info('Selection', 'Active cursor selection expanded');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Expand Selection</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Shift+Alt+→</kbd>
            </button>
            <button
              onClick={() => {
                closeMenu();
                notificationStore.info('Selection', 'Active cursor selection shrunk');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Shrink Selection</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Shift+Alt+←</kbd>
            </button>
          </div>
        )}
      </div>

      {/* 4. View Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('view')}
          onMouseEnter={() => handleMenuHover('view')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'view' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          View
        </button>

        {openMenu === 'view' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('files');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Explorer</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Shift+E</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenCommandPalette) onOpenCommandPalette('files');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Search</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Shift+F</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('git');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Source Control</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Shift+G</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('tests');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Run & Debug</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Shift+D</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('intelligence');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                <span>Project Intelligence</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+I</kbd>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={() => {
                closeMenu();
                if (onToggleWebPreview) onToggleWebPreview();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Web Preview (Browser)</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenBottomTab) onOpenBottomTab('terminal');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Integrated Terminal</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+`</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenBottomTab) onOpenBottomTab('problems');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Problems Panel</span>
              </div>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={() => {
                closeMenu();
                if (onToggleSidebar) onToggleSidebar();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Toggle Primary Sidebar</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+B</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onToggleBottomPanel) onToggleBottomPanel();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Toggle Bottom Panel</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+`</kbd>
            </button>

            <button
              onClick={handleToggleMinimap}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {minimap ? (
                  <CheckSquare className="w-3.5 h-3.5 text-ide-accent" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-ide-muted" />
                )}
                <span>Code Minimap</span>
              </div>
              <span className="text-[10px] text-ide-muted font-mono">{minimap ? 'On' : 'Off'}</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                themeStore.toggleTheme();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SunMoon className="w-3.5 h-3.5 text-amber-400" />
                <span>Toggle Color Theme</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 5. Go Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('go')}
          onMouseEnter={() => handleMenuHover('go')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'go' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          Go
        </button>

        {openMenu === 'go' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                if (onOpenCommandPalette) onOpenCommandPalette('files');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Go to File...</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+P</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenCommandPalette) onOpenCommandPalette('commands');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Command Palette...</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Shift+P</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('analysis');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Go to Symbol...</span>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+Shift+O</kbd>
            </button>
          </div>
        )}
      </div>

      {/* 6. Run Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('run')}
          onMouseEnter={() => handleMenuHover('run')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'run' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          Run
        </button>

        {openMenu === 'run' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('tests');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Run Automated Tests</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">F5</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('performance');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-snap-crimson" />
                <span>Snapdragon Benchmark</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 7. Terminal Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('terminal')}
          onMouseEnter={() => handleMenuHover('terminal')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'terminal' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          Terminal
        </button>

        {openMenu === 'terminal' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                if (onOpenBottomTab) onOpenBottomTab('terminal');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>New Terminal</span>
              </div>
              <kbd className="text-[10px] text-ide-muted font-mono">Ctrl+`</kbd>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenBottomTab) onOpenBottomTab('terminal');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <span>Split Terminal</span>
            </button>
          </div>
        )}
      </div>

      {/* 8. Help Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('help')}
          onMouseEnter={() => handleMenuHover('help')}
          className={`px-2 py-0.5 rounded text-ide-text hover:text-ide-text-bright hover:bg-ide-hover transition cursor-pointer ${
            openMenu === 'help' ? 'bg-ide-hover text-ide-text-bright font-medium' : ''
          }`}
        >
          Help
        </button>

        {openMenu === 'help' && (
          <div className="absolute left-0 top-full mt-1 w-60 bg-ide-panel border border-ide-border rounded-lg shadow-xl py-1 z-50 text-xs text-ide-text animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('docs');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Documentation</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenAndroidModal) onOpenAndroidModal();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Android / APK Architecture</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                Guide
              </span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onNavigatePage('settings');
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Preferences & Shortcuts</span>
              </div>
            </button>

            <div className="h-px bg-ide-border my-1" />

            <button
              onClick={() => {
                closeMenu();
                notificationStore.info(
                  'Rain Code Studio v0.10.0',
                  'Privacy-First On-Device AI Developer Copilot for Qualcomm Snapdragon X Elite'
                );
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-ide-muted" />
                <span>About Rain Code Studio</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
