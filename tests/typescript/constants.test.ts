/**
 * Unit tests for shared constants and navigation config
 */

import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  APP_PHASE,
  DEFAULT_BACKEND_PORT,
  NAVIGATION_ITEMS,
  IPC_CHANNELS
} from '../../src/shared/constants';

describe('Shared Constants', () => {
  it('should have correct application branding and phase tag', () => {
    expect(APP_NAME).toBe('Rain Code Studio');
    expect(APP_PHASE).toMatch(/Phase (9|10)/);
    expect(DEFAULT_BACKEND_PORT).toBe(8765);
  });

  it('should contain all required navigation items including intelligence', () => {
    expect(NAVIGATION_ITEMS.length).toBeGreaterThanOrEqual(10);
    const ids = NAVIGATION_ITEMS.map((item) => item.id);
    expect(ids).toContain('projects');
    expect(ids).toContain('files');
    expect(ids).toContain('chat');
    expect(ids).toContain('analysis');
    expect(ids).toContain('bugs');
    expect(ids).toContain('tests');
    expect(ids).toContain('docs');
    expect(ids).toContain('git');
    expect(ids).toContain('performance');
    expect(ids).toContain('settings');

    const perfItem = NAVIGATION_ITEMS.find((item) => item.id === 'performance');
    expect(perfItem?.phase).toBe('Phase 8 (Active)');
  });

  it('should define required IPC channels', () => {
    expect(IPC_CHANNELS.GET_BACKEND_STATUS).toBe('backend:get-status');
    expect(IPC_CHANNELS.RESTART_BACKEND).toBe('backend:restart');
    expect(IPC_CHANNELS.SELECT_PROJECT_DIR).toBe('project:select-dir');
    expect(IPC_CHANNELS.LOAD_PROJECT).toBe('project:load');
    expect(IPC_CHANNELS.LOAD_DEMO_PROJECT).toBe('project:load-demo');
    expect(IPC_CHANNELS.AI_GET_STATUS).toBe('ai:get-status');
    expect(IPC_CHANNELS.AI_CHAT).toBe('ai:chat');
    expect(IPC_CHANNELS.AI_STOP).toBe('ai:stop');
    expect(IPC_CHANNELS.PATCH_APPLY).toBe('patch:apply');
    expect(IPC_CHANNELS.PATCH_PREVIEW).toBe('patch:preview');
    expect(IPC_CHANNELS.TASK_HISTORY_GET).toBe('task-history:get');
    expect(IPC_CHANNELS.SYSTEM_GET_HARDWARE_INFO).toBe('system:get-hardware-info');
    expect(IPC_CHANNELS.SYSTEM_GET_PERFORMANCE_METRICS).toBe('system:get-performance-metrics');
  });
});
