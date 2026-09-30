/**
 * SnapDev AI - useProject Hook
 * React hook to connect components to the ProjectStore.
 * Extended for Phase 3 Code Intelligence.
 */

import { useState, useEffect } from 'react';
import { projectStore } from '../stores/projectStore';
import { SymbolSearchQuery } from '../../shared/types';

export function useProject() {
  const [state, setState] = useState(projectStore.getState());

  useEffect(() => {
    const unsubscribe = projectStore.subscribe(() => {
      setState(projectStore.getState());
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    openProjectDialog: () => projectStore.openProjectDialog(),
    loadProjectByPath: (path: string) => projectStore.loadProjectByPath(path),
    loadDemoProject: () => projectStore.loadDemoProject(),
    selectFile: (file: Parameters<typeof projectStore.selectFile>[0]) => projectStore.selectFile(file),
    clearActiveProject: () => projectStore.clearActiveProject(),
    triggerReindex: () => projectStore.triggerReindex(),
    refreshStatistics: () => projectStore.refreshStatistics(),
    searchSymbols: (query: SymbolSearchQuery) => projectStore.searchSymbols(query),
    selectSymbolForContext: (symbolId: string) => projectStore.selectSymbolForContext(symbolId),
    clearSymbolContext: () => projectStore.clearSymbolContext(),
    executeRagSearch: (query: string, mode?: import('../../shared/types').RAGSearchMode) =>
      projectStore.executeRagSearch(query, mode),
    refreshRagStatus: () => projectStore.refreshRagStatus(),
    selectFileByPath: (filePath: string, lineRange?: { startLine: number; endLine: number }) =>
      projectStore.selectFileByPath(filePath, lineRange),
    clearRetrievalResults: () => projectStore.clearRetrievalResults()
  };
}
