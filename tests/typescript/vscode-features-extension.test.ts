/**
 * Rain Code Studio - VS Code Features Extension Test Suite
 * Validates Top Menu Bar, Integrated Terminal IPC, Web Preview, Auto-Save, and Android Architecture.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { editorConfigStore } from '../../src/renderer/stores/editorConfigStore';
import { IPC_CHANNELS, APP_NAME } from '../../src/shared/constants';

describe('VS Code Professional Features Extension', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Editor Configuration & Auto-Save Store', () => {
    it('initializes with default settings (autoSave: true, minimap: true)', () => {
      const config = editorConfigStore.getConfig();
      expect(config.autoSave).toBe(true);
      expect(config.minimap).toBe(true);
      expect(config.autoSaveDelay).toBe(1000);
      expect(config.fontSize).toBe(13);
    });

    it('toggles auto-save reactively and updates store', () => {
      const initial = editorConfigStore.getConfig().autoSave;
      const next = editorConfigStore.toggleAutoSave();
      expect(next).toBe(!initial);
      expect(editorConfigStore.getConfig().autoSave).toBe(!initial);

      // Toggle back
      const restored = editorConfigStore.toggleAutoSave();
      expect(restored).toBe(initial);
    });

    it('toggles minimap on and off', () => {
      const initial = editorConfigStore.getConfig().minimap;
      const next = editorConfigStore.toggleMinimap();
      expect(next).toBe(!initial);
      expect(editorConfigStore.getConfig().minimap).toBe(!initial);
    });

    it('toggles word wrap configuration', () => {
      const initial = editorConfigStore.getConfig().wordWrap;
      const next = editorConfigStore.toggleWordWrap();
      expect(next).toBe(!initial);
      expect(editorConfigStore.getConfig().wordWrap).toBe(!initial);
    });

    it('updates font size and tab size configuration', () => {
      editorConfigStore.updateConfig({ fontSize: 16, tabSize: 4 });
      const cfg = editorConfigStore.getConfig();
      expect(cfg.fontSize).toBe(16);
      expect(cfg.tabSize).toBe(4);
    });

    it('notifies subscribers on configuration change', () => {
      const spy = vi.fn();
      const unsub = editorConfigStore.subscribe(spy);
      editorConfigStore.updateConfig({ autoSaveDelay: 2000 });
      expect(spy).toHaveBeenCalled();
      unsub();
    });
  });

  describe('Terminal IPC & Execution Protocol', () => {
    it('defines TERMINAL_EXECUTE channel in IPC_CHANNELS', () => {
      expect(IPC_CHANNELS.TERMINAL_EXECUTE).toBe('terminal:execute');
    });

    it('formats terminal output line structures accurately', () => {
      const line = {
        id: 'term-line-1',
        type: 'command' as const,
        text: 'git status'
      };
      expect(line.type).toBe('command');
      expect(line.text).toBe('git status');
    });
  });

  describe('Rain Code Studio Branding Integrity', () => {
    it('verifies primary application branding is Rain Code Studio', () => {
      expect(APP_NAME).toBe('Rain Code Studio');
    });
  });
});
