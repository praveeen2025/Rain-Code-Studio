/**
 * SnapDev AI - Chat Store
 * State management for local AI chat, streaming responses, model lifecycle, and hardware telemetry.
 * 100% on-device local execution; zero telemetry or external network transmission.
 */

import {
  ChatMessage,
  ModelStatus,
  ModelInfo,
  SourceReference,
  GenerationSettings,
  ChatResponse
} from '../../shared/types';
import {
  getAIStatus,
  loadModel,
  unloadModel,
  streamChatMessage,
  stopGeneration as stopGenerationApi
} from '../services/api';

type Listener = () => void;

interface ChatStoreState {
  messages: ChatMessage[];
  modelStatus: ModelStatus;
  modelInfo: ModelInfo | null;
  isGenerating: boolean;
  error: string | null;
  lastSources: SourceReference[];
  settings: GenerationSettings;
  activeTaskId: string | null;
  lastGenerationMetrics: {
    generationTimeMs: number;
    tokensPerSecond: number | null;
    totalTokens: number | null;
    accelerator: string | null;
  } | null;
}

class ChatStore {
  private state: ChatStoreState = {
    messages: [],
    modelStatus: 'ready',
    modelInfo: {
      modelName: 'snapdev-local-code-q4',
      modelVersion: '1.0.0',
      modelFormat: 'safetensors',
      quantization: 'q4_k_m',
      contextLength: 4096,
      device: 'cpu',
      runtime: 'Local Grounded Inference Runtime',
      isLoaded: true,
      status: 'ready'
    },
    isGenerating: false,
    error: null,
    lastSources: [],
    settings: {
      temperature: 0.2,
      maxTokens: 1024,
      topP: 0.95,
      contextSize: 4096,
      stream: true
    },
    activeTaskId: null,
    lastGenerationMetrics: null
  };

  private listeners: Set<Listener> = new Set();
  private abortController: AbortController | null = null;

  constructor() {
    this.refreshStatus();
  }

  public getState(): ChatStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setState(updates: Partial<ChatStoreState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Refresh ModelManager status from backend.
   */
  public async refreshStatus(): Promise<void> {
    try {
      const res = await getAIStatus();
      if (res.success && res.data) {
        this.setState({
          modelStatus: res.data.status,
          modelInfo: res.data.modelInfo,
          isGenerating: res.data.status === 'generating'
        });
      }
    } catch (err) {
      // Backend may be starting up
    }
  }

  /**
   * Explicitly load model weights into local memory.
   */
  public async loadLocalModel(modelPath?: string, device?: string): Promise<boolean> {
    this.setState({ modelStatus: 'loading', error: null });
    try {
      const res = await loadModel({ modelPath, device });
      if (res.success && res.data) {
        this.setState({
          modelStatus: res.data.modelInfo.status,
          modelInfo: res.data.modelInfo,
          error: null
        });
        return true;
      } else {
        this.setState({
          modelStatus: 'error',
          error: res.error || 'Failed to load model'
        });
        return false;
      }
    } catch (err) {
      this.setState({
        modelStatus: 'error',
        error: err instanceof Error ? err.message : String(err)
      });
      return false;
    }
  }

  /**
   * Explicitly unload model to reclaim system memory.
   */
  public async unloadLocalModel(): Promise<boolean> {
    this.setState({ modelStatus: 'unloading', error: null });
    try {
      const res = await unloadModel();
      if (res.success) {
        await this.refreshStatus();
        return true;
      } else {
        this.setState({ error: res.error || 'Failed to unload model' });
        return false;
      }
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : String(err)
      });
      return false;
    }
  }

  /**
   * Update generation hyperparameters.
   */
  public updateSettings(newSettings: Partial<GenerationSettings>): void {
    this.setState({
      settings: { ...this.state.settings, ...newSettings }
    });
  }

  /**
   * Send a chat question with on-device RAG grounding and progressive streaming.
   */
  public async sendMessage(query: string, projectId?: string | null): Promise<void> {
    const cleanQuery = query.trim();
    if (!cleanQuery || this.state.isGenerating) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: cleanQuery,
      timestamp: new Date().toISOString(),
      status: 'complete'
    };

    const assistantMessageId = `msg-reply-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'generating',
      sources: []
    };

    const updatedMessages = [...this.state.messages, userMessage, assistantMessage];
    this.setState({
      messages: updatedMessages,
      isGenerating: true,
      modelStatus: 'generating',
      error: null
    });

    this.abortController = new AbortController();

    const onChunk = (token: string) => {
      this.setState({
        messages: this.state.messages.map((m) => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content: m.content + token,
              status: 'generating'
            };
          }
          return m;
        })
      });
    };

    const onComplete = (res: ChatResponse) => {
      this.setState({
        messages: this.state.messages.map((m) => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content: res.content || m.content,
              sources: res.sources,
              status: 'complete',
              generationTimeMs: res.generationTimeMs,
              tokensPerSecond: res.tokensPerSecond,
              totalTokens: res.completionTokens
            };
          }
          return m;
        }),
        lastSources: res.sources,
        isGenerating: false,
        modelStatus: 'ready',
        lastGenerationMetrics: {
          generationTimeMs: res.generationTimeMs,
          tokensPerSecond: res.tokensPerSecond || null,
          totalTokens: res.completionTokens || null,
          accelerator: res.hardwareAccelerator || null
        }
      });
      this.abortController = null;
    };

    const onError = (errMsg: string) => {
      const isCancelled = errMsg.toLowerCase().includes('cancelled') || errMsg.toLowerCase().includes('abort');
      this.setState({
        messages: this.state.messages.map((m) => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              status: isCancelled ? 'cancelled' : 'error',
              error: errMsg,
              content: m.content || (isCancelled ? '*(Generation stopped by user)*' : `*Inference error: ${errMsg}*`)
            };
          }
          return m;
        }),
        isGenerating: false,
        modelStatus: isCancelled ? 'ready' : 'error',
        error: isCancelled ? null : errMsg
      });
      this.abortController = null;
    };

    await streamChatMessage(
      {
        projectId,
        query: cleanQuery,
        messages: this.state.messages,
        settings: this.state.settings,
        includeRagContext: true,
        maxRagChunks: 5
      },
      onChunk,
      onComplete,
      onError,
      this.abortController.signal
    );
  }

  /**
   * Stop active generation and release resources immediately.
   */
  public async stopGeneration(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    try {
      await stopGenerationApi();
    } catch {
      // Ignore API stop error if aborted locally
    }

    this.setState({
      isGenerating: false,
      modelStatus: 'ready',
      messages: this.state.messages.map((m) =>
        m.status === 'generating' ? { ...m, status: 'cancelled' } : m
      )
    });
  }

  /**
   * Clear conversation history.
   */
  public clearChat(): void {
    this.setState({
      messages: [],
      lastSources: [],
      error: null
    });
  }
}

export const chatStore = new ChatStore();
