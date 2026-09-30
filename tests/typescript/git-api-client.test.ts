/**
 * Unit tests for Phase 7 Git AI Client API methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackendApiClient } from '../../src/renderer/services/api';
import {
  CommitMessageRequest,
  CommitMessageSuggestion,
  ExplainCommitRequest,
  CommitAnalysis
} from '../../src/shared/types';

describe('BackendApiClient - Phase 7 Git AI Methods', () => {
  let client: BackendApiClient;

  beforeEach(() => {
    client = new BackendApiClient('http://127.0.0.1:8765');
    vi.restoreAllMocks();
  });

  it('calls POST /api/ai/commit-message and returns CommitMessageSuggestion', async () => {
    const mockResult: CommitMessageSuggestion = {
      suggestedMessage: 'feat(git): add commit workflow\n\n- adds panel\n- adds diff view',
      shortSummary: 'feat(git): add commit workflow',
      conventionalType: 'feat',
      scope: 'git',
      reasoning: 'Changes introduce new Git intelligence features',
      warnings: [],
      generationTimeMs: 140
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const req: CommitMessageRequest = {
      stagedDiff: '--- a/app.ts\n+++ b/app.ts\n+console.log("hello");',
      hint: 'feature for git'
    };

    const res = await client.generateCommitMessage(req);
    expect(res.success).toBe(true);
    expect(res.data?.conventionalType).toBe('feat');
    expect(res.data?.shortSummary).toBe('feat(git): add commit workflow');
  });

  it('calls POST /api/ai/explain-commit and returns CommitAnalysis', async () => {
    const mockResult: CommitAnalysis = {
      summary: 'Introduces Git diff review and commit authoring',
      filesAffected: ['src/git.ts', 'src/ui.tsx'],
      mainChanges: ['Added status parser', 'Added commit panel'],
      potentialImpact: 'Zero risk to existing workspace features',
      relatedSymbols: ['GitManager'],
      confidence: 0.95,
      generationTimeMs: 180
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResult
    } as unknown as Response);

    const req: ExplainCommitRequest = {
      hash: 'a1b2c3d4e5f6',
      message: 'feat: add git intelligence',
      author: 'Jane Dev',
      date: '2026-09-29T10:00:00Z',
      diff: 'diff --git a/src/git.ts b/src/git.ts\n+export class GitManager {}'
    };

    const res = await client.explainCommit(req);
    expect(res.success).toBe(true);
    expect(res.data?.summary).toBe('Introduces Git diff review and commit authoring');
    expect(res.data?.filesAffected).toContain('src/git.ts');
  });
});
