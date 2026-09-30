/**
 * Unit tests for BackendApiClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackendApiClient } from '../../src/renderer/services/api';

describe('BackendApiClient', () => {
  let client: BackendApiClient;

  beforeEach(() => {
    client = new BackendApiClient('http://127.0.0.1:8765');
    vi.restoreAllMocks();
  });

  it('should initialize with provided base URL and strip trailing slashes', () => {
    client.setBaseUrl('http://localhost:9000/');
    expect(client.getBaseUrl()).toBe('http://localhost:9000');
  });

  it('should handle successful health check', async () => {
    const mockHealth = { status: 'ok', service: 'snapdev-ai-backend' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockHealth
    } as unknown as Response);

    const result = await client.checkBackendHealth();
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('ok');
    expect(result.data?.service).toBe('snapdev-ai-backend');
  });

  it('should handle backend HTTP failure gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable'
    } as unknown as Response);

    const result = await client.checkBackendHealth();
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.error).toContain('503');
  });

  it('should handle network timeout/rejection without crashing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await client.checkBackendHealth();
    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
  });
});
