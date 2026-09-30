/**
 * SnapDev AI - Window Manager
 * Creates and configures the main desktop BrowserWindow with secure defaults.
 */

import { BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';

export function createMainWindow(): BrowserWindow {
  const mjsPreload = path.join(__dirname, '../preload/index.mjs');
  const jsPreload = path.join(__dirname, '../preload/index.js');
  const preloadPath = fs.existsSync(mjsPreload) ? mjsPreload : jsPreload;

  const mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    title: 'Rain Code Studio — On-Device Copilot',
    backgroundColor: '#0a0d14',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in user's default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load dev server or production index.html
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}
