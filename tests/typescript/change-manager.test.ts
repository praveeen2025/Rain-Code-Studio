/**
 * SnapDev AI - ChangeManager & Safe Patch Pipeline Tests
 * Phase 6: Strict safety verification for code modifications:
 * 1. AI NEVER silently modifies files.
 * 2. Path confinement: strictly inside active project directory (no path traversal).
 * 3. Stale-file protection: verifies SHA-256 hash before applying.
 * 4. Generates unified diffs for user review.
 * 5. Creates automatic local backups before applying for reliable rollback.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ChangeManager } from '../../src/main/patch/change-manager';
import { FilePatch } from '../../src/shared/types';

describe('ChangeManager - Safe Patch & Diff Verification', () => {
  let changeManager: ChangeManager;
  let testProjectDir: string;
  let sampleFilePath: string;
  const initialContent = 'function helloWorld() {\n  return "hello";\n}\n';

  beforeEach(async () => {
    changeManager = new ChangeManager();
    testProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snapdev-test-project-'));
    sampleFilePath = path.join(testProjectDir, 'sample.ts');
    await fs.writeFile(sampleFilePath, initialContent, 'utf-8');
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('calculates SHA-256 hash accurately', () => {
    const hash = changeManager.calculateHash(initialContent);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex string is 64 characters
    expect(changeManager.calculateHash(initialContent)).toBe(hash);
  });

  it('strictly enforces path confinement and blocks path traversal', () => {
    const insidePath = path.join(testProjectDir, 'src', 'auth.ts');
    const outsidePath = path.resolve(testProjectDir, '..', 'secret.txt');

    expect(changeManager.isPathConfined(insidePath, testProjectDir)).toBe(true);
    expect(changeManager.isPathConfined(outsidePath, testProjectDir)).toBe(false);
  });

  it('rejects patches that attempt path traversal outside project root', async () => {
    const evilPath = path.resolve(testProjectDir, '..', 'traversal.ts');
    const patch: FilePatch = {
      filePath: evilPath,
      relativePath: '../traversal.ts',
      originalContent: '',
      originalContentHash: changeManager.calculateHash(''),
      modifiedContent: '// exploit code',
      diff: '--- /dev/null\n+++ evil',
      explanation: 'Attempted traversal'
    };

    const validation = await changeManager.validatePatch(patch, testProjectDir);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('path traversal');

    const result = await changeManager.applyPatch(patch, testProjectDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain('path traversal');
  });

  it('detects and blocks stale-file conflicts if disk content changed', async () => {
    const originalHash = changeManager.calculateHash(initialContent);

    // Simulate another process or user modifying the file on disk after patch was created
    await fs.writeFile(sampleFilePath, 'function modifiedByUser() {\n  return "updated";\n}\n', 'utf-8');

    const patch: FilePatch = {
      filePath: sampleFilePath,
      relativePath: 'sample.ts',
      originalContent: initialContent,
      originalContentHash: originalHash,
      modifiedContent: 'function helloWorld() {\n  return "hello modified by AI";\n}\n',
      diff: '--- sample.ts\n+++ sample.ts',
      explanation: 'AI suggested modification'
    };

    const validation = await changeManager.validatePatch(patch, testProjectDir);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Stale-file conflict');

    const applyResult = await changeManager.applyPatch(patch, testProjectDir);
    expect(applyResult.success).toBe(false);
    expect(applyResult.message).toContain('Stale-file conflict');
  });

  it('cleanly applies patch, creates backup, and updates file on explicit user action', async () => {
    const originalHash = changeManager.calculateHash(initialContent);
    const newContent = 'function helloWorld() {\n  return "hello applied";\n}\n';

    const patch: FilePatch = {
      filePath: sampleFilePath,
      relativePath: 'sample.ts',
      originalContent: initialContent,
      originalContentHash: originalHash,
      modifiedContent: newContent,
      diff: '--- sample.ts\n+++ sample.ts\n-  return "hello";\n+  return "hello applied";',
      explanation: 'Apply greeting change'
    };

    const preview = await changeManager.previewPatch(patch, testProjectDir);
    expect(preview.canApplyCleanly).toBe(true);

    const result = await changeManager.applyPatch(patch, testProjectDir);
    expect(result.success).toBe(true);
    expect(result.backupPath).toBeDefined();

    // Verify on-disk file was updated
    const updatedContentOnDisk = await fs.readFile(sampleFilePath, 'utf-8');
    expect(updatedContentOnDisk).toBe(newContent);

    // Verify rollback capability
    const rollbackResult = await changeManager.rollbackPatch(sampleFilePath, testProjectDir);
    expect(rollbackResult.success).toBe(true);

    const rolledBackContent = await fs.readFile(sampleFilePath, 'utf-8');
    expect(rolledBackContent).toBe(initialContent);
  });

  it('rejects patch without modifying disk', async () => {
    const patch: FilePatch = {
      filePath: sampleFilePath,
      relativePath: 'sample.ts',
      originalContent: initialContent,
      originalContentHash: changeManager.calculateHash(initialContent),
      modifiedContent: 'some untrusted code',
      diff: '--- diff',
      explanation: 'Rejected patch'
    };

    const res = await changeManager.rejectPatch(patch);
    expect(res.success).toBe(true);
    expect(res.message).toContain('rejected');

    // Confirm file was NOT modified
    const currentOnDisk = await fs.readFile(sampleFilePath, 'utf-8');
    expect(currentOnDisk).toBe(initialContent);
  });
});
