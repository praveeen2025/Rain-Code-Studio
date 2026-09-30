/**
 * SnapDev AI - Main Process RAG Backend Client
 * Connects the Electron Main process with the local Python FastAPI RAG endpoints.
 * Handles vector indexing orchestration, search queries, and AI context building.
 * Zero external network transmission.
 */

import {
  CodeChunk,
  RetrievalResult,
  AIContextPackage,
  RAGStatusResponse,
  RAGSearchQuery,
  RAGContextQuery
} from '../../shared/types';

export class RagBackendClient {
  private baseUrl: string;

  constructor(host = '127.0.0.1', port = 8765) {
    this.baseUrl = `http://${host}:${port}`;
  }

  public setBaseUrl(host: string, port: number): void {
    this.baseUrl = `http://${host}:${port}`;
  }

  /**
   * Submit project code chunks to local vector store for embedding and indexing.
   */
  public async indexProject(
    projectId: string,
    projectPath: string,
    chunks: CodeChunk[]
  ): Promise<{ success: boolean; vectorsCount: number; indexingTimeMs: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/rag/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectPath, chunks })
      });

      if (!res.ok) {
        throw new Error(`RAG index HTTP error: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: data.success,
        vectorsCount: data.vectors_count || 0,
        indexingTimeMs: data.indexing_time_ms || 0
      };
    } catch (err) {
      console.warn(`[RagBackendClient] Failed to index project in RAG backend:`, err);
      return { success: false, vectorsCount: 0, indexingTimeMs: 0 };
    }
  }

  /**
   * Incrementally update vectors for a single file.
   */
  public async updateFile(
    projectId: string,
    filePath: string,
    fileId: string,
    chunks: CodeChunk[]
  ): Promise<{ success: boolean; totalVectors: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/rag/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, filePath, fileId, chunks })
      });

      if (!res.ok) {
        throw new Error(`RAG file update HTTP error: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: data.success,
        totalVectors: data.total_vectors || 0
      };
    } catch (err) {
      console.warn(`[RagBackendClient] Failed to update file in RAG backend:`, err);
      return { success: false, totalVectors: 0 };
    }
  }

  /**
   * Remove vectors for a deleted file.
   */
  public async deleteFile(
    projectId: string,
    filePath: string
  ): Promise<{ success: boolean; totalVectors: number }> {
    try {
      const url = new URL(`${this.baseUrl}/api/rag/file`);
      url.searchParams.set('project_id', projectId);
      url.searchParams.set('file_path', filePath);

      const res = await fetch(url.toString(), {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error(`RAG file delete HTTP error: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: data.success,
        totalVectors: data.total_vectors || 0
      };
    } catch (err) {
      console.warn(`[RagBackendClient] Failed to delete file vectors in RAG backend:`, err);
      return { success: false, totalVectors: 0 };
    }
  }

  /**
   * Execute local hybrid/semantic/symbol/file retrieval.
   */
  public async search(query: RAGSearchQuery): Promise<RetrievalResult[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: query.projectId,
          query: query.query,
          mode: query.mode || 'hybrid',
          limit: query.limit || 10,
          filterKinds: query.filterKinds,
          filterLanguages: query.filterLanguages
        })
      });

      if (!res.ok) {
        throw new Error(`RAG search HTTP error: ${res.statusText}`);
      }

      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.warn(`[RagBackendClient] RAG search error:`, err);
      return [];
    }
  }

  /**
   * Build AI-Ready Context package for a query.
   */
  public async getContext(query: RAGContextQuery): Promise<AIContextPackage> {
    try {
      const res = await fetch(`${this.baseUrl}/api/rag/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: query.projectId,
          query: query.query,
          mode: query.mode || 'hybrid',
          maxChunks: query.maxChunks,
          maxCharacters: query.maxCharacters
        })
      });

      if (!res.ok) {
        throw new Error(`RAG context HTTP error: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`[RagBackendClient] RAG getContext error:`, err);
      return {
        projectId: query.projectId,
        query: query.query,
        retrievalMode: query.mode || 'hybrid',
        totalChunks: 0,
        totalCharacters: 0,
        estimatedTokens: 0,
        formattedPromptContext: `Error retrieving local code context: ${err}`,
        chunks: [],
        generationTimeMs: 0
      };
    }
  }

  /**
   * Get RAG index status from Python backend.
   */
  public async getStatus(projectId?: string): Promise<RAGStatusResponse> {
    try {
      const url = new URL(`${this.baseUrl}/api/rag/status`);
      if (projectId) {
        url.searchParams.set('project_id', projectId);
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`RAG status HTTP error: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      return {
        status: 'not_indexed',
        projectId,
        totalChunks: 0,
        totalVectors: 0,
        totalFiles: 0,
        embeddingModel: 'local-code-mini-384',
        embeddingDimension: 384,
        embeddingDevice: 'cpu',
        indexSizeBytes: 0
      };
    }
  }
}

export const ragBackendClient = new RagBackendClient();
