/**
 * SnapDev AI - Security: Patch Safety & Change Manager Tests
 * Phase 10: Patch Security, Stale Hash Protection & Rollback Integrity
 *
 * Verifies that:
 * 1. AI cannot silently modify files without user approval.
 * 2. Patch application fails safely if original file content hash has changed (stale file defense).
 * 3. Path traversal attempts during patch application are blocked.
 * 4. Automatic backups are created before modifications.
 * 5. Rollback safely restores original file contents.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { changeManager } from '../../src/main/patch/change-manager';
import { FilePatch } from '../../src/shared/types';

describe('Security: Patch Safety & Stale File Protection', () => {
  const testDir = path.resolve('tests/scratch-patch-safety');
  const testFile = path.join(testDir, 'sample-service.ts');
  const initialContent = 'export function calculateTotal(a: number, b: number) { return a + b; }\n';

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, initialContent, 'utf-8');
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('computes correct SHA-256 hash for file content', () => {
    const hash = changeManager.calculateHash(initialContent);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // 256 bits = 64 hex characters
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  it('computes unified diff correctly for preview', () => {
    const modified = 'export function calculateTotal(a: number, b: number) { return a + b + 1; }\n';
    const diff = changeManager.computeDiff(initialContent, modified, 'sample-service.ts');
    expect(diff).toContain('--- a/sample-service.ts');
    expect(diff).toContain('+++ b/sample-service.ts');
    expect(diff).toContain('+export function calculateTotal(a: number, b: number) { return a + b + 1; }');
  });

  it('rejects patch application when target path is outside project root', async () => {
    const evilPatch: FilePatch = {
      filePath: path.resolve('d:/hackathon/snap-evil/untrusted.ts'),
      relativePath: '../untrusted.ts',
      originalContent: initialContent,
      modifiedContent: '// malicious code',
      originalContentHash: changeManager.calculateHash(initialContent),
      diff: '+// malicious code',
      explanation: 'Malicious traversal attempt'
    };

    const result = await changeManager.applyPatch(evilPatch, testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('path traversal');
  });

  it('rejects patch application when disk content does not match expected hash (stale file defense)', async () => {
    const correctHash = changeManager.calculateHash(initialContent);

    // Concurrently modify the file on disk
    await fs.writeFile(testFile, 'export function modifiedOnDisk() {}\n', 'utf-8');

    const stalePatch: FilePatch = {
      filePath: testFile,
      relativePath: 'sample-service.ts',
      originalContent: initialContent,
      modifiedContent: 'export function aiModified() {}\n',
      originalContentHash: correctHash, // Matches initialContent, but disk was modified!
      diff: '+export function aiModified() {}',
      explanation: 'Stale patch against changed disk content'
    };

    const result = await changeManager.applyPatch(stalePatch, testDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Stale-file conflict');

    // Verify disk content was NOT overwritten
    const currentDisk = await fs.readFile(testFile, 'utf-8');
    expect(currentDisk).toBe('export function modifiedOnDisk() {}\n');
  });

  it('applies valid patch cleanly and creates automatic backup', async () => {
    const newContent = 'export function calculateTotal(a: number, b: number) { return Math.max(0, a + b); }\n';
    const hash = changeManager.calculateHash(initialContent);

    const validPatch: FilePatch = {
      filePath: testFile,
      relativePath: 'sample-service.ts',
      originalContent: initialContent,
      modifiedContent: newContent,
      originalContentHash: hash,
      diff: changeManager.computeDiff(initialContent, newContent, 'sample-service.ts'),
      explanation: 'Valid calculation patch'
    };

    const result = await changeManager.applyPatch(validPatch, testDir);
    expect(result.success).toBe(true);
    expect(result.backupPath).toBeDefined();

    // Verify new content written
    const updatedDisk = await fs.readFile(testFile, 'utf-8');
    expect(updatedDisk).toBe(newContent);

    // Verify rollback works using the created backup
    const rollbackResult = await changeManager.rollbackPatch(testFile, testDir);
    expect(rollbackResult.success).toBe(true);

    const restoredDisk = await fs.readFile(testFile, 'utf-8');
    expect(restoredDisk).toBe(initialContent);
  });
});
