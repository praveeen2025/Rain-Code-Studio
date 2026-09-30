/**
 * SnapDev AI - TypeScript Unit & Integration Tests for Phase 5 Local AI
 * Tests API client AI methods, ChatStore state machine, streaming integration, and source references.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatStore } from '../../src/renderer/stores/chatStore';
import { BackendApiClient } from '../../src/renderer/services/api';
import {
  SourceReference,
  ModelInfo
} from '../../src/shared/types';

describe('Phase 5 Local AI - API Client & ChatStore', () => {
  beforeEach(() => {
    chatStore.clearChat();
    chatStore.setState({ modelStatus: 'ready' });
    vi.restoreAllMocks();
  });

  it('should initialize chatStore with default ready model state and empty messages', () => {
    const state = chatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.modelStatus).toBe('ready');
    expect(state.modelInfo?.modelName).toBe('snapdev-local-code-q4');
    expect(state.isGenerating).toBe(false);
    expect(state.settings.temperature).toBe(0.2);
    expect(state.settings.maxTokens).toBe(1024);
  });

  it('should update generation settings in chatStore', () => {
    chatStore.updateSettings({ temperature: 0.5, maxTokens: 2048 });
    const state = chatStore.getState();
    expect(state.settings.temperature).toBe(0.5);
    expect(state.settings.maxTokens).toBe(2048);
  });

  it('should clear messages and reset error on clearChat', () => {
    chatStore.setState({
      messages: [
        { id: '1', role: 'user', content: 'Test', timestamp: '2026-09-29T00:00:00Z' }
      ],
      error: 'Some error'
    });
    expect(chatStore.getState().messages.length).toBe(1);

    chatStore.clearChat();
    expect(chatStore.getState().messages.length).toBe(0);
    expect(chatStore.getState().error).toBeNull();
  });

  it('should invoke loadLocalModel and unloadLocalModel via backend client', async () => {
    const mockModelInfo: ModelInfo = {
      modelName: 'snapdev-local-code-q4',
      modelVersion: '1.0.0',
      modelFormat: 'safetensors',
      quantization: 'q4_k_m',
      contextLength: 4096,
      device: 'cpu',
      runtime: 'Local Grounded Inference Runtime',
      isLoaded: true,
      status: 'ready'
    };

    // Mock global fetch
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ai/load')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Model loaded',
            modelInfo: mockModelInfo
          })
        } as any;
      }
      if (urlStr.includes('/api/ai/unload')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Model unloaded'
          })
        } as any;
      }
      if (urlStr.includes('/api/ai/status')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'ready',
            isLoaded: true,
            modelInfo: mockModelInfo,
            activeRequests: 0
          })
        } as any;
      }
      return { ok: true, status: 200, json: async () => ({}) } as any;
    });

    const client = new BackendApiClient('http://127.0.0.1:8765');

    const loadRes = await client.loadModel();
    expect(loadRes.success).toBe(true);
    expect(loadRes.data?.modelInfo.modelName).toBe('snapdev-local-code-q4');

    const unloadRes = await client.unloadModel();
    expect(unloadRes.success).toBe(true);
    expect(unloadRes.data?.message).toBe('Model unloaded');

    fetchSpy.mockRestore();
  });

  it('should send chat request and parse grounded source references', async () => {
    const mockSources: SourceReference[] = [
      {
        filePath: 'D:/hackathon/snap/demo-project/src/auth/auth-service.ts',
        relativePath: 'src/auth/auth-service.ts',
        startLine: 12,
        endLine: 45,
        symbolName: 'login',
        snippet: 'export async function login() {}'
      }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/api/ai/chat')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            messageId: 'msg-reply-123',
            role: 'assistant',
            content: 'Authentication is handled in AuthService.login().',
            sources: mockSources,
            modelName: 'snapdev-local-code-q4',
            generationTimeMs: 145,
            promptTokens: 280,
            completionTokens: 35,
            tokensPerSecond: 85.5,
            ragChunksUsed: 2
          })
        } as any;
      }
      return { ok: true, status: 200, json: async () => ({}) } as any;
    });

    const client = new BackendApiClient('http://127.0.0.1:8765');
    const resp = await client.sendChatMessage({
      projectId: 'demo-snapdev',
      query: 'Where is authentication handled?'
    });

    expect(resp.success).toBe(true);
    expect(resp.data?.role).toBe('assistant');
    expect(resp.data?.content).toContain('AuthService.login()');
    expect(resp.data?.sources).toHaveLength(1);
    expect(resp.data?.sources[0].relativePath).toBe('src/auth/auth-service.ts');
    expect(resp.data?.sources[0].startLine).toBe(12);

    fetchSpy.mockRestore();
  });

  it('should support stopGeneration cancellation', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/api/ai/stop')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: 'Generation stopped' })
        } as any;
      }
      return { ok: true, status: 200, json: async () => ({}) } as any;
    });

    const client = new BackendApiClient('http://127.0.0.1:8765');
    const stopRes = await client.stopGeneration();
    expect(stopRes.success).toBe(true);

    fetchSpy.mockRestore();
  });
});
