/**
 * SnapDev AI - Indexer & Database Test Suite
 * Validates SQLite repository persistence, symbol search, context extraction, and chunk generation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sqliteManager } from '../../src/main/database/sqlite-manager';
import { indexRepository } from '../../src/main/database/index-repository';
import { codeContextExtractor } from '../../src/main/indexer/code-chunker';
import { TypeScriptParser } from '../../src/main/parser/typescript-parser';
import { Project } from '../../src/shared/types';

describe('SQLite Database & Index Repository', () => {
  const testProject: Project = {
    id: 'test_proj_1',
    name: 'Test Project',
    path: '/mock/project',
    isDemo: false,
    createdAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
    fileCount: 5
  };

  beforeAll(async () => {
    await sqliteManager.initialize();
    indexRepository.upsertProject(testProject);
  });

  afterAll(() => {
    sqliteManager.close();
  });

  it('should save parsed file and query symbols', async () => {
    const tsParser = new TypeScriptParser();
    const code = `
export class AuthService {
  public login(token: string): boolean {
    return token.length > 0;
  }
}

export function validateToken(token: string): boolean {
  return true;
}
    `.trim();

    const parsed = await tsParser.safeParse(
      '/mock/project/src/auth.ts',
      'src/auth.ts',
      code
    );

    indexRepository.saveParsedFile(testProject.id, parsed);

    const fileSymbols = indexRepository.getFileSymbols(
      testProject.id,
      '/mock/project/src/auth.ts'
    );

    expect(fileSymbols).not.toBeNull();
    expect(fileSymbols?.symbols.length).toBeGreaterThanOrEqual(2);
    expect(fileSymbols?.symbols.some((s) => s.name === 'AuthService')).toBe(true);
    expect(fileSymbols?.symbols.some((s) => s.name === 'validateToken')).toBe(true);
  });

  it('should search symbols by name substring and kind filter', () => {
    const results = indexRepository.searchSymbols(testProject.id, {
      query: 'Auth',
      kind: 'all'
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Auth');

    const funcResults = indexRepository.searchSymbols(testProject.id, {
      query: 'validate',
      kind: 'function'
    });

    expect(funcResults.length).toBe(1);
    expect(funcResults[0].name).toBe('validateToken');
  });

  it('should calculate accurate project statistics', () => {
    const stats = indexRepository.getProjectStatistics(testProject.id);
    expect(stats.totalFiles).toBeGreaterThanOrEqual(1);
    expect(stats.totalSymbols).toBeGreaterThanOrEqual(2);
    expect(stats.classes).toBeGreaterThanOrEqual(1);
    expect(stats.functions).toBeGreaterThanOrEqual(1);
  });

  it('should generate structural code chunks for future RAG', async () => {
    const chunks = indexRepository.getAllCodeChunks(testProject.id);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].projectId).toBe(testProject.id);
    expect(chunks[0].symbolName).toBeDefined();
  });

  it('should prepare code chunks from file content via CodeContextExtractor', async () => {
    const tsParser = new TypeScriptParser();
    const code = `
export function calculateTax(amount: number): number {
  return amount * 0.15;
}
    `.trim();

    const parsed = await tsParser.safeParse('/mock/calc.ts', 'calc.ts', code);
    const chunks = codeContextExtractor.createChunksFromFile(
      testProject.id,
      'file_1',
      parsed,
      code
    );

    expect(chunks.length).toBe(1);
    expect(chunks[0].symbolName).toBe('calculateTax');
    expect(chunks[0].content).toContain('return amount * 0.15;');
  });

  it('should delete file and its associated symbols cleanly', () => {
    indexRepository.deleteFile(testProject.id, '/mock/project/src/auth.ts');
    const remaining = indexRepository.getFileSymbols(
      testProject.id,
      '/mock/project/src/auth.ts'
    );
    expect(remaining).toBeNull();
  });
});
