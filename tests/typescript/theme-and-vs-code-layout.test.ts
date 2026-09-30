/**
 * Rain Code Studio - Dark/Light Theme & Anti-Gravity VS Code Layout Tests
 * Validates theme switching, editor tabs management, and layout state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { themeStore } from '../../src/renderer/stores/themeStore';
import { editorTabsStore } from '../../src/renderer/stores/editorTabsStore';
import { ProjectFile } from '../../src/shared/types';

describe('Theme Store - Dark & Light Mode System', () => {
  beforeEach(() => {
    themeStore.setTheme('dark');
  });

  it('should initialize with dark or system theme', () => {
    const currentTheme = themeStore.getTheme();
    expect(['dark', 'light', 'system']).toContain(currentTheme);
  });

  it('should switch to light mode and toggle effective theme', () => {
    themeStore.setTheme('light');
    expect(themeStore.getTheme()).toBe('light');
    expect(themeStore.getEffectiveTheme()).toBe('light');
    expect(themeStore.isDark()).toBe(false);
  });

  it('should switch back to dark mode consistently', () => {
    themeStore.setTheme('light');
    expect(themeStore.isDark()).toBe(false);

    themeStore.setTheme('dark');
    expect(themeStore.getTheme()).toBe('dark');
    expect(themeStore.getEffectiveTheme()).toBe('dark');
    expect(themeStore.isDark()).toBe(true);
  });

  it('should toggle between dark and light seamlessly', () => {
    themeStore.setTheme('dark');
    expect(themeStore.getEffectiveTheme()).toBe('dark');

    themeStore.toggleTheme();
    expect(themeStore.getEffectiveTheme()).toBe('light');

    themeStore.toggleTheme();
    expect(themeStore.getEffectiveTheme()).toBe('dark');
  });

  it('should notify registered listeners when theme changes', () => {
    let notified = false;
    const unsubscribe = themeStore.subscribe(() => {
      notified = true;
    });

    themeStore.setTheme('light');
    expect(notified).toBe(true);

    unsubscribe();
  });
});

describe('VS Code Editor Tabs Store', () => {
  const dummyFile1: ProjectFile = {
    name: 'MainLayout.tsx',
    path: '/src/renderer/layouts/MainLayout.tsx',
    relativePath: 'src/renderer/layouts/MainLayout.tsx',
    isDirectory: false,
    size: 2048,
    extension: '.tsx'
  };

  const dummyFile2: ProjectFile = {
    name: 'StatusBar.tsx',
    path: '/src/renderer/components/StatusBar.tsx',
    relativePath: 'src/renderer/components/StatusBar.tsx',
    isDirectory: false,
    size: 1024,
    extension: '.tsx'
  };

  beforeEach(() => {
    editorTabsStore.closeAllTabs();
  });

  it('should open new file tabs with active state', () => {
    editorTabsStore.openFileTab(dummyFile1);

    const tabs = editorTabsStore.getTabs();
    expect(tabs.length).toBe(1);
    expect(tabs[0].title).toBe('MainLayout.tsx');
    expect(tabs[0].path).toBe(dummyFile1.path);
    expect(editorTabsStore.getActiveTabId()).toBe(tabs[0].id);
  });

  it('should switch active tab when opening a second file', () => {
    editorTabsStore.openFileTab(dummyFile1);
    editorTabsStore.openFileTab(dummyFile2);

    const tabs = editorTabsStore.getTabs();
    expect(tabs.length).toBe(2);
    expect(tabs[1].title).toBe('StatusBar.tsx');
    expect(editorTabsStore.getActiveTabId()).toBe(tabs[1].id);
  });

  it('should not duplicate tabs when opening an already open file', () => {
    editorTabsStore.openFileTab(dummyFile1);
    editorTabsStore.openFileTab(dummyFile2);
    editorTabsStore.openFileTab(dummyFile1);

    const tabs = editorTabsStore.getTabs();
    expect(tabs.length).toBe(2);
    expect(editorTabsStore.getActiveTabId()).toBe(tabs[0].id);
  });

  it('should close specific tab and update active tab', () => {
    editorTabsStore.openFileTab(dummyFile1);
    editorTabsStore.openFileTab(dummyFile2);

    const tab1Id = editorTabsStore.getTabs()[0].id;
    const tab2Id = editorTabsStore.getTabs()[1].id;

    // Active tab is tab 2
    expect(editorTabsStore.getActiveTabId()).toBe(tab2Id);

    // Close tab 2
    editorTabsStore.closeTab(tab2Id);
    expect(editorTabsStore.getTabs().length).toBe(1);
    expect(editorTabsStore.getActiveTabId()).toBe(tab1Id);
  });

  it('should track dirty state and buffer content correctly', () => {
    editorTabsStore.openFileTab(dummyFile1);
    const tab1Id = editorTabsStore.getTabs()[0].id;

    expect(editorTabsStore.getTabs()[0].isDirty).toBeFalsy();

    editorTabsStore.setTabBuffer(tab1Id, 'export const changed = true;');
    expect(editorTabsStore.getTabs()[0].isDirty).toBe(true);
    expect(editorTabsStore.getTabBuffer(tab1Id)).toBe('export const changed = true;');

    editorTabsStore.clearTabBuffer(tab1Id);
    expect(editorTabsStore.getTabs()[0].isDirty).toBe(false);
    expect(editorTabsStore.getTabBuffer(tab1Id)).toBeUndefined();
  });

  it('should update tab path and title when a file is renamed', () => {
    editorTabsStore.openFileTab(dummyFile1);
    const oldPath = dummyFile1.path;
    const newPath = '/src/renderer/layouts/MainLayoutRenamed.tsx';

    editorTabsStore.updateTabPath(oldPath, newPath, 'MainLayoutRenamed.tsx');

    const tab = editorTabsStore.getTabs()[0];
    expect(tab.title).toBe('MainLayoutRenamed.tsx');
    expect(tab.path).toBe(newPath);
    expect(tab.id).toBe(`file-${newPath}`);
  });

  it('should remove tab when file is deleted by path', () => {
    editorTabsStore.openFileTab(dummyFile1);
    expect(editorTabsStore.getTabs().length).toBe(1);

    editorTabsStore.removeTabByPath(dummyFile1.path);
    // When last tab is closed, welcome tab is restored
    expect(editorTabsStore.getTabs()[0].id).toBe('welcome');
  });
});
