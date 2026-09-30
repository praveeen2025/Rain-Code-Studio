/**
 * SnapDev AI - Filesystem Utilities
 * Safe filesystem inspection for projects, file trees, and content reading.
 * Implements strict boundaries to prevent path traversal or unsafe file access.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { ProjectFile } from '../shared/types';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'out',
  'build',
  '.venv',
  'venv',
  '.idea',
  '.vscode',
  '.DS_Store',
  '.snapdev-backups',
  '.snapdev-logs'
]);

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB limit for previewing in Phase 1

export class FilesystemManager {
  /**
   * Validate that targetPath stays strictly inside rootDir (path traversal protection).
   */
  public isPathConfined(targetPath: string, rootDir: string): boolean {
    if (!rootDir) return true;
    const resolvedTarget = path.resolve(targetPath);
    const resolvedRoot = path.resolve(rootDir);
    const rel = path.relative(resolvedRoot, resolvedTarget);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  }
  /**
   * Validate that path exists and is an accessible directory.
   */
  public async validateDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Read directory tree recursively with max depth and ignore filters.
   */
  public async readDirectoryTree(
    dirPath: string,
    currentDepth = 0,
    maxDepth = 5
  ): Promise<ProjectFile[]> {
    if (currentDepth > maxDepth) {
      return [];
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items: ProjectFile[] = [];

      for (const entry of entries) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const isDir = entry.isDirectory();
        let size = 0;
        let ext = '';

        if (!isDir) {
          try {
            const stats = await fs.stat(fullPath);
            size = stats.size;
            ext = path.extname(entry.name).toLowerCase();
          } catch {
            // Stat failed, continue
          }
        }

        const projectFile: ProjectFile = {
          name: entry.name,
          path: fullPath,
          relativePath: entry.name,
          isDirectory: isDir,
          size,
          extension: ext
        };

        if (isDir) {
          projectFile.children = await this.readDirectoryTree(
            fullPath,
            currentDepth + 1,
            maxDepth
          );
        }

        items.push(projectFile);
      }

      // Sort directories first, then files alphabetically
      return items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (err) {
      console.error(`[FilesystemManager] Failed to read directory ${dirPath}:`, err);
      return [];
    }
  }

  public async readFile(filePath: string, allowedRoot?: string): Promise<string> {
    try {
      if (allowedRoot && !this.isPathConfined(filePath, allowedRoot)) {
        throw new Error('Access denied: File path is outside the allowed project directory.');
      }
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        throw new Error('Specified path is a directory, not a file.');
      }
      if (stats.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size (${(stats.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of 2MB.`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Cannot read file: ${message}`);
    }
  }

  public async writeFile(filePath: string, content: string, allowedRoot?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (allowedRoot && !this.isPathConfined(filePath, allowedRoot)) {
        return { success: false, error: 'Access denied: Path is outside allowed project root.' };
      }
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to write file: ${msg}` };
    }
  }

  public async createFile(filePath: string, allowedRoot?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (allowedRoot && !this.isPathConfined(filePath, allowedRoot)) {
        return { success: false, error: 'Access denied: Path is outside allowed project root.' };
      }
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, '', { flag: 'wx' });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to create file: ${msg}` };
    }
  }

  public async createFolder(folderPath: string, allowedRoot?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (allowedRoot && !this.isPathConfined(folderPath, allowedRoot)) {
        return { success: false, error: 'Access denied: Path is outside allowed project root.' };
      }
      await fs.mkdir(folderPath, { recursive: true });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to create folder: ${msg}` };
    }
  }

  public async deleteItem(itemPath: string, allowedRoot?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (allowedRoot && !this.isPathConfined(itemPath, allowedRoot)) {
        return { success: false, error: 'Access denied: Path is outside allowed project root.' };
      }
      if (allowedRoot && path.resolve(itemPath) === path.resolve(allowedRoot)) {
        return { success: false, error: 'Cannot delete project root folder.' };
      }
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        await fs.rm(itemPath, { recursive: true, force: true });
      } else {
        await fs.unlink(itemPath);
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to delete item: ${msg}` };
    }
  }

  public async renameItem(oldPath: string, newPath: string, allowedRoot?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (allowedRoot && (!this.isPathConfined(oldPath, allowedRoot) || !this.isPathConfined(newPath, allowedRoot))) {
        return { success: false, error: 'Access denied: Path is outside allowed project root.' };
      }
      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to rename item: ${msg}` };
    }
  }

  /**
   * Synchronously count files in a directory for fast project metadata estimation.
   */
  public countProjectFiles(dirPath: string): number {
    let count = 0;
    try {
      const walk = (current: string, depth = 0) => {
        if (depth > 6) return;
        const entries = fsSync.readdirSync(current, { withFileTypes: true });
        for (const e of entries) {
          if (IGNORED_DIRECTORIES.has(e.name)) continue;
          const full = path.join(current, e.name);
          if (e.isDirectory()) {
            walk(full, depth + 1);
          } else {
            count++;
          }
        }
      };
      walk(dirPath);
    } catch {
      // Ignore count errors
    }
    return count;
  }
}

export const filesystemManager = new FilesystemManager();
