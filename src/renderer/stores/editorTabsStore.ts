/**
 * Rain Code Studio - Editor Tabs Store
 * Manages open editor tabs, active tab switching, and dirty states in VS Code layout.
 */

import { ProjectFile } from '../../shared/types';
import { projectStore } from './projectStore';

export interface EditorTab {
  id: string;
  title: string;
  path?: string;
  type: 'file' | 'diff' | 'chat' | 'git' | 'performance' | 'settings' | 'welcome';
  extension?: string;
  isDirty?: boolean;
}

type Listener = () => void;

interface EditorTabsState {
  tabs: EditorTab[];
  activeTabId: string | null;
}

class EditorTabsStore {
  private state: EditorTabsState = {
    tabs: [
      {
        id: 'welcome',
        title: 'Welcome',
        type: 'welcome'
      }
    ],
    activeTabId: 'welcome'
  };

  private listeners: Set<Listener> = new Set();

  public getTabs(): EditorTab[] {
    return this.state.tabs;
  }

  public getActiveTab(): EditorTab | null {
    if (!this.state.activeTabId) return null;
    return this.state.tabs.find((t) => t.id === this.state.activeTabId) || null;
  }

  public getActiveTabId(): string | null {
    return this.state.activeTabId;
  }

  public openFileTab(file: ProjectFile) {
    const existing = this.state.tabs.find((t) => t.path === file.path);
    if (existing) {
      this.state.activeTabId = existing.id;
      projectStore.selectFile(file);
      this.notify();
      return;
    }

    const newTab: EditorTab = {
      id: `file-${file.path}`,
      title: file.name,
      path: file.path,
      extension: file.extension,
      type: 'file'
    };

    // Remove welcome tab if it's the only one open
    const filtered = this.state.tabs.filter((t) => t.id !== 'welcome');
    this.state.tabs = [...filtered, newTab];
    this.state.activeTabId = newTab.id;

    projectStore.selectFile(file);
    this.notify();
  }

  public openViewTab(type: 'chat' | 'git' | 'performance' | 'settings' | 'welcome', title: string) {
    const existing = this.state.tabs.find((t) => t.type === type);
    if (existing) {
      this.state.activeTabId = existing.id;
      this.notify();
      return;
    }

    const newTab: EditorTab = {
      id: `view-${type}`,
      title,
      type
    };

    this.state.tabs.push(newTab);
    this.state.activeTabId = newTab.id;
    this.notify();
  }

  public openDiffTab(filePath: string, title: string) {
    const id = `diff-${filePath}`;
    const existing = this.state.tabs.find((t) => t.id === id);
    if (existing) {
      this.state.activeTabId = existing.id;
      this.notify();
      return;
    }

    const newTab: EditorTab = {
      id,
      title: `Diff: ${title}`,
      path: filePath,
      type: 'diff'
    };

    this.state.tabs.push(newTab);
    this.state.activeTabId = newTab.id;
    this.notify();
  }

  public setActiveTab(id: string) {
    const found = this.state.tabs.find((t) => t.id === id);
    if (found) {
      this.state.activeTabId = id;
      if (found.path && found.type === 'file') {
        const fileInTree = this.findFileByPath(projectStore.getState().fileTree, found.path);
        if (fileInTree) {
          projectStore.selectFile(fileInTree);
        }
      }
      this.notify();
    }
  }

  private findFileByPath(files: ProjectFile[], path: string): ProjectFile | null {
    for (const f of files) {
      if (f.path === path) return f;
      if (f.children) {
        const match = this.findFileByPath(f.children, path);
        if (match) return match;
      }
    }
    return null;
  }

  public setTabDirty(id: string, isDirty: boolean) {
    const tab = this.state.tabs.find((t) => t.id === id);
    if (tab && tab.isDirty !== isDirty) {
      tab.isDirty = isDirty;
      this.notify();
    }
  }

  public setTabBuffer(id: string, content: string) {
    this.bufferMap.set(id, content);
    this.setTabDirty(id, true);
  }

  public getTabBuffer(id: string): string | undefined {
    return this.bufferMap.get(id);
  }

  public clearTabBuffer(id: string) {
    this.bufferMap.delete(id);
    this.setTabDirty(id, false);
  }

  public updateTabPath(oldPath: string, newPath: string, newName: string) {
    const tab = this.state.tabs.find((t) => t.path === oldPath);
    if (tab) {
      tab.path = newPath;
      tab.title = newName;
      tab.id = `file-${newPath}`;
      if (this.state.activeTabId === `file-${oldPath}`) {
        this.state.activeTabId = tab.id;
      }
      this.notify();
    }
  }

  public removeTabByPath(path: string) {
    const tab = this.state.tabs.find((t) => t.path === path);
    if (tab) {
      this.closeTab(tab.id);
    }
  }

  private bufferMap: Map<string, string> = new Map();

  public closeTab(id: string) {
    const index = this.state.tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    const remaining = this.state.tabs.filter((t) => t.id !== id);

    if (this.state.activeTabId === id) {
      if (remaining.length > 0) {
        const nextIndex = Math.min(index, remaining.length - 1);
        this.state.activeTabId = remaining[nextIndex].id;
        const nextTab = remaining[nextIndex];
        if (nextTab.path && nextTab.type === 'file') {
          const fileInTree = this.findFileByPath(projectStore.getState().fileTree, nextTab.path);
          if (fileInTree) {
            projectStore.selectFile(fileInTree);
          }
        }
      } else {
        // All closed, reopen welcome tab
        this.state.tabs = [
          {
            id: 'welcome',
            title: 'Welcome',
            type: 'welcome'
          }
        ];
        this.state.activeTabId = 'welcome';
        this.notify();
        return;
      }
    }

    this.state.tabs = remaining;
    this.notify();
  }

  public closeAllTabs() {
    this.state.tabs = [
      {
        id: 'welcome',
        title: 'Welcome',
        type: 'welcome'
      }
    ];
    this.state.activeTabId = 'welcome';
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[EditorTabsStore] Listener error:', err);
      }
    });
  }
}

export const editorTabsStore = new EditorTabsStore();
