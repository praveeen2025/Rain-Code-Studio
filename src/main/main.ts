/**
 * SnapDev AI - Main Electron Entry Point
 * Orchestrates Electron desktop lifecycle, SQLite engine, file watchers, and Python backend.
 */

import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window';
import { ProcessManager } from './process-manager';
import { registerIpcHandlers } from './ipc';
import { sqliteManager } from './database/sqlite-manager';
import { projectWatcher } from './indexer/project-watcher';
import { DEFAULT_BACKEND_HOST, DEFAULT_BACKEND_PORT } from '../shared/constants';
import { performanceMonitor } from './system/performance-monitor';

const appLaunchT0 = Date.now();
let mainWindow: BrowserWindow | null = null;
const processManager = new ProcessManager(DEFAULT_BACKEND_HOST, DEFAULT_BACKEND_PORT);

async function initializeApp(): Promise<void> {
  console.log('[Main] Initializing Rain Code Studio Desktop Application...');

  // Initialize SQLite database
  try {
    await sqliteManager.initialize();
  } catch (err) {
    console.error('[Main] Failed to initialize SQLite database:', err);
  }

  // Register secure IPC channels
  registerIpcHandlers(processManager, () => mainWindow);

  // Create UI Window first so user sees "Starting..." immediately
  mainWindow = createMainWindow();

  // Record initial Electron UI readiness time
  performanceMonitor.recordStartupTime(Date.now() - appLaunchT0);

  // Start local Python FastAPI backend
  try {
    console.log('[Main] Starting local Python backend...');
    const backendReady = await processManager.start();
    if (!backendReady) {
      console.warn('[Main] Backend did not report ready status immediately, UI will poll status.');
    }
  } catch (err) {
    console.error('[Main] Failed to start backend on launch:', err);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(initializeApp).catch(console.error);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

// Graceful cleanup of Python subprocess, database, and watchers
let isCleaningUp = false;
async function cleanUpAndExit(): Promise<void> {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('[Main] Application exiting, cleaning up resources...');

  try {
    projectWatcher.stopWatching();
  } catch (err) {
    console.warn('[Main] Error stopping project watcher:', err);
  }

  try {
    sqliteManager.close();
  } catch (err) {
    console.warn('[Main] Error closing SQLite database:', err);
  }

  try {
    await processManager.stop();
  } catch (err) {
    console.error('[Main] Error stopping backend during exit:', err);
  }
}

app.on('before-quit', (e) => {
  if (!isCleaningUp) {
    e.preventDefault();
    cleanUpAndExit().finally(() => {
      app.exit(0);
    });
  }
});

app.on('will-quit', () => {
  cleanUpAndExit();
});
