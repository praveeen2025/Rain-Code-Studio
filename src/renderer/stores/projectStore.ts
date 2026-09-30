/**
 * SnapDev AI - Project Store
 * Lightweight observable store for active project state, file tree, and Phase 3 code index.
 */

import {
  Project,
  ProjectFile,
  ProjectIndexStatus,
  IndexProgress,
  ProjectStatistics,
  ParsedFile,
  CodeSymbol,
  SymbolSearchQuery,
  SymbolContextResult
} from '../../shared/types';

type Listener = () => void;

interface ProjectStoreState {
  activeProject: Project | null;
  recentProjects: Project[];
  fileTree: ProjectFile[];
  selectedFile: ProjectFile | null;
  selectedFileContent: string | null;
  isLoading: boolean;
  error: string | null;

  // Phase 3 Indexing State
  indexStatus: ProjectIndexStatus;
  indexProgress: IndexProgress | null;
  statistics: ProjectStatistics | null;
  activeFileSymbols: ParsedFile | null;
  selectedSymbolContext: SymbolContextResult | null;

  // Phase 4 RAG State
  retrievedResults: import('../../shared/types').RetrievalResult[];
  activeContextPackage: import('../../shared/types').AIContextPackage | null;
  ragStatus: import('../../shared/types').RAGStatusResponse | null;
  isRagSearching: boolean;
  targetLineRange: { startLine: number; endLine: number } | null;
  cursorPosition: { line: number; column: number };
}

class ProjectStore {
  private state: ProjectStoreState = {
    activeProject: null,
    recentProjects: [],
    fileTree: [],
    selectedFile: null,
    selectedFileContent: null,
    isLoading: false,
    error: null,
    indexStatus: 'not_indexed',
    indexProgress: null,
    statistics: null,
    activeFileSymbols: null,
    selectedSymbolContext: null,
    retrievedResults: [],
    activeContextPackage: null,
    ragStatus: null,
    isRagSearching: false,
    targetLineRange: null,
    cursorPosition: { line: 1, column: 1 }
  };

  private listeners: Set<Listener> = new Set();
  private hasInitializedListeners = false;

  constructor() {
    this.setupIpcListeners();
  }

  private setupIpcListeners(): void {
    if (this.hasInitializedListeners || typeof window === 'undefined' || !window.electronAPI) {
      return;
    }
    this.hasInitializedListeners = true;

    window.electronAPI.onIndexProgress((progress) => {
      this.setState({
        indexProgress: progress,
        indexStatus: 'indexing'
      });
    });

    window.electronAPI.onIndexStatusChange((status) => {
      this.setState({ indexStatus: status });
      if (status === 'indexed' || status === 'partial') {
        this.refreshStatistics();
      }
    });
  }

  public getState(): ProjectStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.setupIpcListeners();
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setState(updates: Partial<ProjectStoreState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  public setCursorPosition(line: number, column: number): void {
    if (this.state.cursorPosition.line !== line || this.state.cursorPosition.column !== column) {
      this.state.cursorPosition = { line, column };
      this.notify();
    }
  }

  public async openProjectDialog(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      this.setState({ error: 'Electron desktop bridge unavailable.' });
      return false;
    }

    try {
      this.setState({ isLoading: true, error: null });
      const dirPath = await window.electronAPI.selectProjectDirectory();
      if (!dirPath) {
        this.setState({ isLoading: false });
        return false;
      }

      return await this.loadProjectByPath(dirPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      return false;
    }
  }

  public async loadProjectByPath(dirPath: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) return false;

    try {
      this.setState({ isLoading: true, error: null });
      const project = await window.electronAPI.loadProject(dirPath);
      const fileTree = await window.electronAPI.readProjectTree(dirPath);
      const recents = await window.electronAPI.getRecentProjects();

      this.setState({
        activeProject: project,
        recentProjects: recents,
        fileTree,
        selectedFile: null,
        selectedFileContent: null,
        activeFileSymbols: null,
        selectedSymbolContext: null,
        isLoading: false,
        error: null
      });

      this.refreshStatistics();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      return false;
    }
  }

  public async loadDemoProject(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) return false;

    try {
      this.setState({ isLoading: true, error: null });
      const project = await window.electronAPI.loadDemoProject();
      const fileTree = await window.electronAPI.readProjectTree(project.path);
      const recents = await window.electronAPI.getRecentProjects();

      this.setState({
        activeProject: project,
        recentProjects: recents,
        fileTree,
        selectedFile: null,
        selectedFileContent: null,
        activeFileSymbols: null,
        selectedSymbolContext: null,
        isLoading: false,
        error: null
      });

      this.refreshStatistics();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      return false;
    }
  }

  public async selectFile(file: ProjectFile): Promise<void> {
    if (file.isDirectory) return;
    if (typeof window === 'undefined' || !window.electronAPI) return;

    try {
      this.setState({ isLoading: true, selectedFile: file, error: null });
      const { editorTabsStore } = await import('./editorTabsStore');
      const buffered = editorTabsStore.getTabBuffer(`file-${file.path}`);
      const content = buffered ?? (await window.electronAPI.readProjectFile(file.path));
      let fileSymbols: ParsedFile | null = null;

      if (this.state.activeProject) {
        fileSymbols = await window.electronAPI.getFileSymbols(
          this.state.activeProject.id,
          file.path
        );
      }

      this.setState({
        selectedFileContent: content,
        activeFileSymbols: fileSymbols,
        isLoading: false
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({
        isLoading: false,
        error: `Could not open file: ${msg}`,
        selectedFileContent: `// Failed to load file:\n// ${msg}`,
        activeFileSymbols: null
      });
    }
  }

  public async saveCurrentFile(contentToSave?: string): Promise<boolean> {
    if (!this.state.selectedFile || typeof window === 'undefined' || !window.electronAPI) {
      return false;
    }
    const content = contentToSave ?? this.state.selectedFileContent ?? '';
    const filePath = this.state.selectedFile.path;
    try {
      const res = await window.electronAPI.writeProjectFile(filePath, content);
      if (res.success) {
        this.setState({ selectedFileContent: content });
        const { editorTabsStore } = await import('./editorTabsStore');
        editorTabsStore.clearTabBuffer(`file-${filePath}`);
        const { notificationStore } = await import('./notificationStore');
        notificationStore.success('File Saved', this.state.selectedFile.name);
        return true;
      } else {
        const { notificationStore } = await import('./notificationStore');
        notificationStore.error('Save Failed', res.error || 'Could not write file');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const { notificationStore } = await import('./notificationStore');
      notificationStore.error('Save Failed', msg);
      return false;
    }
  }

  public updateSelectedFileContent(content: string): void {
    this.setState({ selectedFileContent: content });
    if (this.state.selectedFile) {
      import('./editorTabsStore').then(({ editorTabsStore }) => {
        editorTabsStore.setTabBuffer(`file-${this.state.selectedFile!.path}`, content);
      });
    }
  }

  public async refreshFileTree(): Promise<void> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) return;
    try {
      const tree = await window.electronAPI.readProjectTree(this.state.activeProject.path);
      this.setState({ fileTree: tree });
    } catch (err) {
      console.error('[Store] Refresh tree failed:', err);
    }
  }

  public async createFile(targetFolderPath: string, fileName: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) return false;
    const cleanFolder = targetFolderPath.replace(/[\\/]+$/, '');
    const fullPath = `${cleanFolder}/${fileName.trim()}`;
    try {
      const res = await window.electronAPI.createProjectFile(fullPath);
      if (res.success) {
        await this.refreshFileTree();
        await this.triggerReindex();
        const { notificationStore } = await import('./notificationStore');
        notificationStore.success('File Created', fileName);
        return true;
      } else {
        const { notificationStore } = await import('./notificationStore');
        notificationStore.error('Create Failed', res.error || 'Could not create file');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const { notificationStore } = await import('./notificationStore');
      notificationStore.error('Create Failed', msg);
      return false;
    }
  }

  public async createFolder(parentFolderPath: string, folderName: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) return false;
    const cleanFolder = parentFolderPath.replace(/[\\/]+$/, '');
    const fullPath = `${cleanFolder}/${folderName.trim()}`;
    try {
      const res = await window.electronAPI.createProjectFolder(fullPath);
      if (res.success) {
        await this.refreshFileTree();
        const { notificationStore } = await import('./notificationStore');
        notificationStore.success('Folder Created', folderName);
        return true;
      } else {
        const { notificationStore } = await import('./notificationStore');
        notificationStore.error('Create Failed', res.error || 'Could not create folder');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const { notificationStore } = await import('./notificationStore');
      notificationStore.error('Create Failed', msg);
      return false;
    }
  }

  public async deleteItem(itemPath: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) return false;
    try {
      const res = await window.electronAPI.deleteProjectItem(itemPath);
      if (res.success) {
        const { editorTabsStore } = await import('./editorTabsStore');
        editorTabsStore.removeTabByPath(itemPath);
        if (this.state.selectedFile?.path === itemPath) {
          this.setState({ selectedFile: null, selectedFileContent: null });
        }
        await this.refreshFileTree();
        await this.triggerReindex();
        const { notificationStore } = await import('./notificationStore');
        notificationStore.success('Deleted', itemPath.split(/[\\/]/).pop() || 'Item');
        return true;
      } else {
        const { notificationStore } = await import('./notificationStore');
        notificationStore.error('Delete Failed', res.error || 'Could not delete item');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const { notificationStore } = await import('./notificationStore');
      notificationStore.error('Delete Failed', msg);
      return false;
    }
  }

  public async renameItem(oldPath: string, newPath: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI) return false;
    try {
      const res = await window.electronAPI.renameProjectItem(oldPath, newPath);
      if (res.success) {
        const newName = newPath.split(/[\\/]/).pop() || 'Item';
        const { editorTabsStore } = await import('./editorTabsStore');
        editorTabsStore.updateTabPath(oldPath, newPath, newName);
        if (this.state.selectedFile?.path === oldPath) {
          this.setState({
            selectedFile: {
              ...this.state.selectedFile,
              path: newPath,
              name: newName
            }
          });
        }
        await this.refreshFileTree();
        await this.triggerReindex();
        const { notificationStore } = await import('./notificationStore');
        notificationStore.success('Renamed', newName);
        return true;
      } else {
        const { notificationStore } = await import('./notificationStore');
        notificationStore.error('Rename Failed', res.error || 'Could not rename item');
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const { notificationStore } = await import('./notificationStore');
      notificationStore.error('Rename Failed', msg);
      return false;
    }
  }

  public async triggerReindex(): Promise<void> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) return;
    this.setState({ indexStatus: 'indexing' });
    try {
      await window.electronAPI.startIndexing(this.state.activeProject.path);
      await this.refreshStatistics();
    } catch (err) {
      console.error('[Store] Reindex failed:', err);
    }
  }

  public async refreshStatistics(): Promise<void> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) return;
    try {
      const stats = await window.electronAPI.getProjectStatistics(
        this.state.activeProject.id
      );
      const status = await window.electronAPI.getIndexStatus(
        this.state.activeProject.id
      );
      this.setState({ statistics: stats, indexStatus: status });
    } catch (err) {
      console.error('[Store] Failed to refresh statistics:', err);
    }
  }

  public async searchSymbols(query: SymbolSearchQuery): Promise<CodeSymbol[]> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) return [];
    try {
      return await window.electronAPI.searchSymbols(
        this.state.activeProject.id,
        query
      );
    } catch (err) {
      console.error('[Store] Symbol search failed:', err);
      return [];
    }
  }

  public async selectSymbolForContext(symbolId: string): Promise<void> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) return;
    try {
      const context = await window.electronAPI.getSymbolContext(
        this.state.activeProject.id,
        symbolId
      );
      this.setState({ selectedSymbolContext: context });
    } catch (err) {
      console.error('[Store] Failed to extract symbol context:', err);
    }
  }

  public clearSymbolContext(): void {
    this.setState({ selectedSymbolContext: null });
  }

  // ==================================================
  // PHASE 4: RAG RETRIEVAL ACTIONS
  // ==================================================

  public async executeRagSearch(
    query: string,
    mode: import('../../shared/types').RAGSearchMode = 'hybrid'
  ): Promise<import('../../shared/types').RetrievalResult[]> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) {
      return [];
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      this.setState({ retrievedResults: [], activeContextPackage: null });
      return [];
    }

    this.setState({ isRagSearching: true });
    try {
      const results = await window.electronAPI.ragSearch({
        projectId: this.state.activeProject.id,
        query: cleanQuery,
        mode,
        limit: 10
      });

      const contextPackage = await window.electronAPI.ragGetContext({
        projectId: this.state.activeProject.id,
        query: cleanQuery,
        mode
      });

      this.setState({
        retrievedResults: results,
        activeContextPackage: contextPackage,
        isRagSearching: false
      });

      return results;
    } catch (err) {
      console.error('[Store] RAG retrieval error:', err);
      this.setState({ isRagSearching: false });
      return [];
    }
  }

  public async refreshRagStatus(): Promise<void> {
    if (!this.state.activeProject || typeof window === 'undefined' || !window.electronAPI) return;
    try {
      const status = await window.electronAPI.ragGetStatus(this.state.activeProject.id);
      this.setState({ ragStatus: status });
    } catch (err) {
      console.error('[Store] Failed to fetch RAG status:', err);
    }
  }

  public async selectFileByPath(
    filePath: string,
    lineRange?: { startLine: number; endLine: number }
  ): Promise<void> {
    const fileName = filePath.replace(/\\/g, '/').split('/').pop() || filePath;
    const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
    const file: ProjectFile = {
      name: fileName,
      path: filePath,
      relativePath: this.state.activeProject
        ? filePath.replace(this.state.activeProject.path, '').replace(/^[\\/]/, '').replace(/\\/g, '/')
        : fileName,
      isDirectory: false,
      size: 0,
      extension: ext
    };

    this.setState({ targetLineRange: lineRange || null });
    await this.selectFile(file);
  }

  public clearRetrievalResults(): void {
    this.setState({ retrievedResults: [], activeContextPackage: null, targetLineRange: null });
  }

  public clearActiveProject(): void {
    this.setState({
      activeProject: null,
      fileTree: [],
      selectedFile: null,
      selectedFileContent: null,
      activeFileSymbols: null,
      selectedSymbolContext: null,
      indexStatus: 'not_indexed',
      indexProgress: null,
      statistics: null,
      error: null
    });
  }
}

export const projectStore = new ProjectStore();
