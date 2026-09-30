/**
 * SnapDev AI - Project File Watcher
 * Watches the active workspace for file changes, additions, and deletions using Chokidar.
 * Triggers debounced incremental re-parsing without freezing the UI.
 */

import chokidar, { FSWatcher } from 'chokidar';
import { Project } from '../../shared/types';
import { projectIndexer } from './project-indexer';

export class ProjectWatcher {
  private watcher: FSWatcher | null = null;
  private currentProject: Project | null = null;
  private debounceMap: Map<string, NodeJS.Timeout> = new Map();

  public startWatching(project: Project): void {
    this.stopWatching();
    this.currentProject = project;

    this.watcher = chokidar.watch(project.path, {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/__pycache__/**',
        '**/.pytest_cache/**',
        '**/dist/**',
        '**/out/**',
        '**/build/**',
        '**/database/**',
        '**/.venv/**',
        '**/venv/**'
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });

    this.watcher.on('add', (filePath: string) => {
      this.handleFileChange(filePath);
    });

    this.watcher.on('change', (filePath: string) => {
      this.handleFileChange(filePath);
    });

    this.watcher.on('unlink', (filePath: string) => {
      if (this.currentProject) {
        projectIndexer.removeFile(this.currentProject.id, filePath);
      }
    });

    console.log(`[ProjectWatcher] File watcher active for: ${project.path}`);
  }

  private handleFileChange(filePath: string): void {
    if (!this.currentProject) return;

    // Debounce rapid writes
    const existing = this.debounceMap.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(async () => {
      this.debounceMap.delete(filePath);
      if (this.currentProject) {
        await projectIndexer.indexSingleFile(
          this.currentProject.id,
          this.currentProject.path,
          filePath
        );
      }
    }, 300);

    this.debounceMap.set(filePath, timer);
  }

  public stopWatching(): void {
    for (const timer of this.debounceMap.values()) {
      clearTimeout(timer);
    }
    this.debounceMap.clear();

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.currentProject = null;
  }
}

export const projectWatcher = new ProjectWatcher();
