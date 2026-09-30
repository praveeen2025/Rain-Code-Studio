/**
 * SnapDev AI - Git Conflict Detection Service
 * Identifies unmerged conflict files and conflict markers.
 * Strictly adheres to safety rule: never automatically resolves conflicts.
 */

import fs from 'fs/promises';
import path from 'path';
import { GitConflict, GitFileStatus } from '../../shared/types';

/**
 * Format human-readable conflict description based on status code pair
 */
export function describeConflict(code: string): string {
  switch (code) {
    case 'UU':
      return 'Both modified (content conflict)';
    case 'AA':
      return 'Both added (file added independently on both branches)';
    case 'DD':
      return 'Both deleted';
    case 'AU':
      return 'Added by us, modified by them';
    case 'UA':
      return 'Modified by us, added by them';
    case 'UD':
      return 'Modified by us, deleted by them';
    case 'DU':
      return 'Deleted by us, modified by them';
    default:
      return 'Unmerged conflict';
  }
}

/**
 * Inspect file content for standard Git conflict markers (<<<<<<<, =======, >>>>>>>).
 */
export async function inspectConflictMarkers(
  filePath: string
): Promise<{ hasMarkers: boolean; ourChange?: string; theirChange?: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    let inOurs = false;
    let inTheirs = false;
    const ourLines: string[] = [];
    const theirLines: string[] = [];
    let hasMarkers = false;

    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        hasMarkers = true;
        inOurs = true;
        inTheirs = false;
      } else if (line.startsWith('=======')) {
        inOurs = false;
        inTheirs = true;
      } else if (line.startsWith('>>>>>>>')) {
        inOurs = false;
        inTheirs = false;
      } else if (inOurs && ourLines.length < 20) {
        ourLines.push(line);
      } else if (inTheirs && theirLines.length < 20) {
        theirLines.push(line);
      }
    }

    return {
      hasMarkers,
      ourChange: ourLines.length > 0 ? ourLines.join('\n') : undefined,
      theirChange: theirLines.length > 0 ? theirLines.join('\n') : undefined
    };
  } catch {
    return { hasMarkers: false };
  }
}

/**
 * Create structured GitConflict records from list of conflicted file statuses
 */
export async function createConflictRecords(
  conflictedFiles: GitFileStatus[],
  repoRoot?: string
): Promise<GitConflict[]> {
  const records: GitConflict[] = [];

  for (const file of conflictedFiles) {
    const fullPath = repoRoot ? path.resolve(repoRoot, file.relativePath) : file.path;
    const markers = await inspectConflictMarkers(fullPath);

    records.push({
      filePath: file.relativePath,
      status: 'CONFLICT (unmerged)',
      ourChange: markers.ourChange,
      theirChange: markers.theirChange,
      description:
        'Manual resolution required. Review both versions in the editor, choose the correct changes, remove markers (<<<<<<<, =======, >>>>>>>), and stage the file.'
    });
  }

  return records;
}
