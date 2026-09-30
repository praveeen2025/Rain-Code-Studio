/**
 * Unit tests for Git Status Parser (Phase 7)
 */

import { describe, it, expect } from 'vitest';
import { parseGitStatus } from '../../src/main/git/git-status';

describe('Git Status Parser', () => {
  it('parses a clean repository output', () => {
    const raw = '## main...origin/main\n';
    const status = parseGitStatus(raw);

    expect(status.isRepo).toBe(true);
    expect(status.branch).toBe('main');
    expect(status.isClean).toBe(true);
    expect(status.staged).toHaveLength(0);
    expect(status.unstaged).toHaveLength(0);
    expect(status.untracked).toHaveLength(0);
    expect(status.conflicted).toHaveLength(0);
  });

  it('parses ahead and behind tracking counts', () => {
    const raw = '## feature/auth...origin/feature/auth [ahead 3, behind 1]\n';
    const status = parseGitStatus(raw);

    expect(status.branch).toBe('feature/auth');
    expect(status.ahead).toBe(3);
    expect(status.behind).toBe(1);
    expect(status.isClean).toBe(true);
  });

  it('detects detached HEAD state', () => {
    const raw = '## HEAD (no branch)\n';
    const status = parseGitStatus(raw);

    expect(status.isDetached).toBe(true);
    expect(status.branch).toBe('HEAD (detached)');
  });

  it('parses staged modifications and additions', () => {
    const raw = [
      '## main',
      'M  src/index.ts',
      'A  src/new-feature.ts',
      'D  old-file.ts'
    ].join('\n');

    const status = parseGitStatus(raw);
    expect(status.isClean).toBe(false);
    expect(status.staged).toHaveLength(3);
    expect(status.unstaged).toHaveLength(0);

    const modified = status.staged.find((f) => f.relativePath === 'src/index.ts');
    expect(modified?.status).toBe('modified');
    expect(modified?.staged).toBe(true);

    const added = status.staged.find((f) => f.relativePath === 'src/new-feature.ts');
    expect(added?.status).toBe('added');

    const deleted = status.staged.find((f) => f.relativePath === 'old-file.ts');
    expect(deleted?.status).toBe('deleted');
  });

  it('parses unstaged working tree changes and untracked files', () => {
    const raw = [
      '## main',
      ' M src/renderer/App.tsx',
      ' D README.md',
      '?? new-untracked.txt'
    ].join('\n');

    const status = parseGitStatus(raw);
    expect(status.staged).toHaveLength(0);
    expect(status.unstaged).toHaveLength(2);
    expect(status.untracked).toHaveLength(1);

    expect(status.unstaged[0].relativePath).toBe('src/renderer/App.tsx');
    expect(status.unstaged[0].status).toBe('modified');
    expect(status.unstaged[0].staged).toBe(false);

    expect(status.untracked[0].relativePath).toBe('new-untracked.txt');
    expect(status.untracked[0].status).toBe('untracked');
  });

  it('parses renamed files with old and new path', () => {
    const raw = [
      '## main',
      'R  src/old-name.ts -> src/new-name.ts'
    ].join('\n');

    const status = parseGitStatus(raw);
    expect(status.staged).toHaveLength(1);
    expect(status.staged[0].status).toBe('renamed');
    expect(status.staged[0].relativePath).toBe('src/new-name.ts');
    expect(status.staged[0].oldPath).toBe('src/old-name.ts');
  });

  it('detects unmerged conflict codes', () => {
    const raw = [
      '## main',
      'UU src/conflict.ts',
      'AA src/added-both.ts'
    ].join('\n');

    const status = parseGitStatus(raw);
    expect(status.conflicted).toHaveLength(2);
    expect(status.conflicted[0].relativePath).toBe('src/conflict.ts');
    expect(status.conflicted[0].status).toBe('conflicted');
    expect(status.conflicted[1].relativePath).toBe('src/added-both.ts');
  });
});
