/**
 * Unit tests for Git History and Log Parser (Phase 7)
 */

import { describe, it, expect } from 'vitest';
import { parseGitLog, parseCommitShow, formatRelativeDate } from '../../src/main/git/git-history';

describe('Git History Parser', () => {
  it('parses formatted log entries correctly', () => {
    const raw = [
      'f4c1e2d3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9\x1ff4c1e2d\x1fJane Dev\x1fjane@example.com\x1f2026-09-29T10:00:00Z\x1ffeat(auth): add JWT verification\x1fHEAD -> main, origin/main',
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x1fa1b2c3d\x1fJohn Engineer\x1fjohn@example.com\x1f2026-09-28T14:30:00Z\x1ffix: resolve memory leak in worker\x1f'
    ].join('\n');

    const commits = parseGitLog(raw);
    expect(commits).toHaveLength(2);

    expect(commits[0].hash).toBe('f4c1e2d3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9');
    expect(commits[0].shortHash).toBe('f4c1e2d');
    expect(commits[0].author).toBe('Jane Dev');
    expect(commits[0].email).toBe('jane@example.com');
    expect(commits[0].message).toBe('feat(auth): add JWT verification');
    expect(commits[0].refs).toEqual(['HEAD -> main', 'origin/main']);

    expect(commits[1].shortHash).toBe('a1b2c3d');
    expect(commits[1].message).toBe('fix: resolve memory leak in worker');
    expect(commits[1].refs).toBeUndefined();
  });

  it('formats relative dates cleanly', () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe('just now');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(formatRelativeDate(twoHoursAgo)).toBe('2h ago');

    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe('3d ago');
  });

  it('parses commit show output into file list and diff', () => {
    const raw = [
      'commit f4c1e2d3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9',
      'Author: Jane Dev <jane@example.com>',
      'Date:   Tue Sep 29 10:00:00 2026 +0000',
      '',
      '    feat(auth): add JWT verification',
      '',
      'diff --git a/src/auth.ts b/src/auth.ts',
      'index 1234567..89abcdef 100644',
      '--- a/src/auth.ts',
      '+++ b/src/auth.ts',
      '@@ -1,3 +1,4 @@',
      '+export function verifyToken() {}',
      'diff --git a/src/index.ts b/src/index.ts',
      '--- a/src/index.ts',
      '+++ b/src/index.ts',
      '@@ -1,2 +1,3 @@',
      '+import { verifyToken } from "./auth";'
    ].join('\n');

    const result = parseCommitShow(raw);
    expect(result.files).toContain('src/auth.ts');
    expect(result.files).toContain('src/index.ts');
    expect(result.diff).toContain('diff --git a/src/auth.ts b/src/auth.ts');
  });
});
