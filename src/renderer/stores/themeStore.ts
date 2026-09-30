/**
 * Rain Code Studio - Theme Store
 * Manages Dark Mode & Light Mode with persistent storage, system sync, and instant UI updates.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

type Listener = () => void;

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light';
}

class ThemeStore {
  private state: ThemeState;
  private listeners: Set<Listener> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    let saved: ThemeMode = 'dark';
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        saved = (localStorage.getItem('rain_code_theme') as ThemeMode) || 'dark';
      }
    } catch {
      saved = 'dark';
    }

    const initialTheme: ThemeMode = ['dark', 'light', 'system'].includes(saved) ? saved : 'dark';
    const resolved = this.calculateResolvedTheme(initialTheme);

    this.state = {
      theme: initialTheme,
      resolvedTheme: resolved
    };

    if (typeof window !== 'undefined') {
      if (window.matchMedia) {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
      }
      this.applyToDOM(resolved);
    }
  }

  private calculateResolvedTheme(mode: ThemeMode): 'dark' | 'light' {
    if (mode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return mode;
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (this.state.theme === 'system') {
      const resolved = e.matches ? 'dark' : 'light';
      this.state.resolvedTheme = resolved;
      this.applyToDOM(resolved);
      this.notify();
    }
  };

  private applyToDOM(resolved: 'dark' | 'light') {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (resolved === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
  }

  public getTheme(): ThemeMode {
    return this.state.theme;
  }

  public getResolvedTheme(): 'dark' | 'light' {
    return this.state.resolvedTheme;
  }

  public getEffectiveTheme(): 'dark' | 'light' {
    return this.state.resolvedTheme;
  }

  public isDark(): boolean {
    return this.state.resolvedTheme === 'dark';
  }

  public setTheme(newTheme: ThemeMode) {
    const resolved = this.calculateResolvedTheme(newTheme);
    this.state = {
      theme: newTheme,
      resolvedTheme: resolved
    };

    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('rain_code_theme', newTheme);
      }
    } catch {
      // ignore in tests
    }

    this.applyToDOM(resolved);

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.updateAppSettings({ theme: newTheme }).catch(() => {});
    }

    this.notify();
  }

  public toggleTheme() {
    const next: 'dark' | 'light' = this.state.resolvedTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[ThemeStore] Listener error:', err);
      }
    });
  }
}

export const themeStore = new ThemeStore();
