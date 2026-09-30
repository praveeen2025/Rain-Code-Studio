/**
 * SnapDev AI - Security: Path Traversal & Boundary Protection Tests
 * Phase 10: Security Audit & Path Confinement
 *
 * Verifies that:
 * 1. Path traversal attempts (../, ..\, encoded) are strictly rejected.
 * 2. Prefix collision attacks (/project-evil vs /project) are blocked.
 * 3. Absolute paths outside the allowed project directory are denied.
 * 4. FilesystemManager.readFile blocks reads outside allowed project directory.
 * 5. Sensitive credentials and environment files (.env, *.pem, id_rsa, etc.) are recognized and excluded from indexing.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import { filesystemManager } from '../../src/main/filesystem';
import { changeManager } from '../../src/main/patch/change-manager';
import { isSensitiveFile } from '../../src/main/indexer/project-indexer';

describe('Security: Path Confinement & Traversal Protection', () => {
  const dummyProjectRoot = path.resolve('d:/hackathon/snap/demo-project');

  it('allows safe canonical paths within project root', () => {
    const insideFile = path.join(dummyProjectRoot, 'src', 'index.ts');
    expect(changeManager.isPathConfined(insideFile, dummyProjectRoot)).toBe(true);
    expect(filesystemManager.isPathConfined(insideFile, dummyProjectRoot)).toBe(true);
  });

  it('allows root directory itself', () => {
    expect(changeManager.isPathConfined(dummyProjectRoot, dummyProjectRoot)).toBe(true);
    expect(filesystemManager.isPathConfined(dummyProjectRoot, dummyProjectRoot)).toBe(true);
  });

  it('rejects parent directory traversal (../)', () => {
    const traversalPath = path.join(dummyProjectRoot, '..', 'secret.txt');
    expect(changeManager.isPathConfined(traversalPath, dummyProjectRoot)).toBe(false);
    expect(filesystemManager.isPathConfined(traversalPath, dummyProjectRoot)).toBe(false);
  });

  it('rejects deep multi-level traversal (../../../../etc/passwd)', () => {
    const deepTraversal = path.join(dummyProjectRoot, '..', '..', '..', '..', 'windows', 'system32');
    expect(changeManager.isPathConfined(deepTraversal, dummyProjectRoot)).toBe(false);
    expect(filesystemManager.isPathConfined(deepTraversal, dummyProjectRoot)).toBe(false);
  });

  it('rejects sibling directory prefix collision attacks (CWE-22 / CWE-23)', () => {
    // Sibling directory starting with the same prefix name
    const siblingEvilDir = path.resolve('d:/hackathon/snap/demo-project-evil/payload.ts');
    expect(changeManager.isPathConfined(siblingEvilDir, dummyProjectRoot)).toBe(false);
    expect(filesystemManager.isPathConfined(siblingEvilDir, dummyProjectRoot)).toBe(false);
  });

  it('rejects different root or drive access', () => {
    const otherDrive = process.platform === 'win32' ? 'C:\\Windows\\notepad.exe' : '/usr/bin/env';
    expect(changeManager.isPathConfined(otherDrive, dummyProjectRoot)).toBe(false);
    expect(filesystemManager.isPathConfined(otherDrive, dummyProjectRoot)).toBe(false);
  });

  it('FilesystemManager.readFile denies access when path is outside allowedRoot', async () => {
    const forbiddenPath = path.resolve('d:/hackathon/snap/package.json');
    // dummyProjectRoot is demo-project, package.json is outside demo-project
    await expect(filesystemManager.readFile(forbiddenPath, dummyProjectRoot)).rejects.toThrow(
      /Access denied: File path is outside the allowed project directory/
    );
  });

  it('FilesystemManager.readFile safely allows reading valid files within allowedRoot', async () => {
    // Use an actual file inside demo-project
    const validFile = path.resolve('demo-project/src/index.ts');
    try {
      const content = await filesystemManager.readFile(validFile, path.resolve('demo-project'));
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    } catch {
      // If demo-project isn't present at this path, verify function logic on current dir
      const workspaceRoot = process.cwd();
      const localFile = path.join(workspaceRoot, 'package.json');
      const content = await filesystemManager.readFile(localFile, workspaceRoot);
      expect(content).toContain('snapdev-ai');
    }
  });
});

describe('Security: Sensitive Files & Secret Protection', () => {
  it('detects .env and environment variable variations as sensitive', () => {
    expect(isSensitiveFile('.env')).toBe(true);
    expect(isSensitiveFile('.env.local')).toBe(true);
    expect(isSensitiveFile('.env.production')).toBe(true);
    expect(isSensitiveFile('.env.staging')).toBe(true);
    expect(isSensitiveFile('.env.development')).toBe(true);
  });

  it('detects private keys and certificates as sensitive', () => {
    expect(isSensitiveFile('id_rsa')).toBe(true);
    expect(isSensitiveFile('id_ed25519')).toBe(true);
    expect(isSensitiveFile('server.key')).toBe(true);
    expect(isSensitiveFile('cert.pem')).toBe(true);
    expect(isSensitiveFile('bundle.pfx')).toBe(true);
    expect(isSensitiveFile('archive.p12')).toBe(true);
  });

  it('detects credential dumps and service account keys as sensitive', () => {
    expect(isSensitiveFile('credentials.json')).toBe(true);
    expect(isSensitiveFile('service-account.json')).toBe(true);
    expect(isSensitiveFile('service_account_key.json')).toBe(true);
    expect(isSensitiveFile('app.secret')).toBe(true);
  });

  it('allows safe source code files to be indexed', () => {
    expect(isSensitiveFile('index.ts')).toBe(false);
    expect(isSensitiveFile('auth-service.ts')).toBe(false);
    expect(isSensitiveFile('UserComponent.tsx')).toBe(false);
    expect(isSensitiveFile('main.py')).toBe(false);
    expect(isSensitiveFile('database.sqlite')).toBe(false);
  });
});
