/**
 * Unit tests for Git Diff Parser (Phase 7)
 */

import { describe, it, expect } from 'vitest';
import { parseDiffMetrics, createGitDiff } from '../../src/main/git/git-diff';

describe('Git Diff Service', () => {
  it('correctly calculates additions and deletions from a unified diff', () => {
    const diff = [
      '--- a/src/math.ts',
      '+++ b/src/math.ts',
      '@@ -1,5 +1,6 @@',
      ' export function add(a: number, b: number) {',
      '-  return a - b;',
      '+  // Fixed addition operator',
      '+  return a + b;',
      ' }'
    ].join('\n');

    const metrics = parseDiffMetrics(diff);
    expect(metrics.additions).toBe(2);
    expect(metrics.deletions).toBe(1);
  });

  it('handles empty diff gracefully', () => {
    const metrics = parseDiffMetrics('');
    expect(metrics.additions).toBe(0);
    expect(metrics.deletions).toBe(0);
  });

  it('creates structured GitDiff object', () => {
    const diff = [
      '--- a/file.ts',
      '+++ b/file.ts',
      '@@ -1,2 +1,3 @@',
      '-oldLine',
      '+newLine1',
      '+newLine2'
    ].join('\n');

    const result = createGitDiff('file.ts', diff, true);
    expect(result.filePath).toBe('file.ts');
    expect(result.diff).toBe(diff);
    expect(result.additions).toBe(2);
    expect(result.deletions).toBe(1);
    expect(result.isStaged).toBe(true);
  });
});
