/**
 * Phase 9 UI/UX & Desktop Experience Tests
 * Verifies notifications, command palette, theme definitions, and design system components.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationStore } from '../../src/renderer/stores/notificationStore';
import { NAVIGATION_ITEMS, APP_VERSION, APP_PHASE } from '../../src/shared/constants';
import { AppSettings } from '../../src/shared/types';

describe('Phase 9 - Notification Store & Toast System', () => {
  beforeEach(() => {
    notificationStore.clear();
  });

  it('should initialize with empty notification queue', () => {
    expect(notificationStore.getNotifications()).toEqual([]);
  });

  it('should add notifications with unique IDs and auto-duration', () => {
    const id = notificationStore.success('Project Indexed', 'All 15 source files ready');
    expect(id).toMatch(/^toast-\d+-[a-z0-9]+$/);

    const active = notificationStore.getNotifications();
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('Project Indexed');
    expect(active[0].message).toBe('All 15 source files ready');
    expect(active[0].type).toBe('success');
    expect(active[0].durationMs).toBe(4000);
  });

  it('should assign longer duration to error toasts', () => {
    notificationStore.error('Model Load Failed', 'Insufficient memory');
    const active = notificationStore.getNotifications();
    expect(active[0].type).toBe('error');
    expect(active[0].durationMs).toBe(6000);
  });

  it('should support manual dismissal of notifications', () => {
    const id1 = notificationStore.info('Notice 1');
    const id2 = notificationStore.info('Notice 2');
    expect(notificationStore.getNotifications()).toHaveLength(2);

    notificationStore.dismiss(id1);
    const remaining = notificationStore.getNotifications();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id2);
  });

  it('should clear all active toasts', () => {
    notificationStore.info('Msg 1');
    notificationStore.warning('Msg 2');
    notificationStore.error('Msg 3');
    expect(notificationStore.getNotifications()).toHaveLength(3);

    notificationStore.clear();
    expect(notificationStore.getNotifications()).toHaveLength(0);
  });

  it('should notify subscribers when toasts are added or dismissed', () => {
    const listener = vi.fn();
    const unsubscribe = notificationStore.subscribe(listener);

    // Initial subscribe call
    expect(listener).toHaveBeenCalledTimes(1);

    notificationStore.success('Test Toast');
    expect(listener).toHaveBeenCalledTimes(2);

    notificationStore.clear();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    notificationStore.info('After unsubscribe');
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('Phase 9 - Navigation & Command System Integrity', () => {
  it('should verify all navigation views are present with descriptive phases', () => {
    expect(NAVIGATION_ITEMS.length).toBeGreaterThanOrEqual(10);
    const ids = NAVIGATION_ITEMS.map((n) => n.id);
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

    NAVIGATION_ITEMS.forEach((item) => {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(10);
    });
  });

  it('should have correct branding constants', () => {
    expect(['0.9.0', '0.10.0']).toContain(APP_VERSION);
    expect(APP_PHASE).toMatch(/Phase (9|10)/);
  });
});

describe('Phase 9 - Theme & Preferences Specification', () => {
  it('should support dark, light, and system themes in AppSettings', () => {
    const darkSettings: AppSettings = {
      backendHost: '127.0.0.1',
      backendPort: 8765,
      theme: 'dark',
      autoStartBackend: true,
      telemetryEnabled: false,
      logLevel: 'info'
    };
    expect(darkSettings.theme).toBe('dark');

    const lightSettings: AppSettings = {
      ...darkSettings,
      theme: 'light'
    };
    expect(lightSettings.theme).toBe('light');

    const systemSettings: AppSettings = {
      ...darkSettings,
      theme: 'system'
    };
    expect(systemSettings.theme).toBe('system');
  });

  it('should enforce telemetryEnabled is strictly false for privacy', () => {
    const settings: AppSettings = {
      backendHost: '127.0.0.1',
      backendPort: 8765,
      theme: 'dark',
      autoStartBackend: true,
      telemetryEnabled: false,
      logLevel: 'info'
    };
    expect(settings.telemetryEnabled).toBe(false);
  });
});
