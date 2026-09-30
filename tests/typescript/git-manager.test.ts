/**
 * Unit tests for GitManager Security, Path Confinement, and Health (Phase 7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { GitManager } from '../../src/main/git/git-manager';
import { projectManager } from '../../src/main/project-manager';

describe('GitManager Security & Path Confinement', () => {
  let manager: GitManager;
  const mockProjectDir = path.resolve(process.cwd(), 'mock-repo');

  beforeEach(() => {
    manager = new GitManager();
    vi.restoreAllMocks();

    vi.spyOn(projectManager, 'getActiveProject').mockReturnValue({
      id: 'mock-proj-1',
      name: 'mock-repo',
      path: mockProjectDir,
      isDemo: false,
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
      fileCount: 10
    });
  });

  describe('resolveAndValidatePath', () => {
    it('resolves project root when no custom path is supplied', () => {
      const resolved = manager.resolveAndValidatePath();
      expect(resolved).toBe(mockProjectDir);
    });

    it('allows paths residing within the active project directory', () => {
      const subDir = path.join(mockProjectDir, 'src', 'components');
      const resolved = manager.resolveAndValidatePath(subDir);
      expect(resolved).toBe(path.resolve(subDir));
    });

    it('strictly throws a Security violation on directory traversal outside project root', () => {
      const outsideDir = path.resolve(mockProjectDir, '..', 'secret-folder');
      expect(() => manager.resolveAndValidatePath(outsideDir)).toThrow(/Security violation/);
    });
  });

  describe('validateFilePath', () => {
    it('returns clean relative POSIX path for valid files within root', () => {
      const fileInside = path.join(mockProjectDir, 'src', 'app.ts');
      const rel = manager.validateFilePath(fileInside, mockProjectDir);
      expect(rel).toBe('src/app.ts');
    });

    it('rejects relative path traversal like ../../windows/system32', () => {
      const maliciousPath = path.join(mockProjectDir, '..', '..', 'system32');
      expect(() => manager.validateFilePath(maliciousPath, mockProjectDir)).toThrow(
        /Security violation/
      );
    });

    it('throws when filePath is empty or invalid', () => {
      expect(() => manager.validateFilePath('', mockProjectDir)).toThrow(/Invalid file path/);
    });
  });

  describe('action logging and history', () => {
    it('records actions into in-memory diagnostic buffer', () => {
      manager.logAction('Test Git operation performed');
      const logs = manager.getRecentLogs();
      expect(logs.some((l) => l.includes('Test Git operation performed'))).toBe(true);
    });
  });
});
