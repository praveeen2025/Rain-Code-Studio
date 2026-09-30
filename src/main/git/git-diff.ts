/**
 * SnapDev AI - Git Diff Service
 * Fetches and parses unified diffs for staged, unstaged, and historical commits.
 */

import { GitDiff } from '../../shared/types';

/**
 * Parse additions and deletions metrics from a unified diff string.
 */
export function parseDiffMetrics(diffText: string): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;

  if (!diffText) {
    return { additions: 0, deletions: 0 };
  }

  const lines = diffText.split('\n');
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return { additions, deletions };
}

/**
 * Format a unified diff for a single file into a GitDiff object.
 */
export function createGitDiff(filePath: string, diffText: string, isStaged: boolean): GitDiff {
  const { additions, deletions } = parseDiffMetrics(diffText);
  return {
    filePath,
    diff: diffText,
    additions,
    deletions,
    isStaged
  };
}
