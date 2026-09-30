/**
 * SnapDev AI - Git Status Parser
 * Parses Git status porcelain output into structured, strongly-typed file collections.
 * Handles staged, unstaged, untracked, and conflicted files with zero ambiguity.
 */

import path from 'path';
import { GitFileStatus, GitFileStatusType, GitStatus } from '../../shared/types';

export interface ParseStatusOptions {
  repoRoot?: string;
}

/**
 * Parse raw stdout from `git status -b --porcelain=v1 -uall`
 */
export function parseGitStatus(output: string, options: ParseStatusOptions = {}): GitStatus {
  const staged: GitFileStatus[] = [];
  const unstaged: GitFileStatus[] = [];
  const untracked: GitFileStatus[] = [];
  const conflicted: GitFileStatus[] = [];

  let branch: string | null = null;
  let ahead = 0;
  let behind = 0;
  let isDetached = false;

  const lines = output.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    // Header line: ## branch...upstream [ahead N, behind M]
    if (line.startsWith('##')) {
      const branchInfo = line.slice(2).trim();

      if (branchInfo.startsWith('HEAD (no branch)') || branchInfo.startsWith('Initial commit on ') || branchInfo.startsWith('No commits yet on ')) {
        isDetached = branchInfo.startsWith('HEAD');
        const match = branchInfo.match(/(?:Initial commit on|No commits yet on)\s+([^\s]+)/);
        branch = match ? match[1] : (isDetached ? 'HEAD (detached)' : null);
      } else {
        // e.g. main...origin/main [ahead 1, behind 2] or feature/login
        const [branchPart, trackingPart] = branchInfo.split('...');
        branch = branchPart.trim();

        if (trackingPart) {
          const aheadMatch = trackingPart.match(/ahead\s+(\d+)/);
          const behindMatch = trackingPart.match(/behind\s+(\d+)/);
          if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
          if (behindMatch) behind = parseInt(behindMatch[1], 10);
        }
      }
      continue;
    }

    // Two status characters + space + path
    if (line.length < 4) continue;

    const x = line[0]; // Staged / Index
    const y = line[1]; // Unstaged / Worktree
    const rest = line.slice(3).trim();

    // Check for renamed files format "oldPath -> newPath"
    let filePath = rest;
    let oldPath: string | undefined = undefined;
    if (rest.includes(' -> ')) {
      const parts = rest.split(' -> ');
      oldPath = cleanPath(parts[0]);
      filePath = cleanPath(parts[1]);
    } else {
      filePath = cleanPath(rest);
    }

    const fullPath = options.repoRoot ? path.resolve(options.repoRoot, filePath) : filePath;

    // Check for conflict states
    const conflictCodes = new Set(['UU', 'AA', 'DD', 'AU', 'UD', 'UA', 'DU']);
    const codePair = `${x}${y}`;

    if (conflictCodes.has(codePair)) {
      conflicted.push({
        path: fullPath,
        relativePath: filePath,
        status: 'conflicted',
        staged: false,
        oldPath
      });
      continue;
    }

    // Untracked files
    if (x === '?' && y === '?') {
      untracked.push({
        path: fullPath,
        relativePath: filePath,
        status: 'untracked',
        staged: false
      });
      continue;
    }

    // Ignored files (if requested with --ignored)
    if (x === '!' && y === '!') {
      continue;
    }

    // Process Staged (Index) changes: if x is not space and not ?
    if (x !== ' ' && x !== '?') {
      const stagedType: GitFileStatusType = mapStatusCode(x);
      staged.push({
        path: fullPath,
        relativePath: filePath,
        status: stagedType,
        staged: true,
        oldPath
      });
    }

    // Process Unstaged (Worktree) changes: if y is not space and not ?
    if (y !== ' ' && y !== '?') {
      const unstagedType: GitFileStatusType = mapStatusCode(y);
      unstaged.push({
        path: fullPath,
        relativePath: filePath,
        status: unstagedType,
        staged: false,
        oldPath
      });
    }
  }

  const isClean = staged.length === 0 && unstaged.length === 0 && untracked.length === 0 && conflicted.length === 0;

  return {
    isRepo: true,
    branch,
    isClean,
    staged,
    unstaged,
    untracked,
    conflicted,
    ahead,
    behind,
    isDetached
  };
}

function cleanPath(p: string): string {
  // Strip quotes if git porcelain outputs quoted escaped paths
  let cleaned = p.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\/g, '/');
}

function mapStatusCode(code: string): GitFileStatusType {
  switch (code) {
    case 'M':
      return 'modified';
    case 'A':
      return 'added';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case 'C':
      return 'added';
    default:
      return 'modified';
  }
}
