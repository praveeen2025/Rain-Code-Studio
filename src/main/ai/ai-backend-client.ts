/**
 * SnapDev AI - Main Process AI Backend Client
 * Connects the Electron Main process with the local Python FastAPI AI endpoints.
 * Handles local model lifecycle, inference requests, and generation cancellation.
 * 100% on-device local execution; zero telemetry or external network calls.
 */

import {
  AIStatusResponse,
  ModelInfo,
  LoadModelRequest,
  ChatRequest,
  ChatResponse
} from '../../shared/types';

export class AIBackendClient {
  private baseUrl: string;

  constructor(host = '127.0.0.1', port = 8765) {
    this.baseUrl = `http://${host}:${port}`;
  }

  public setBaseUrl(host: string, port: number): void {
    this.baseUrl = `http://${host}:${port}`;
  }

  /**
   * Get current ModelManager status and state.
   */
  public async getStatus(): Promise<AIStatusResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/status`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`AI status HTTP error: ${res.statusText}`);
      }

      return (await res.json()) as AIStatusResponse;
    } catch (err) {
      return {
        status: 'error',
        isLoaded: false,
        modelInfo: {
          modelName: 'snapdev-local-code-q4',
          modelVersion: '1.0.0',
          modelFormat: 'safetensors',
          quantization: 'q4_k_m',
          contextLength: 4096,
          device: 'cpu',
          runtime: 'Local Grounded Inference Runtime',
          isLoaded: false,
          status: 'error'
        },
        activeRequests: 0,
        currentTask: err instanceof Error ? err.message : 'Backend unreachable'
      };
    }
  }

  /**
   * Get model specifications and detected hardware capabilities.
   */
  public async getModelInfo(): Promise<ModelInfo> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/model`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`AI model HTTP error: ${res.statusText}`);
      }

      return (await res.json()) as ModelInfo;
    } catch (err) {
      return {
        modelName: 'snapdev-local-code-q4',
        modelVersion: '1.0.0',
        modelFormat: 'safetensors',
        quantization: 'q4_k_m',
        contextLength: 4096,
        device: 'cpu',
        runtime: 'Local Grounded Inference Runtime',
        isLoaded: false,
        status: 'error'
      };
    }
  }

  /**
   * Load local model weights into memory.
   */
  public async loadModel(
    req?: LoadModelRequest
  ): Promise<{ success: boolean; message: string; modelInfo: ModelInfo }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/load`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req || {})
      });

      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message ?? (res.ok ? 'Model loaded' : 'Failed to load model'),
        modelInfo: data.model_info || data.modelInfo
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to load model',
        modelInfo: {
          modelName: 'snapdev-local-code-q4',
          modelVersion: '1.0.0',
          modelFormat: 'safetensors',
          quantization: 'q4_k_m',
          contextLength: 4096,
          device: 'cpu',
          runtime: 'Local Grounded Inference Runtime',
          isLoaded: false,
          status: 'error'
        }
      };
    }
  }

  /**
   * Unload model from memory to free system resources.
   */
  public async unloadModel(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/unload`, {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });

      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message ?? 'Model unloaded'
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to unload model'
      };
    }
  }

  /**
   * Send a chat message with local RAG context retrieval and model inference.
   */
  public async sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: req.projectId,
          query: req.query,
          messages: req.messages,
          settings: req.settings,
          includeRagContext: req.includeRagContext ?? true,
          maxRagChunks: req.maxRagChunks ?? 5
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Inference error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        messageId: data.message_id || data.messageId,
        role: data.role || 'assistant',
        content: data.content || '',
        sources: (data.sources || []).map((s: any) => ({
          filePath: s.file_path || s.filePath,
          relativePath: s.relative_path || s.relativePath,
          startLine: s.start_line ?? s.startLine,
          endLine: s.end_line ?? s.endLine,
          symbolName: s.symbol_name || s.symbolName,
          snippet: s.snippet
        })),
        modelName: data.model_name || data.modelName,
        generationTimeMs: data.generation_time_ms ?? data.generationTimeMs ?? 0,
        promptTokens: data.prompt_tokens ?? data.promptTokens,
        completionTokens: data.completion_tokens ?? data.completionTokens,
        tokensPerSecond: data.tokens_per_second ?? data.tokensPerSecond,
        hardwareAccelerator: data.hardware_accelerator ?? data.hardwareAccelerator,
        ragChunksUsed: data.rag_chunks_used ?? data.ragChunksUsed ?? 0
      };
    } catch (err) {
      return {
        messageId: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error during inference: ${err instanceof Error ? err.message : String(err)}`,
        sources: [],
        modelName: 'snapdev-local-code-q4',
        generationTimeMs: 0,
        ragChunksUsed: 0
      };
    }
  }

  /**
   * Cancel currently running generation.
   */
  public async stopGeneration(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/stop`, {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });

      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message ?? 'Generation stopped'
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to stop generation'
      };
    }
  }

  /**
   * Phase 12.2 — Load a model from the Local AI Model Hub into the active inference backend.
   * Switches the Python ModelManager to an OllamaProvider or LocalAIProvider
   * based on the selected model's provider type.
   */
  public async loadHubModel(params: {
    modelId: string;
    modelName: string;
    provider: string;
    filePath?: string;
    endpointUrl?: string;
    contextLength?: number;
    format?: string;
  }): Promise<{ success: boolean; message: string; status?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/load-hub-model`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId: params.modelId,
          modelName: params.modelName,
          provider: params.provider,
          filePath: params.filePath ?? null,
          endpointUrl: params.endpointUrl ?? null,
          contextLength: params.contextLength ?? 4096,
          format: params.format ?? null
        })
      });

      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message ?? (res.ok ? 'Model loaded successfully' : 'Load failed'),
        status: data.status
      };
    } catch (err) {
      return {
        success: false,
        message: `Backend unreachable: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
}

export const aiBackendClient = new AIBackendClient();
