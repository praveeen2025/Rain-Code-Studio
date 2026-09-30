/**
 * SnapDev AI - Root React Application
 * Handles top-level page routing, global layout orchestration, and desktop lifecycle.
 */

import React, { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { NavigationPage } from '../shared/types';
import { ProjectsPage } from './pages/ProjectsPage';
import { FilesPage } from './pages/FilesPage';
import { ChatPage } from './pages/ChatPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { BugsPage } from './pages/BugsPage';
import { TestsPage } from './pages/TestsPage';
import { DocsPage } from './pages/DocsPage';
import { GitPage } from './pages/GitPage';
import { PerformancePage } from './pages/PerformancePage';
import { SettingsPage } from './pages/SettingsPage';
import { ProjectIntelligencePage } from './pages/ProjectIntelligencePage';
import { ModelHubPage } from './pages/ModelHubPage';
import { projectStore } from './stores/projectStore';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('projects');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  useEffect(() => {
    // Initial fetch of recent projects on startup
    if (window.electronAPI) {
      window.electronAPI
        .getRecentProjects()
        .then((recents) => {
          projectStore.setState({ recentProjects: recents });
        })
        .catch(console.error);
    }
  }, []);

  const renderActivePage = () => {
    switch (activePage) {
      case 'projects':
        return <ProjectsPage onNavigateFiles={() => setActivePage('files')} />;
      case 'files':
        return <FilesPage />;
      case 'chat':
        return (
          <ChatPage
            onNavigateToFiles={() => setActivePage('files')}
            onNavigateToModelHub={() => setActivePage('model-hub' as any)}
          />
        );
      case 'intelligence':
        return <ProjectIntelligencePage />;
      case 'model-hub' as any:
        return <ModelHubPage onNavigateChat={() => setActivePage('chat')} />;
      case 'analysis':
        return <AnalysisPage />;
      case 'bugs':
        return <BugsPage onNavigateToWorkspace={() => setActivePage('chat')} />;
      case 'tests':
        return <TestsPage onNavigateToWorkspace={() => setActivePage('chat')} />;
      case 'docs':
        return <DocsPage onNavigateToWorkspace={() => setActivePage('chat')} />;
      case 'git':
        return <GitPage />;
      case 'performance':
        return <PerformancePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ProjectsPage onNavigateFiles={() => setActivePage('files')} />;
    }
  };

  return (
    <MainLayout
      activePage={activePage}
      onSelectPage={(page) => setActivePage(page)}
      isRightPanelOpen={isRightPanelOpen}
      onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
    >
      {renderActivePage()}
    </MainLayout>
  );
};

export default App;
