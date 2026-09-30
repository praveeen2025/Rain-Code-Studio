/**
 * Rain Code Studio - Sidebar Settings Panel
 * VS Code-style quick configuration panel for theme, editor font, indentation, and telemetry.
 */

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { themeStore } from '../stores/themeStore';
import { notificationStore } from '../stores/notificationStore';

interface SidebarSettingsProps {
  onNavigateSettingsPage: () => void;
}

export const SidebarSettings: React.FC<SidebarSettingsProps> = ({
  onNavigateSettingsPage
}) => {
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(
    themeStore.getTheme()
  );
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('snapdev_editor_font_size') || '13', 10);
  });
  const [tabSize, setTabSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('snapdev_tab_size') || '2', 10);
  });
  const [wordWrap, setWordWrap] = useState<boolean>(() => {
    return localStorage.getItem('snapdev_word_wrap') === 'true';
  });

  useEffect(() => {
    return themeStore.subscribe(() => {
      setThemeMode(themeStore.getTheme());
    });
  }, []);

  const handleSelectTheme = (mode: 'dark' | 'light' | 'system') => {
    themeStore.setTheme(mode);
    notificationStore.info(
      'Theme Changed',
      `Applied ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`
    );
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('snapdev_editor_font_size', size.toString());
    notificationStore.info('Editor Font Size', `${size}px`);
  };

  const handleTabSizeChange = (tabs: number) => {
    setTabSize(tabs);
    localStorage.setItem('snapdev_tab_size', tabs.toString());
    notificationStore.info('Indentation', `${tabs} Spaces`);
  };

  const handleToggleWordWrap = () => {
    const next = !wordWrap;
    setWordWrap(next);
    localStorage.setItem('snapdev_word_wrap', next ? 'true' : 'false');
    notificationStore.info('Word Wrap', next ? 'Enabled' : 'Disabled');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs bg-ide-sidebar select-none">
      {/* Header */}
      <div className="p-3 border-b border-ide-border space-y-1 bg-ide-sidebar">
        <span className="text-[11px] font-bold text-ide-text-bright uppercase tracking-wider block">
          Settings & Preferences
        </span>
        <p className="text-[11px] text-ide-muted">Customize editor, themes, and workspace</p>
      </div>

      {/* Settings Form Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Section 1: Color Theme */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider block">
            Color Theme
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleSelectTheme('dark')}
              className={`p-2 rounded border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                themeMode === 'dark'
                  ? 'border-ide-accent bg-ide-accent/15 text-ide-text-bright font-semibold'
                  : 'border-ide-border bg-ide-surface hover:bg-ide-hover text-ide-text'
              }`}
            >
              <Moon className="w-4 h-4 text-sky-400" />
              <span className="text-[11px]">Dark</span>
              {themeMode === 'dark' && <Check className="w-3 h-3 text-ide-accent" />}
            </button>

            <button
              onClick={() => handleSelectTheme('light')}
              className={`p-2 rounded border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                themeMode === 'light'
                  ? 'border-ide-accent bg-ide-accent/15 text-ide-text-bright font-semibold'
                  : 'border-ide-border bg-ide-surface hover:bg-ide-hover text-ide-text'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-[11px]">Light</span>
              {themeMode === 'light' && <Check className="w-3 h-3 text-ide-accent" />}
            </button>

            <button
              onClick={() => handleSelectTheme('system')}
              className={`p-2 rounded border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                themeMode === 'system'
                  ? 'border-ide-accent bg-ide-accent/15 text-ide-text-bright font-semibold'
                  : 'border-ide-border bg-ide-surface hover:bg-ide-hover text-ide-text'
              }`}
            >
              <Laptop className="w-4 h-4 text-purple-400" />
              <span className="text-[11px]">Auto</span>
              {themeMode === 'system' && <Check className="w-3 h-3 text-ide-accent" />}
            </button>
          </div>
        </div>

        {/* Section 2: Editor Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider">
              Font Size
            </span>
            <span className="font-mono text-[11px] text-ide-muted">{fontSize}px</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[12, 13, 14, 16].map((sz) => (
              <button
                key={sz}
                onClick={() => handleFontSizeChange(sz)}
                className={`py-1 rounded border text-center font-mono text-xs transition cursor-pointer ${
                  fontSize === sz
                    ? 'border-ide-accent bg-ide-accent/15 text-ide-text-bright font-bold'
                    : 'border-ide-border bg-ide-surface hover:bg-ide-hover text-ide-text'
                }`}
              >
                {sz}px
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Tab Indentation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider">
              Tab Size
            </span>
            <span className="font-mono text-[11px] text-ide-muted">{tabSize} spaces</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[2, 4].map((sz) => (
              <button
                key={sz}
                onClick={() => handleTabSizeChange(sz)}
                className={`py-1.5 rounded border text-center font-mono text-xs transition cursor-pointer ${
                  tabSize === sz
                    ? 'border-ide-accent bg-ide-accent/15 text-ide-text-bright font-bold'
                    : 'border-ide-border bg-ide-surface hover:bg-ide-hover text-ide-text'
                }`}
              >
                {sz} Spaces
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Word Wrap Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded border border-ide-border bg-ide-surface">
          <div>
            <span className="font-medium text-ide-text-bright block text-xs">Word Wrap</span>
            <span className="text-[10px] text-ide-muted">Wrap long lines to editor width</span>
          </div>
          <button
            onClick={handleToggleWordWrap}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
              wordWrap ? 'bg-ide-accent' : 'bg-ide-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                wordWrap ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Section 5: Privacy Invariant */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% On-Device Privacy</span>
          </div>
          <p className="text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-300">
            Zero telemetry. No external model egress. All parsing, AI inference, and Git operations stay on this computer.
          </p>
        </div>

        {/* Full Settings Page Link */}
        <div className="pt-2">
          <button
            onClick={onNavigateSettingsPage}
            className="w-full py-2 px-3 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-ide-text hover:text-ide-text-bright font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Open Advanced Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
