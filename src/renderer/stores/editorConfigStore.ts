/**
 * Rain Code Studio - Editor Configuration Store
 * Persistent settings for code editor: Auto Save, Minimap, Font Size, Word Wrap, Tab Size, Line Numbers.
 */

export interface EditorConfig {
  autoSave: boolean;
  autoSaveDelay: number; // ms, e.g. 1000
  minimap: boolean;
  wordWrap: boolean;
  fontSize: number; // e.g. 13
  tabSize: number; // 2 or 4
  lineNumbers: boolean;
}

const STORAGE_KEY = 'rain_code_editor_config';

const DEFAULT_CONFIG: EditorConfig = {
  autoSave: true,
  autoSaveDelay: 1000,
  minimap: true,
  wordWrap: false,
  fontSize: 13,
  tabSize: 2,
  lineNumbers: true
};

class EditorConfigStore {
  private config: EditorConfig;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EditorConfig {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_CONFIG };
  }

  public getConfig(): EditorConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<EditorConfig>) {
    this.config = { ...this.config, ...updates };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  public toggleAutoSave(): boolean {
    const next = !this.config.autoSave;
    this.updateConfig({ autoSave: next });
    return next;
  }

  public toggleMinimap(): boolean {
    const next = !this.config.minimap;
    this.updateConfig({ minimap: next });
    return next;
  }

  public toggleWordWrap(): boolean {
    const next = !this.config.wordWrap;
    this.updateConfig({ wordWrap: next });
    return next;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[EditorConfigStore] Listener error:', err);
      }
    });
  }
}

export const editorConfigStore = new EditorConfigStore();
