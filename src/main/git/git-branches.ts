/**
 * SnapDev AI - Git Branches Service
 * Handles branch detection, tracking information, and branch switching safety checks.
 */

import { GitBranch } from '../../shared/types';

/**
 * Validate that a branch name is safe and does not contain injection characters.
 */
export function isValidBranchName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return false;

  // Cannot start with dash or slash (prevents git CLI flag injection)
  if (trimmed.startsWith('-') || trimmed.startsWith('/')) return false;

  // Cannot contain path traversal, null bytes, or dangerous shell characters
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return false;

  // Git branch name character rules
  const branchNameRegex = /^[a-zA-Z0-9_\-\.\/]+$/;
  return branchNameRegex.test(trimmed);
}

/**
 * Parse stdout of `git branch -a -v --no-color`
 */
export function parseGitBranches(output: string): GitBranch[] {
  const branches: GitBranch[] = [];
  const lines = output.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const isCurrent = rawLine.startsWith('*');
    const content = rawLine.slice(2).trim(); // Remove leading '* ' or '  '

    // Split branch name, commit hash, and rest
    const parts = content.split(/\s+/);
    if (parts.length < 2) continue;

    let branchName = parts[0];
    const commitHash = parts[1];

    // Skip symbolic ref HEAD pointer e.g. "remotes/origin/HEAD -> origin/main"
    if (branchName.includes('->')) continue;

    const isRemote = branchName.startsWith('remotes/');
    if (isRemote) {
      branchName = branchName.replace(/^remotes\//, '');
    }

    // Try to extract upstream tracking e.g. [origin/main] or [ahead 1]
    let upstream: string | undefined = undefined;
    const bracketMatch = content.match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      const insideBracket = bracketMatch[1];
      const trackingParts = insideBracket.split(':');
      upstream = trackingParts[0].trim();
    }

    branches.push({
      name: branchName,
      isCurrent,
      isRemote,
      commitHash,
      upstream
    });
  }

  // Ensure current branch is first or clearly marked
  return branches.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    if (!a.isRemote && b.isRemote) return -1;
    if (a.isRemote && !b.isRemote) return 1;
    return a.name.localeCompare(b.name);
  });
}
