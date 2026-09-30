/**
 * SnapDev AI - Global Keyboard Shortcuts Hook
 * Phase 9: Ergonomic desktop shortcuts for developer workflows.
 */

import { useEffect } from 'react';
import { NavigationPage } from '../../shared/types';

interface KeyboardShortcutsOptions {
  onToggleCommandPalette: (mode?: 'commands' | 'files') => void;
  onToggleRightPanel: () => void;
  onToggleSidebar?: () => void;
  onSelectPage: (page: NavigationPage) => void;
}

export function useKeyboardShortcuts({
  onToggleCommandPalette,
  onToggleRightPanel,
  onToggleSidebar,
  onSelectPage
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ignore if user is typing in a textarea or input (unless it's a global trigger like Ctrl+P or Ctrl+Shift+P)
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Ctrl + Shift + P -> Command Palette (Commands)
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        onToggleCommandPalette('commands');
        return;
      }

      // Ctrl + P -> Quick File Search
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        onToggleCommandPalette('files');
        return;
      }

      // F1 -> Command Palette
      if (e.key === 'F1') {
        e.preventDefault();
        onToggleCommandPalette('commands');
        return;
      }

      // Ctrl + J -> Toggle Right Context Panel
      if (isCtrlOrCmd && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        onToggleRightPanel();
        return;
      }

      // Ctrl + B -> Toggle Sidebar
      if (isCtrlOrCmd && (e.key === 'B' || e.key === 'b') && onToggleSidebar) {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // Ctrl + , -> Settings
      if (isCtrlOrCmd && e.key === ',') {
        e.preventDefault();
        onSelectPage('settings');
        return;
      }

      // Navigation shortcuts (Ctrl + 1..9) only when not typing inside an input/textarea
      if (isCtrlOrCmd && !isTyping && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            onSelectPage('projects');
            break;
          case '2':
            e.preventDefault();
            onSelectPage('files');
            break;
          case '3':
            e.preventDefault();
            onSelectPage('chat');
            break;
          case '4':
            e.preventDefault();
            onSelectPage('analysis');
            break;
          case '5':
            e.preventDefault();
            onSelectPage('bugs');
            break;
          case '6':
            e.preventDefault();
            onSelectPage('tests');
            break;
          case '7':
            e.preventDefault();
            onSelectPage('docs');
            break;
          case '8':
            e.preventDefault();
            onSelectPage('git');
            break;
          case '9':
            e.preventDefault();
            onSelectPage('performance');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCommandPalette, onToggleRightPanel, onToggleSidebar, onSelectPage]);
}
