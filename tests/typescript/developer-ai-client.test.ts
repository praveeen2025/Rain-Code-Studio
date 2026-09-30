/**
 * Unit tests for Phase 6 Developer AI API Client Methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackendApiClient } from '../../src/renderer/services/api';
import {
  CodeContextInput,
  ExplanationResult,
  BugAnalysisResult,
  CodeReviewResult,
  TestGenerationResult,
  DocumentationResult,
  ChangeResult,
  ImprovementResult
} from '../../src/shared/types';

describe('BackendApiClient - Phase 6 Developer AI Methods', () => {
  let client: BackendApiClient;

  beforeEach(() => {
    client = new BackendApiClient('http://127.0.0.1:8765');
    vi.restoreAllMocks();
  });

  it('calls POST /api/ai/explain and returns ExplanationResult', async () => {
    const mockResult: ExplanationResult = {
      summary: 'Authenticates users against secure credential store',
      purpose: 'User authentication',
      key_components: ['validation', 'lookup'],
      flow: ['input -> db query -> return verified'],
      dependencies: ['database'],
      important_symbols: ['authenticateUser'],
      assumptions: ['valid connection'],
      sources: [],
      generationTimeMs: 120
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const input: CodeContextInput = {
      filePath: 'src/auth.ts',
      symbolName: 'authenticateUser',
      selectedCode: 'function authenticateUser() {}'
    };

    const res = await client.explainCode(input);
    expect(res.success).toBe(true);
    expect(res.data?.summary).toBe('Authenticates users against secure credential store');
    expect(res.data?.important_symbols).toContain('authenticateUser');
  });

  it('calls POST /api/ai/analyze-bug and returns BugAnalysisResult', async () => {
    const mockResult: BugAnalysisResult = {
      summary: 'Unchecked parameter discountPercent produces NaN',
      severity: 'high',
      confidence: 0.95,
      likely_cause: 'Missing undefined check',
      affected_files: ['src/discount.ts'],
      affected_symbols: ['calculateDiscount'],
      evidence: ['discountPercent is used directly'],
      suggested_fix: 'Add default value discountPercent = 0',
      sources: [],
      generationTimeMs: 95
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const input: CodeContextInput = {
      filePath: 'src/discount.ts',
      errorMessage: 'Expected number got NaN'
    };

    const res = await client.analyzeBug(input);
    expect(res.success).toBe(true);
    expect(res.data?.severity).toBe('high');
    expect(res.data?.likely_cause).toContain('Missing undefined check');
  });

  it('calls POST /api/ai/improve and returns ImprovementResult', async () => {
    const mockResult: ImprovementResult = {
      summary: 'Add parameter type checking',
      category: 'type_safety',
      explanation: 'Prevents runtime type errors',
      suggested_code: 'function authenticateUser(username: string) {}',
      sources: [],
      generationTimeMs: 80
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const res = await client.improveCode({ filePath: 'src/auth.ts' });
    expect(res.success).toBe(true);
    expect(res.data?.category).toBe('type_safety');
  });

  it('calls POST /api/ai/review and returns CodeReviewResult', async () => {
    const mockResult: CodeReviewResult = {
      summary: 'Good modular design with slight error handling gaps',
      overallScore: 88,
      findings: [
        {
          severity: 'warning',
          category: 'error_handling',
          file: 'src/auth.ts',
          line: 12,
          explanation: 'Uncaught promise rejection potential',
          suggestion: 'Wrap in try/catch block'
        }
      ],
      strengths: ['Modular functions'],
      sources: [],
      generationTimeMs: 140
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const res = await client.reviewCode({ filePath: 'src/auth.ts' });
    expect(res.success).toBe(true);
    expect(res.data?.overallScore).toBe(88);
    expect(res.data?.findings.length).toBe(1);
  });

  it('calls POST /api/ai/generate-tests and returns TestGenerationResult', async () => {
    const mockResult: TestGenerationResult = {
      summary: 'Generated 3 unit test cases for authenticateUser',
      framework: 'Vitest',
      test_cases: [
        {
          name: 'should authenticate valid credentials',
          description: 'Validates correct password match',
          type: 'unit',
          code: 'it("works", () => {})'
        }
      ],
      generated_code: 'import { describe, it } from "vitest";',
      assumptions: ['Mock database'],
      target_file: 'auth.test.ts',
      sources: [],
      generationTimeMs: 160
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const res = await client.generateTests({ filePath: 'src/auth.ts', testFramework: 'vitest' });
    expect(res.success).toBe(true);
    expect(res.data?.framework).toBe('Vitest');
    expect(res.data?.test_cases.length).toBe(1);
  });

  it('calls POST /api/ai/generate-docs and returns DocumentationResult', async () => {
    const mockResult: DocumentationResult = {
      summary: 'Generated TSDoc documentation for auth module',
      docType: 'function',
      generated_documentation: '/**\n * Authenticates user\n */',
      documented_symbols: ['authenticateUser'],
      assumptions: [],
      sources: [],
      generationTimeMs: 90
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const res = await client.generateDocs({ filePath: 'src/auth.ts' });
    expect(res.success).toBe(true);
    expect(res.data?.docType).toBe('function');
  });

  it('calls POST /api/ai/generate-change and returns ChangeResult with patches', async () => {
    const mockResult: ChangeResult = {
      summary: 'Add null guard clause to calculateDiscount',
      files_changed: ['src/discount.ts'],
      patches: [
        {
          filePath: 'src/discount.ts',
          relativePath: 'src/discount.ts',
          originalContent: 'function calculateDiscount() {}',
          originalContentHash: 'abc123hash',
          modifiedContent: 'function calculateDiscount(price = 0) {}',
          diff: '--- a/src/discount.ts\n+++ b/src/discount.ts',
          explanation: 'Add default value'
        }
      ],
      warnings: ['Review diff carefully'],
      sources: [],
      generationTimeMs: 110
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const res = await client.generateChange({ filePath: 'src/discount.ts', query: 'Add null guard' });
    expect(res.success).toBe(true);
    expect(res.data?.patches.length).toBe(1);
    expect(res.data?.patches[0].originalContentHash).toBe('abc123hash');
  });
});
