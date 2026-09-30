/**
 * SnapDev AI - Safe Change & Patch Manager (Main Process)
 * Enforces strict safety rules for AI code modifications:
 * 1. AI NEVER silently modifies files.
 * 2. Path confinement: strictly inside active project directory (no path traversal).
 * 3. Stale-file protection: verifies SHA-256 hash before applying.
 * 4. Generates unified diffs for user review.
 * 5. Creates automatic local backups before applying for reliable rollback.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FilePatch, PatchResult } from '../../shared/types';

export class ChangeManager {
  private backupDir: string;
  private backupMap: Map<string, string> = new Map(); // filePath -> backupFilePath

  constructor() {
    this.backupDir = path.join(process.cwd(), '.snapdev-backups');
    try {
      if (!fsSync.existsSync(this.backupDir)) {
        fsSync.mkdirSync(this.backupDir, { recursive: true });
      }
    } catch {
      // Ignore if cannot create global backup dir initially
    }
  }

  /**
   * Calculate SHA-256 hash of text content.
   */
  public calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Validate that the target file path resides strictly inside the allowed project root.
   * Prevents path traversal vulnerabilities.
   */
  public isPathConfined(targetPath: string, projectRoot?: string): boolean {
    if (!projectRoot) return true;
    const resolvedTarget = path.resolve(targetPath);
    const resolvedRoot = path.resolve(projectRoot);
    const rel = path.relative(resolvedRoot, resolvedTarget);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  }

  /**
   * Compute unified diff string between original and modified content.
   */
  public computeDiff(original: string, modified: string, fileName: string): string {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');

    const diffLines: string[] = [
      `--- a/${fileName}`,
      `+++ b/${fileName}`,
      `@@ -1,${origLines.length} +1,${modLines.length} @@`
    ];

    let i = 0;
    let j = 0;
    while (i < origLines.length || j < modLines.length) {
      if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
        diffLines.push(` ${origLines[i]}`);
        i++;
        j++;
      } else if (i < origLines.length && (j >= modLines.length || !modLines.includes(origLines[i]))) {
        diffLines.push(`-${origLines[i]}`);
        i++;
      } else if (j < modLines.length) {
        diffLines.push(`+${modLines[j]}`);
        j++;
      }
    }

    return diffLines.join('\n');
  }

  /**
   * Create a structured FilePatch object with SHA-256 hash and unified diff.
   */
  public async createPatch(
    filePath: string,
    modifiedContent: string,
    explanation: string,
    projectRoot?: string
  ): Promise<FilePatch> {
    if (!this.isPathConfined(filePath, projectRoot)) {
      throw new Error(`Security Exception: Target path '${filePath}' is outside project root.`);
    }

    let originalContent = '';
    if (fsSync.existsSync(filePath)) {
      originalContent = await fs.readFile(filePath, 'utf-8');
    }

    const relPath = projectRoot
      ? path.relative(projectRoot, filePath).replace(/\\/g, '/')
      : path.basename(filePath);

    const originalContentHash = this.calculateHash(originalContent);
    const diff = this.computeDiff(originalContent, modifiedContent, relPath);

    return {
      filePath,
      relativePath: relPath,
      originalContent,
      originalContentHash,
      modifiedContent,
      diff,
      explanation
    };
  }

  /**
   * Validate that a patch is structurally sound and can be applied without conflict.
   */
  public async validatePatch(
    patch: FilePatch,
    projectRoot?: string
  ): Promise<{ valid: boolean; error?: string }> {
    if (!patch || !patch.filePath) {
      return { valid: false, error: 'Invalid patch structure: missing filePath.' };
    }

    if (!this.isPathConfined(patch.filePath, projectRoot)) {
      return { valid: false, error: 'Security violation: File path attempts path traversal.' };
    }

    if (!fsSync.existsSync(patch.filePath)) {
      // Allowed if creating a new file (e.g. test file)
      if (patch.originalContent !== '') {
        return { valid: false, error: `File not found on disk: ${patch.filePath}` };
      }
      return { valid: true };
    }

    // Stale-file check: Verify on-disk file has not changed since patch creation
    const currentDiskContent = await fs.readFile(patch.filePath, 'utf-8');
    const currentHash = this.calculateHash(currentDiskContent);

    if (currentHash !== patch.originalContentHash) {
      return {
        valid: false,
        error:
          'Stale-file conflict: File content on disk has changed since this patch was generated. Please regenerate the patch to review the latest changes.'
      };
    }

    return { valid: true };
  }

  /**
   * Preview diff and verify clean application potential.
   */
  public async previewPatch(
    patch: FilePatch,
    projectRoot?: string
  ): Promise<{ diff: string; canApplyCleanly: boolean; warning?: string }> {
    const validation = await this.validatePatch(patch, projectRoot);
    return {
      diff: patch.diff,
      canApplyCleanly: validation.valid,
      warning: validation.error
    };
  }

  /**
   * Apply a user-approved patch to disk with backup creation.
   * AI NEVER CALLS THIS AUTOMATICALLY. Requires explicit user action.
   */
  public async applyPatch(patch: FilePatch, projectRoot?: string): Promise<PatchResult> {
    const validation = await this.validatePatch(patch, projectRoot);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Patch validation failed.',
        filePath: patch.filePath
      };
    }

    try {
      let previousHash = '';
      let backupPath: string | undefined = undefined;

      // Ensure target directory exists
      const targetDir = path.dirname(patch.filePath);
      await fs.mkdir(targetDir, { recursive: true });

      // Create backup if file exists
      if (fsSync.existsSync(patch.filePath)) {
        const currentContent = await fs.readFile(patch.filePath, 'utf-8');
        previousHash = this.calculateHash(currentContent);

        await fs.mkdir(this.backupDir, { recursive: true });
        const backupFileName = `${path.basename(patch.filePath)}.${Date.now()}.bak`;
        backupPath = path.join(this.backupDir, backupFileName);
        await fs.writeFile(backupPath, currentContent, 'utf-8');
        this.backupMap.set(patch.filePath, backupPath);
      }

      // Write updated content safely
      await fs.writeFile(patch.filePath, patch.modifiedContent, 'utf-8');
      const newHash = this.calculateHash(patch.modifiedContent);

      return {
        success: true,
        message: `Successfully applied changes to ${patch.relativePath || path.basename(patch.filePath)}`,
        filePath: patch.filePath,
        previousHash,
        newHash,
        backupPath
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to write file: ${err instanceof Error ? err.message : String(err)}`,
        filePath: patch.filePath
      };
    }
  }

  /**
   * Explicitly reject a patch without modifying disk.
   */
  public async rejectPatch(patch: FilePatch): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Patch rejected for ${patch.relativePath || path.basename(patch.filePath)}. No files were modified.`
    };
  }

  /**
   * Rollback the most recently applied patch for a file.
   */
  public async rollbackPatch(filePath: string, projectRoot?: string): Promise<PatchResult> {
    if (!this.isPathConfined(filePath, projectRoot)) {
      return {
        success: false,
        message: 'Security Exception: Cannot rollback path outside project root.',
        filePath
      };
    }

    const backupPath = this.backupMap.get(filePath);
    if (!backupPath || !fsSync.existsSync(backupPath)) {
      return {
        success: false,
        message: `No backup available for rollback: ${path.basename(filePath)}`,
        filePath
      };
    }

    try {
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      await fs.writeFile(filePath, backupContent, 'utf-8');
      const restoredHash = this.calculateHash(backupContent);

      return {
        success: true,
        message: `Successfully rolled back ${path.basename(filePath)} to previous version.`,
        filePath,
        newHash: restoredHash
      };
    } catch (err) {
      return {
        success: false,
        message: `Rollback failed: ${err instanceof Error ? err.message : String(err)}`,
        filePath
      };
    }
  }
}

export const changeManager = new ChangeManager();
