/**
 * Rain Code Studio - Main Desktop Layout
 * VS Code-style layout architecture:
 * Activity Bar (48px) | Primary Sidebar (260px) | Editor Group (Tabs + Breadcrumbs + Code/Page) | Secondary AI Panel | Bottom Panel | Status Bar
 */

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ActivityBar, ActivityBarItem } from '../components/ActivityBar';
import { PrimarySidebar } from '../components/PrimarySidebar';
import { EditorTabsBar } from '../components/EditorTabsBar';
import { BreadcrumbsBar } from '../components/BreadcrumbsBar';
import { CodeEditorArea } from '../components/CodeEditorArea';
import { BottomPanel, BottomPanelTab } from '../components/BottomPanel';
import { RightContextPanel } from '../components/RightContextPanel';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { ToastContainer } from '../components/common/ToastContainer';
import { CommandPalette } from '../components/CommandPalette';
import { OnboardingModal } from '../components/OnboardingModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useProject } from '../hooks/useProject';
import { useChat } from '../hooks/useChat';
import { editorTabsStore, EditorTab } from '../stores/editorTabsStore';
import { NavigationPage } from '../../shared/types';
import { WebPreviewPanel } from '../components/WebPreviewPanel';
import { AndroidPackagingModal } from '../components/AndroidPackagingModal';

interface MainLayoutProps {
  children: ReactNode;
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activePage,
  onSelectPage,
  isRightPanelOpen,
  onToggleRightPanel
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isSidebarResizingRef = useRef(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('terminal');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteMode, setCommandPaletteMode] = useState<'commands' | 'files'>('commands');
  const [activeActivityItem, setActiveActivityItem] = useState<ActivityBarItem>('explorer');
  const [tabs, setTabs] = useState<EditorTab[]>(editorTabsStore.getTabs());
  const [activeTabId, setActiveTabId] = useState<string | null>(editorTabsStore.getActiveTabId());
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isWebPreviewOpen, setIsWebPreviewOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSidebarResizingRef.current) return;
      const newWidth = e.clientX - 48; // 48px ActivityBar width
      if (newWidth >= 180 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      isSidebarResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleStartSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isSidebarResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('snapdev_onboarding_completed');
  });

  const {
    activeProject,
    selectedFile,
    selectedFileContent,
    isLoading: isProjectLoading,
    openProjectDialog,
    loadDemoProject
  } = useProject();

  const { sendMessage } = useChat();

  useEffect(() => {
    return editorTabsStore.subscribe(() => {
      setTabs(editorTabsStore.getTabs());
      setActiveTabId(editorTabsStore.getActiveTabId());
    });
  }, []);

  // Sync activePage with Activity Bar Item
  useEffect(() => {
    if (activePage === 'files' || activePage === 'projects') {
      setActiveActivityItem('explorer');
    } else if (activePage === 'git') {
      setActiveActivityItem('git');
    } else if (activePage === 'chat') {
      setActiveActivityItem('chat');
    } else if (activePage === 'analysis') {
      setActiveActivityItem('analysis');
    } else if (activePage === 'bugs') {
      setActiveActivityItem('bugs');
    } else if (activePage === 'tests') {
      setActiveActivityItem('tests');
    } else if (activePage === 'docs') {
      setActiveActivityItem('docs');
    } else if (activePage === 'performance') {
      setActiveActivityItem('performance');
    } else if (activePage === 'settings') {
      setActiveActivityItem('settings');
    }
  }, [activePage]);

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onToggleCommandPalette: (mode = 'commands') => {
      setCommandPaletteMode(mode);
      setIsCommandPaletteOpen((prev) => !prev);
    },
    onToggleRightPanel,
    onToggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    onSelectPage
  });

  const handleOpenCommandPalette = (mode: 'commands' | 'files' = 'commands') => {
    setCommandPaletteMode(mode);
    setIsCommandPaletteOpen(true);
  };

  const handleSelectActivityItem = (item: ActivityBarItem) => {
    setActiveActivityItem(item);
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
    if (item === 'explorer') {
      onSelectPage('files');
    } else if (item === 'chat') {
      if (!isRightPanelOpen) {
        onToggleRightPanel();
      }
    } else if (item === 'model-hub') {
      onSelectPage('model-hub' as any);
    }
  };

  const handleSelectTab = (id: string) => {
    editorTabsStore.setActiveTab(id);
    const tab = tabs.find((t) => t.id === id);
    if (tab?.type === 'file') {
      onSelectPage('files');
    } else if (tab?.type === 'git') {
      onSelectPage('git');
    } else if (tab?.type === 'performance') {
      onSelectPage('performance');
    } else if (tab?.type === 'settings') {
      onSelectPage('settings');
    } else if (tab?.type === 'welcome') {
      onSelectPage('projects');
    }
  };

  const handleCloseTab = (id: string) => {
    editorTabsStore.closeTab(id);
  };

  const handleQuickAction = async (action: 'explain' | 'bug_analysis' | 'improve' | 'test_generation' | 'documentation') => {
    if (!selectedFile) return;

    if (!isRightPanelOpen) {
      onToggleRightPanel();
    }

    let prompt = '';
    if (action === 'explain') {
      prompt = `Explain the implementation, purpose, and dependencies of ${selectedFile.name}.`;
    } else if (action === 'bug_analysis') {
      prompt = `Audit ${selectedFile.name} for subtle logic bugs, boundary errors, or null exceptions.`;
    } else if (action === 'improve') {
      prompt = `Suggest concrete performance, type-safety, and readability refactorings for ${selectedFile.name}.`;
    } else if (action === 'test_generation') {
      prompt = `Generate a comprehensive automated unit test suite for ${selectedFile.name}.`;
    } else if (action === 'documentation') {
      prompt = `Generate professional docstrings and documentation for ${selectedFile.name}.`;
    }

    if (prompt) {
      await sendMessage(prompt, activeProject?.id);
    }
  };

  // Determine whether to show CodeEditorArea or the full page component
  const currentTab = tabs.find((t) => t.id === activeTabId);
  const showCodeEditor = activePage === 'files' || currentTab?.type === 'file';

  return (
    <div className="h-screen w-screen flex flex-col bg-ide-bg text-ide-text overflow-hidden select-none">
      {/* VS Code Custom Title Bar */}
      <TopBar
        onNavigateSettings={() => onSelectPage('settings')}
        onNavigatePage={onSelectPage}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={onToggleRightPanel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isBottomPanelOpen={isBottomPanelOpen}
        onToggleBottomPanel={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        onOpenCommandPalette={handleOpenCommandPalette}
        onToggleWebPreview={() => setIsWebPreviewOpen(!isWebPreviewOpen)}
        isWebPreviewOpen={isWebPreviewOpen}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onOpenBottomTab={(tab) => {
          setBottomPanelTab(tab);
          setIsBottomPanelOpen(true);
        }}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activity Bar (48px narrow icon strip) */}
        <ActivityBar
          activeItem={activeActivityItem}
          onSelectItem={handleSelectActivityItem}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Primary Sidebar (Collapsible, Resizable) */}
        {isSidebarOpen && (
          <div style={{ width: `${sidebarWidth}px` }} className="relative flex shrink-0 h-full">
            <PrimarySidebar
              activeItem={activeActivityItem}
              onNavigatePage={onSelectPage}
              onSelectSymbolLine={(line) => setSelectedLine(line)}
            />
            <div
              onMouseDown={handleStartSidebarResize}
              className="absolute top-0 right-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-ide-accent/40 transition z-20"
              title="Drag to resize sidebar"
            />
          </div>
        )}

        {/* Center Editor Group */}
        <main className="flex-1 flex flex-col overflow-hidden bg-ide-editor relative">
          {/* Editor Tabs Bar */}
          <EditorTabsBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={() => handleOpenCommandPalette('files')}
            onToggleWebPreview={() => setIsWebPreviewOpen(!isWebPreviewOpen)}
            isWebPreviewOpen={isWebPreviewOpen}
          />

          {/* Breadcrumbs Navigation */}
          <BreadcrumbsBar
            projectName={activeProject?.name}
            filePath={selectedFile?.path}
          />

          {/* Main Editor View / Page Area with optional Web Preview */}
          <div className="flex-1 flex overflow-hidden relative">
            <div className={`${isWebPreviewOpen ? 'w-1/2' : 'flex-1'} flex flex-col overflow-hidden`}>
              {showCodeEditor ? (
                <CodeEditorArea
                  selectedFile={selectedFile}
                  content={selectedFileContent}
                  isLoading={isProjectLoading}
                  onOpenFolder={openProjectDialog}
                  onLoadDemo={loadDemoProject}
                  onRunQuickAction={handleQuickAction}
                  selectedLine={selectedLine}
                />
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {children}
                </div>
              )}
            </div>

            {isWebPreviewOpen && (
              <div className="w-1/2 flex flex-col overflow-hidden border-l border-ide-border">
                <WebPreviewPanel
                  selectedFile={selectedFile}
                  fileContent={selectedFileContent}
                  onClose={() => setIsWebPreviewOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Bottom Panel (Problems, Output, Terminal/Benchmark, Task History) */}
          <BottomPanel
            isOpen={isBottomPanelOpen}
            onClose={() => setIsBottomPanelOpen(false)}
            activeTab={bottomPanelTab}
            onSelectTab={setBottomPanelTab}
            onOpenFile={(file, line) => {
              editorTabsStore.openFileTab(file);
              if (line) setSelectedLine(line);
            }}
          />
        </main>

        {/* Right Secondary Sidebar: AI Copilot & Context */}
        <RightContextPanel
          isOpen={isRightPanelOpen}
          onClose={onToggleRightPanel}
          onNavigateAI={() => onSelectPage('chat')}
          onNavigatePerformance={() => onSelectPage('performance')}
        />
      </div>

      {/* VS Code Blue Status Bar */}
      <StatusBar
        onNavigateGit={() => onSelectPage('git')}
        onNavigatePerformance={() => onSelectPage('performance')}
        onNavigateFiles={() => onSelectPage('files')}
        onNavigateModelHub={() => onSelectPage('model-hub' as any)}
      />

      {/* Floating Notifications */}
      <ToastContainer />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onSelectPage}
        onToggleRightPanel={onToggleRightPanel}
        mode={commandPaletteMode}
      />

      {/* First-Launch Onboarding Walkthrough */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onNavigate={onSelectPage}
      />

      {/* Android Packaging Architecture & Export Modal */}
      <AndroidPackagingModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
};
