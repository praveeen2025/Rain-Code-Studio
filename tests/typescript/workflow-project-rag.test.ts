/**
 * SnapDev AI - Integration Test: Workflow 1 & 2
 * Open Project -> Scan -> AST Parse -> SQLite Index -> RAG Context Assembly
 *
 * Validates the full intelligence pipeline on a real project structure.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { sqliteManager } from '../../src/main/database/sqlite-manager';
import { indexRepository } from '../../src/main/database/index-repository';
import { filesystemManager } from '../../src/main/filesystem';
import { parserRegistry } from '../../src/main/parser';
import { codeContextExtractor } from '../../src/main/indexer/code-chunker';
import { Project } from '../../src/shared/types';

describe('Workflow 1 & 2: Project Scan -> AST Parse -> SQLite Index -> RAG Context', () => {
  const scratchDir = path.resolve('tests/scratch-rag-workflow');
  const project: Project = {
    id: 'proj_workflow_test',
    name: 'Workflow Test App',
    path: scratchDir,
    isDemo: true,
    createdAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
    fileCount: 2
  };

  const sampleCode1 = `
export interface UserSession {
  userId: string;
  token: string;
}

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map();

  public createSession(userId: string, token: string): UserSession {
    const session: UserSession = { userId, token };
    this.sessions.set(userId, session);
    return session;
  }

  public getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }
}
  `.trim();

  const sampleCode2 = `
import { SessionManager } from './session-manager';

export function authenticateRequest(authHeader: string): boolean {
  if (!authHeader.startsWith('Bearer ')) return false;
  return authHeader.length > 10;
}
  `.trim();

  beforeAll(async () => {
    await fs.mkdir(path.join(scratchDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(scratchDir, 'src', 'session-manager.ts'), sampleCode1, 'utf-8');
    await fs.writeFile(path.join(scratchDir, 'src', 'auth-middleware.ts'), sampleCode2, 'utf-8');

    await sqliteManager.initialize();
    sqliteManager.run('DELETE FROM symbols WHERE project_id = ?', [project.id]);
    sqliteManager.run('DELETE FROM files WHERE project_id = ?', [project.id]);
    sqliteManager.run('DELETE FROM imports WHERE project_id = ?', [project.id]);
    sqliteManager.run('DELETE FROM exports WHERE project_id = ?', [project.id]);
    indexRepository.upsertProject(project);
  });

  afterAll(async () => {
    sqliteManager.close();
    try {
      await fs.rm(scratchDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('Step 1: Scans project directory and builds file tree', async () => {
    const tree = await filesystemManager.readDirectoryTree(scratchDir);
    expect(tree).toBeDefined();
    expect(tree.length).toBeGreaterThan(0);

    const srcFolder = tree.find((item) => item.name === 'src');
    expect(srcFolder).toBeDefined();
    expect(srcFolder?.isDirectory).toBe(true);
    expect(srcFolder?.children?.length).toBe(2);
  });

  it('Step 2: AST parses discovered TypeScript source files', async () => {
    const file1Path = path.join(scratchDir, 'src', 'session-manager.ts');
    const content1 = await filesystemManager.readFile(file1Path, scratchDir);
    const parsed1 = await parserRegistry.parseFile(file1Path, 'src/session-manager.ts', content1);

    expect(parsed1.language).toContain('TypeScript');
    expect(parsed1.symbols.length).toBeGreaterThan(0);
    const classSymbol = parsed1.symbols.find((s) => s.name === 'SessionManager');
    expect(classSymbol).toBeDefined();
    expect(classSymbol?.kind).toBe('class');

    const file2Path = path.join(scratchDir, 'src', 'auth-middleware.ts');
    const content2 = await filesystemManager.readFile(file2Path, scratchDir);
    const parsed2 = await parserRegistry.parseFile(file2Path, 'src/auth-middleware.ts', content2);

    expect(parsed2.symbols.find((s) => s.name === 'authenticateRequest')).toBeDefined();
  });

  it('Step 3: Stores AST symbols in SQLite database and verifies index statistics', async () => {
    const file1Path = path.join(scratchDir, 'src', 'session-manager.ts');
    const parsed1 = await parserRegistry.parseFile(file1Path, 'src/session-manager.ts', sampleCode1);
    indexRepository.saveParsedFile(project.id, parsed1);

    const file2Path = path.join(scratchDir, 'src', 'auth-middleware.ts');
    const parsed2 = await parserRegistry.parseFile(file2Path, 'src/auth-middleware.ts', sampleCode2);
    indexRepository.saveParsedFile(project.id, parsed2);

    const stats = indexRepository.getProjectStatistics(project.id);
    expect(stats.totalFiles).toBe(2);
    expect(stats.totalSymbols).toBeGreaterThan(0);
    expect(stats.classes).toBe(1);
    expect(stats.functions).toBe(3); // 1 function + 2 methods
  });

  it('Step 4: Performs symbol search in SQLite repository', () => {
    const results = indexRepository.searchSymbols(project.id, { query: 'Session', kind: 'all' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.name === 'SessionManager')).toBe(true);
  });

  it('Step 5: Extracts RAG code chunks for context assembly', async () => {
    const file1Path = path.join(scratchDir, 'src', 'session-manager.ts');
    const parsed1 = await parserRegistry.parseFile(file1Path, 'src/session-manager.ts', sampleCode1);

    const chunks = codeContextExtractor.createChunksFromFile(project.id, 'file-session-1', parsed1, sampleCode1);
    expect(chunks.length).toBeGreaterThan(0);

    const classChunk = chunks.find((c) => c.symbolName === 'SessionManager');
    expect(classChunk).toBeDefined();
    expect(classChunk?.content).toContain('createSession');
    expect(classChunk?.content).toContain('getSession');
  });
});
