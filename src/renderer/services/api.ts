/**
 * SnapDev AI - Frontend API Client
 * Communicates with the local FastAPI Python backend.
 * Provides typed methods with AbortController timeouts and structured error handling.
 */

import {
  DEFAULT_BACKEND_URL,
  HEALTH_CHECK_TIMEOUT_MS
} from '../../shared/constants';
import {
  BackendHealth,
  BackendStatus,
  ApiResponse
} from '../../shared/api-types';
import {
  AIStatusResponse,
  ModelInfo,
  ChatRequest,
  ChatResponse,
  LoadModelRequest,
  CodeContextInput,
  ExplanationResult,
  BugAnalysisResult,
  ImprovementResult,
  CodeReviewResult,
  TestGenerationResult,
  DocumentationResult,
  ChangeResult,
  CommitMessageRequest,
  CommitMessageSuggestion,
  ExplainCommitRequest,
  CommitAnalysis
} from '../../shared/types';

export class BackendApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  public setBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };
      }

      const data: T = await response.json();
      return {
        success: true,
        data,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      let errorMsg = 'Failed to connect to local backend';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMsg = `Connection timed out after ${timeoutMs}ms`;
        } else {
          errorMsg = err.message;
        }
      }

      return {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Health check: GET /health
   */
  public async checkBackendHealth(): Promise<ApiResponse<BackendHealth>> {
    return this.request<BackendHealth>('/health', { method: 'GET' });
  }

  /**
   * Status details: GET /api/status
   */
  public async getBackendStatus(): Promise<ApiResponse<BackendStatus>> {
    return this.request<BackendStatus>('/api/status', { method: 'GET' });
  }

  // ==================================================
  // PHASE 4: LOCAL RAG & RETRIEVAL API METHODS
  // ==================================================

  /**
   * Index code chunks into local vector store: POST /api/rag/index
   */
  public async indexProject(
    projectId: string,
    projectPath: string,
    chunks: import('../../shared/types').CodeChunk[]
  ): Promise<
    ApiResponse<{
      success: boolean;
      chunks_indexed: number;
      vectors_count: number;
      indexing_time_ms: number;
      status: string;
    }>
  > {
    return this.request('/api/rag/index', {
      method: 'POST',
      body: JSON.stringify({ projectId, projectPath, chunks })
    }, 30000);
  }

  /**
   * Clear and re-index project vector store: POST /api/rag/reindex
   */
  public async reindexProject(
    projectId: string,
    projectPath: string,
    chunks: import('../../shared/types').CodeChunk[]
  ): Promise<
    ApiResponse<{
      success: boolean;
      chunks_indexed: number;
      vectors_count: number;
    }>
  > {
    return this.request('/api/rag/reindex', {
      method: 'POST',
      body: JSON.stringify({ projectId, projectPath, chunks })
    }, 30000);
  }

  /**
   * Hybrid/Semantic/Symbol/File search: POST /api/rag/search
   */
  public async searchProject(
    query: import('../../shared/types').RAGSearchQuery
  ): Promise<
    ApiResponse<{
      results: import('../../shared/types').RetrievalResult[];
      total_results: number;
      search_time_ms: number;
      mode: string;
    }>
  > {
    return this.request('/api/rag/search', {
      method: 'POST',
      body: JSON.stringify({
        projectId: query.projectId,
        query: query.query,
        mode: query.mode || 'hybrid',
        limit: query.limit || 10,
        filterKinds: query.filterKinds,
        filterLanguages: query.filterLanguages
      })
    });
  }

  /**
   * Build AI-ready context package: POST /api/rag/context
   */
  public async buildProjectContext(
    query: import('../../shared/types').RAGContextQuery
  ): Promise<ApiResponse<import('../../shared/types').AIContextPackage>> {
    return this.request('/api/rag/context', {
      method: 'POST',
      body: JSON.stringify({
        projectId: query.projectId,
        query: query.query,
        mode: query.mode || 'hybrid',
        maxChunks: query.maxChunks,
        maxCharacters: query.maxCharacters
      })
    });
  }

  /**
   * Retrieve RAG vector index status: GET /api/rag/status
   */
  public async getRagStatus(
    projectId?: string
  ): Promise<ApiResponse<import('../../shared/types').RAGStatusResponse>> {
    const ep = projectId ? `/api/rag/status?project_id=${encodeURIComponent(projectId)}` : '/api/rag/status';
    return this.request(ep, { method: 'GET' });
  }

  /**
   * Clear local vector index: DELETE /api/rag/index
   */
  public async clearProjectIndex(
    projectId: string
  ): Promise<ApiResponse<{ success: boolean; projectId: string }>> {
    return this.request(`/api/rag/index?project_id=${encodeURIComponent(projectId)}`, {
      method: 'DELETE'
    });
  }

  // ==================================================
  // PHASE 5: LOCAL AI MODEL & INFERENCE METHODS
  // ==================================================

  /**
   * Get ModelManager status: GET /api/ai/status
   */
  public async getAIStatus(): Promise<ApiResponse<AIStatusResponse>> {
    return this.request<AIStatusResponse>('/api/ai/status', { method: 'GET' });
  }

  /**
   * Get model specifications & hardware detection: GET /api/ai/model
   */
  public async getModelInfo(): Promise<ApiResponse<ModelInfo>> {
    return this.request<ModelInfo>('/api/ai/model', { method: 'GET' });
  }

  /**
   * Load local model into memory: POST /api/ai/load
   */
  public async loadModel(
    req?: LoadModelRequest
  ): Promise<ApiResponse<{ success: boolean; message: string; modelInfo: ModelInfo }>> {
    return this.request('/api/ai/load', {
      method: 'POST',
      body: JSON.stringify(req || {})
    }, 60000);
  }

  /**
   * Unload model from memory: POST /api/ai/unload
   */
  public async unloadModel(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request('/api/ai/unload', { method: 'POST' });
  }

  /**
   * Send standard chat query: POST /api/ai/chat
   */
  public async sendChatMessage(req: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    return this.request<ChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        projectId: req.projectId,
        query: req.query,
        messages: req.messages,
        settings: req.settings,
        includeRagContext: req.includeRagContext ?? true,
        maxRagChunks: req.maxRagChunks ?? 5
      })
    }, 120000);
  }

  /**
   * Cancel running generation: POST /api/ai/stop
   */
  public async stopGeneration(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.request('/api/ai/stop', { method: 'POST' });
  }

  /**
   * Stream chat response via Server-Sent Events (SSE): POST /api/ai/chat/stream
   */
  public async streamChatMessage(
    req: ChatRequest,
    onChunk: (token: string) => void,
    onComplete: (res: ChatResponse) => void,
    onError: (err: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const url = `${this.baseUrl}/api/ai/chat/stream`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: req.projectId,
          query: req.query,
          messages: req.messages,
          settings: req.settings,
          includeRagContext: req.includeRagContext ?? true,
          maxRagChunks: req.maxRagChunks ?? 5
        }),
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        onError(`Inference error HTTP ${response.status}: ${errorText}`);
        return;
      }

      if (!response.body) {
        onError('Streaming not supported by backend response stream.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }

            if (parsed.type === 'token' && parsed.content) {
              onChunk(parsed.content);
            } else if (parsed.type === 'sources') {
              // intermediate sources event
            } else if (parsed.type === 'done' || parsed.role === 'assistant') {
              onComplete({
                messageId: parsed.messageId || parsed.message_id || `msg-${Date.now()}`,
                role: 'assistant',
                content: parsed.content || '',
                sources: parsed.sources || [],
                modelName: parsed.modelName || parsed.model_name || 'snapdev-local-code-q4',
                generationTimeMs: parsed.generationTimeMs ?? parsed.generation_time_ms ?? 0,
                promptTokens: parsed.promptTokens ?? parsed.prompt_tokens,
                completionTokens: parsed.completionTokens ?? parsed.completion_tokens,
                tokensPerSecond: parsed.tokensPerSecond ?? parsed.tokens_per_second,
                hardwareAccelerator: parsed.hardwareAccelerator ?? parsed.hardware_accelerator,
                ragChunksUsed: parsed.ragChunksUsed ?? parsed.rag_chunks_used ?? 0
              });
            }
          } catch {
            // ignore malformed SSE payload
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        onError('Generation cancelled by user');
      } else {
        onError(err instanceof Error ? err.message : String(err));
      }
    }
  }

  // ==================================================
  // PHASE 6: DEVELOPER AI ASSISTANCE METHODS
  // ==================================================

  /**
   * Explain code: POST /api/ai/explain
   */
  public async explainCode(ctx: CodeContextInput): Promise<ApiResponse<ExplanationResult>> {
    return this.request<ExplanationResult>('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Analyze bug: POST /api/ai/analyze-bug
   */
  public async analyzeBug(ctx: CodeContextInput): Promise<ApiResponse<BugAnalysisResult>> {
    return this.request<BugAnalysisResult>('/api/ai/analyze-bug', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Improve code: POST /api/ai/improve
   */
  public async improveCode(ctx: CodeContextInput): Promise<ApiResponse<ImprovementResult>> {
    return this.request<ImprovementResult>('/api/ai/improve', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Code review: POST /api/ai/review
   */
  public async reviewCode(ctx: CodeContextInput): Promise<ApiResponse<CodeReviewResult>> {
    return this.request<CodeReviewResult>('/api/ai/review', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Generate tests: POST /api/ai/generate-tests
   */
  public async generateTests(ctx: CodeContextInput): Promise<ApiResponse<TestGenerationResult>> {
    return this.request<TestGenerationResult>('/api/ai/generate-tests', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Generate documentation: POST /api/ai/generate-docs
   */
  public async generateDocs(ctx: CodeContextInput): Promise<ApiResponse<DocumentationResult>> {
    return this.request<DocumentationResult>('/api/ai/generate-docs', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Generate change patch: POST /api/ai/generate-change
   */
  public async generateChange(ctx: CodeContextInput): Promise<ApiResponse<ChangeResult>> {
    return this.request<ChangeResult>('/api/ai/generate-change', {
      method: 'POST',
      body: JSON.stringify(ctx)
    }, 60000);
  }

  /**
   * Generate conventional commit message: POST /api/ai/commit-message
   */
  public async generateCommitMessage(
    req: CommitMessageRequest
  ): Promise<ApiResponse<CommitMessageSuggestion>> {
    return this.request<CommitMessageSuggestion>('/api/ai/commit-message', {
      method: 'POST',
      body: JSON.stringify(req)
    }, 60000);
  }

  /**
   * Explain commit: POST /api/ai/explain-commit
   */
  public async explainCommit(
    req: ExplainCommitRequest
  ): Promise<ApiResponse<CommitAnalysis>> {
    return this.request<CommitAnalysis>('/api/ai/explain-commit', {
      method: 'POST',
      body: JSON.stringify(req)
    }, 60000);
  }
}

// Global singleton instance
export const apiClient = new BackendApiClient();

// Standalone exported helpers
export const checkBackendHealth = () => apiClient.checkBackendHealth();
export const getBackendStatus = () => apiClient.getBackendStatus();
export const searchProject = (q: import('../../shared/types').RAGSearchQuery) => apiClient.searchProject(q);
export const buildProjectContext = (q: import('../../shared/types').RAGContextQuery) => apiClient.buildProjectContext(q);
export const getRagStatus = (pid?: string) => apiClient.getRagStatus(pid);
export const clearProjectIndex = (pid: string) => apiClient.clearProjectIndex(pid);

// Phase 5 helpers
export const getAIStatus = () => apiClient.getAIStatus();
export const getModelInfo = () => apiClient.getModelInfo();
export const loadModel = (req?: LoadModelRequest) => apiClient.loadModel(req);
export const unloadModel = () => apiClient.unloadModel();
export const sendChatMessage = (req: ChatRequest) => apiClient.sendChatMessage(req);
export const streamChatMessage = (
  req: ChatRequest,
  onChunk: (token: string) => void,
  onComplete: (res: ChatResponse) => void,
  onError: (err: string) => void,
  signal?: AbortSignal
) => apiClient.streamChatMessage(req, onChunk, onComplete, onError, signal);
export const stopGeneration = () => apiClient.stopGeneration();

// Phase 6 helpers
export const explainCode = (ctx: CodeContextInput) => apiClient.explainCode(ctx);
export const analyzeBug = (ctx: CodeContextInput) => apiClient.analyzeBug(ctx);
export const improveCode = (ctx: CodeContextInput) => apiClient.improveCode(ctx);
export const reviewCode = (ctx: CodeContextInput) => apiClient.reviewCode(ctx);
export const generateTests = (ctx: CodeContextInput) => apiClient.generateTests(ctx);
export const generateDocs = (ctx: CodeContextInput) => apiClient.generateDocs(ctx);
export const generateChange = (ctx: CodeContextInput) => apiClient.generateChange(ctx);

// Phase 7 helpers
export const generateCommitMessage = (req: CommitMessageRequest) =>
  apiClient.generateCommitMessage(req);
export const explainCommit = (req: ExplainCommitRequest) =>
  apiClient.explainCommit(req);



