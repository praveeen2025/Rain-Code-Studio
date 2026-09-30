/**
 * SnapDev AI - TypeScript Phase 4 Local RAG Foundation Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { codeContextExtractor } from '../../src/main/indexer/code-chunker';
import { ParsedFile } from '../../src/shared/types';
import { BackendApiClient } from '../../src/renderer/services/api';
import { IPC_CHANNELS } from '../../src/shared/constants';

describe('Phase 4: Code Chunker & Hierarchy', () => {
  it('should extract hierarchical chunks from parsed functions and methods', () => {
    const mockParsedFile: ParsedFile = {
      filePath: 'D:/project/src/auth.ts',
      relativePath: 'src/auth.ts',
      language: 'typescript',
      lineCount: 40,
      parseStatus: 'indexed',
      parseErrors: [],
      dependencies: ['user'],
      imports: [
        {
          id: 'imp1',
          source: './user',
          specifiers: ['User', 'Session'],
          isDefault: false,
          isNamespace: false,
          line: 1
        }
      ],
      exports: [],
      symbols: [
        {
          id: 'sym_auth_class',
          name: 'AuthService',
          kind: 'class',
          language: 'typescript',
          filePath: 'D:/project/src/auth.ts',
          relativePath: 'src/auth.ts',
          startLine: 3,
          endLine: 10,
          startColumn: 1,
          endColumn: 2
        },
        {
          id: 'sym_login_method',
          name: 'login',
          kind: 'method',
          language: 'typescript',
          filePath: 'D:/project/src/auth.ts',
          relativePath: 'src/auth.ts',
          startLine: 7,
          endLine: 9,
          startColumn: 3,
          endColumn: 4,
          parentSymbol: 'AuthService'
        }
      ]
    };

    const content = `import { User, Session } from './user';\n\nexport class AuthService {\n  // constructor\n  constructor() {}\n\n  async login(email: string): Promise<Session> {\n    return { token: 'tok_1' };\n  }\n}\n`;

    const chunks = codeContextExtractor.createChunksFromFile(
      'proj_1',
      'file_1',
      mockParsedFile,
      content
    );

    expect(chunks.length).toBe(2);

    // Class chunk
    const classChunk = chunks.find((c) => c.symbolName === 'AuthService');
    expect(classChunk).toBeDefined();
    expect(classChunk?.symbolKind).toBe('class');
    expect(classChunk?.startLine).toBe(3);
    expect(classChunk?.fileHash).toBeDefined();
    expect(classChunk?.imports).toHaveLength(1);
    expect(classChunk?.imports?.[0]).toContain('./user');

    // Method chunk
    const methodChunk = chunks.find((c) => c.symbolName === 'login');
    expect(methodChunk).toBeDefined();
    expect(methodChunk?.symbolKind).toBe('method');
    expect(methodChunk?.parentSymbol).toBe('AuthService');
    expect(methodChunk?.content).toContain('async login');
  });

  it('should generate fallback chunks for files without structural symbols', () => {
    const mockScriptFile: ParsedFile = {
      filePath: 'D:/project/scripts/init.py',
      relativePath: 'scripts/init.py',
      language: 'python',
      lineCount: 10,
      parseStatus: 'indexed',
      parseErrors: [],
      dependencies: [],
      imports: [],
      exports: [],
      symbols: [] // No classes/functions
    };

    const fileContent = 'import os\nprint("Initializing...")\nos.environ["KEY"] = "val"\n';
    const chunks = codeContextExtractor.createChunksFromFile(
      'proj_1',
      'file_script',
      mockScriptFile,
      fileContent
    );

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].symbolKind).toBe('module');
    expect(chunks[0].content).toContain('Initializing');
    expect(chunks[0].fileHash).toBeDefined();
  });
});

describe('Phase 4: RAG IPC Channels', () => {
  it('should define RAG search, context, and status IPC channels', () => {
    expect(IPC_CHANNELS.RAG_SEARCH).toBe('rag:search');
    expect(IPC_CHANNELS.RAG_GET_CONTEXT).toBe('rag:get-context');
    expect(IPC_CHANNELS.RAG_GET_STATUS).toBe('rag:get-status');
    expect(IPC_CHANNELS.RAG_INDEX_PROJECT).toBe('rag:index-project');
  });
});

describe('Phase 4: Backend API Client RAG Methods', () => {
  let client: BackendApiClient;

  beforeEach(() => {
    client = new BackendApiClient('http://127.0.0.1:8765');
  });

  it('should send POST request to /api/rag/search with correct options', async () => {
    const mockResponse = {
      results: [
        {
          resultId: 'res_1',
          chunkId: 'c1',
          filePath: 'src/auth.ts',
          relativePath: 'src/auth.ts',
          symbolName: 'login',
          symbolKind: 'function',
          language: 'typescript',
          startLine: 1,
          endLine: 20,
          content: 'function login() {}',
          similarityScore: 0.95,
          retrievalSources: ['Semantic similarity']
        }
      ],
      total_results: 1,
      search_time_ms: 3.5,
      mode: 'hybrid'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });

    const res = await client.searchProject({
      projectId: 'proj_1',
      query: 'Where is authentication?',
      mode: 'hybrid',
      limit: 5
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/api/rag/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    );
    expect(res.success).toBe(true);
    expect(res.data?.results).toHaveLength(1);
    expect(res.data?.results[0].symbolName).toBe('login');
  });

  it('should send POST request to /api/rag/context to compile AI-ready context bundle', async () => {
    const mockContext = {
      projectId: 'proj_1',
      query: 'auth handler',
      retrievalMode: 'hybrid',
      totalChunks: 1,
      totalCharacters: 150,
      estimatedTokens: 38,
      formattedPromptContext: '=== CONTEXT ===\nAuthService.login',
      chunks: [],
      generationTimeMs: 4.2
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockContext
    });

    const res = await client.buildProjectContext({
      projectId: 'proj_1',
      query: 'auth handler',
      mode: 'hybrid'
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/api/rag/context',
      expect.objectContaining({
        method: 'POST'
      })
    );
    expect(res.success).toBe(true);
    expect(res.data?.estimatedTokens).toBe(38);
    expect(res.data?.formattedPromptContext).toContain('AuthService.login');
  });
});
