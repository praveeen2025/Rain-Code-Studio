/**
 * SnapDev AI - Git History Service
 * Parses Git commit log history and single commit details safely.
 */

import { GitCommit } from '../../shared/types';

export const GIT_LOG_FORMAT = '%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s%x1f%D';

/**
 * Format relative date string (e.g., '2 hours ago', 'yesterday')
 */
export function formatRelativeDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch {
    return isoDate;
  }
}

/**
 * Parse output of `git log` formatted with GIT_LOG_FORMAT delimiter \x1f
 */
export function parseGitLog(output: string): GitCommit[] {
  if (!output || !output.trim()) return [];

  const commits: GitCommit[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split('\x1f');
    if (parts.length < 6) continue;

    const [hash, shortHash, author, email, date, message, refStr] = parts;

    let refs: string[] | undefined = undefined;
    if (refStr && refStr.trim()) {
      refs = refStr.split(',').map((r) => r.trim());
    }

    commits.push({
      hash: hash.trim(),
      shortHash: shortHash.trim(),
      author: author.trim(),
      email: email.trim(),
      date: date.trim(),
      relativeDate: formatRelativeDate(date.trim()),
      message: message.trim(),
      refs
    });
  }

  return commits;
}

/**
 * Parse files changed and unified diff from `git show`
 */
export function parseCommitShow(output: string): { files: string[]; diff: string } {
  if (!output) return { files: [], diff: '' };

  const lines = output.split('\n');
  const files: Set<string> = new Set();
  let diffStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('diff --git ')) {
      diffStartIndex = i;
      break;
    }
  }

  const diff = diffStartIndex >= 0 ? lines.slice(diffStartIndex).join('\n') : '';

  // Extract file names from diff --git a/... b/...
  for (const line of lines) {
    if (line.startsWith('diff --git a/')) {
      const match = line.match(/^diff --git a\/(.+?)\s+b\/(.+?)$/);
      if (match) {
        files.add(match[2]);
      }
    }
  }

  return {
    files: Array.from(files),
    diff
  };
}
