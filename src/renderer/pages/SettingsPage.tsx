/**
 * SnapDev AI - Settings & Developer Diagnostics Page
 * Phase 9: Unified configuration for Appearance, Local AI, Privacy, Keyboard Shortcuts, and System Diagnostics.
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Server,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Terminal,
  Save,
  Check,
  SunMoon,
  Copy,
  Keyboard,
  HelpCircle
} from 'lucide-react';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { useChat } from '../hooks/useChat';
import { AppSettings, HardwareInfo } from '../../shared/types';
import {
  DEFAULT_BACKEND_HOST,
  DEFAULT_BACKEND_PORT,
  APP_VERSION,
  APP_PHASE
} from '../../shared/constants';
import { notificationStore } from '../stores/notificationStore';
import { themeStore } from '../stores/themeStore';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'ai'
  | 'privacy'
  | 'shortcuts'
  | 'diagnostics';

export const SettingsPage: React.FC = () => {
  const { status, restartBackend } = useBackendHealth();
  const {
    modelStatus,
    modelInfo,
    settings: genSettings,
    updateSettings,
    loadLocalModel,
    unloadLocalModel,
    sendMessage
  } = useChat();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<AppSettings>({
    backendHost: DEFAULT_BACKEND_HOST,
    backendPort: DEFAULT_BACKEND_PORT,
    theme: themeStore.getTheme(),
    autoStartBackend: true,
    telemetryEnabled: false,
    logLevel: 'info'
  });
  const [systemInfo, setSystemInfo] = useState<{
    platform: string;
    arch: string;
    isSnapdragon: boolean;
    appVersion: string;
    electronVersion: string;
    nodeVersion: string;
  } | null>(null);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [modelActionMsg, setModelActionMsg] = useState<string | null>(null);
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppSettings().then(setSettings).catch(console.error);
      window.electronAPI.getSystemInfo().then(setSystemInfo).catch(console.error);
      window.electronAPI.getHardwareInfo().then(setHardwareInfo).catch(console.error);
    }
  }, []);

  const handleSave = async () => {
    if (window.electronAPI) {
      await window.electronAPI.updateAppSettings(settings);
      setSavedSuccess(true);
      notificationStore.success('Settings saved', 'Configuration updated successfully');
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    const updated = { ...settings, theme };
    setSettings(updated);
    themeStore.setTheme(theme);
    if (window.electronAPI) {
      window.electronAPI.updateAppSettings(updated).catch(console.error);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    await restartBackend();
    notificationStore.info('Backend restart requested', 'Reconnecting to local service...');
    setTimeout(() => setIsRestarting(false), 2000);
  };

  const handleLoadModel = async () => {
    setModelActionMsg('Loading model into local memory...');
    const ok = await loadLocalModel();
    if (ok) {
      notificationStore.success('AI Model Loaded', 'Model is ready for inference');
      setModelActionMsg('Model loaded successfully!');
    } else {
      notificationStore.error('Model Load Failed', 'Could not load local model');
      setModelActionMsg('Failed to load model.');
    }
    setTimeout(() => setModelActionMsg(null), 3500);
  };

  const handleUnloadModel = async () => {
    setModelActionMsg('Unloading model from local memory...');
    const ok = await unloadLocalModel();
    if (ok) {
      notificationStore.info('AI Model Unloaded', 'Memory released');
      setModelActionMsg('Model unloaded successfully!');
    } else {
      notificationStore.error('Unload Failed', 'Could not unload model');
      setModelActionMsg('Failed to unload model.');
    }
    setTimeout(() => setModelActionMsg(null), 3500);
  };

  const handleTestModel = async () => {
    setIsTestingModel(true);
    setModelActionMsg('Running test inference on-device...');
    try {
      await sendMessage('Describe the purpose of this project.');
      notificationStore.success('Inference Test Passed', 'Local AI generated response');
      setModelActionMsg('Test inference completed successfully!');
    } catch (err) {
      notificationStore.error('Inference Test Failed', String(err));
      setModelActionMsg('Test inference failed.');
    } finally {
      setIsTestingModel(false);
      setTimeout(() => setModelActionMsg(null), 4000);
    }
  };

  const handleCopyDiagnostics = () => {
    const diagnostics = {
      application: {
        name: 'Rain Code Studio',
        version: APP_VERSION,
        phase: APP_PHASE
      },
      system: systemInfo,
      hardware: hardwareInfo,
      backend: {
        status,
        host: settings.backendHost,
        port: settings.backendPort
      },
      aiModel: {
        status: modelStatus,
        info: modelInfo
      },
      timestamp: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    setCopiedDiagnostics(true);
    notificationStore.success('Diagnostics copied', 'System report copied to clipboard');
    setTimeout(() => setCopiedDiagnostics(false), 2000);
  };

  const handleRestartTour = () => {
    localStorage.removeItem('snapdev_onboarding_completed');
    notificationStore.info('Welcome Tour Reset', 'Reload or open workspace to view onboarding walkthrough');
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-ide-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ide-surface border border-ide-border flex items-center justify-center text-snap-crimson shadow-sm">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Application Settings</h1>
            <p className="text-xs text-ide-muted">
              Configure local runtime parameters, appearance, privacy, and system diagnostics
            </p>
          </div>
        </div>

        <Button
          variant="snap"
          size="sm"
          icon={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          onClick={handleSave}
        >
          {savedSuccess ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-ide-border mb-6">
        {[
          { id: 'general', label: 'General', icon: Sliders },
          { id: 'appearance', label: 'Appearance', icon: SunMoon },
          { id: 'ai', label: 'Local AI & Model', icon: Cpu },
          { id: 'privacy', label: 'Privacy & Architecture', icon: ShieldCheck },
          { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
          { id: 'diagnostics', label: 'Diagnostics', icon: Terminal }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-3.5 py-2 border-b-2 text-xs font-medium transition-all ${
                isActive
                  ? 'border-snap-crimson text-white font-semibold'
                  : 'border-transparent text-ide-muted hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="space-y-5 text-xs">
          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-4">
            <div className="flex items-center justify-between border-b border-ide-border pb-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Server className="w-4 h-4 text-snap-blue" />
                <span>Local Backend Process</span>
              </div>
              <Badge variant={status === 'connected' ? 'success' : 'error'} dot={true}>
                {status === 'connected' ? 'Running' : status === 'starting' ? 'Starting...' : 'Stopped'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-ide-muted mb-1 font-medium">Backend Host</label>
                <input
                  type="text"
                  value={settings.backendHost}
                  onChange={(e) => setSettings({ ...settings, backendHost: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-ide-bg border border-ide-border text-white font-mono text-xs focus:outline-none focus:border-snap-blue"
                />
              </div>
              <div>
                <label className="block text-ide-muted mb-1 font-medium">Backend Port</label>
                <input
                  type="number"
                  value={settings.backendPort}
                  onChange={(e) => setSettings({ ...settings, backendPort: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-ide-bg border border-ide-border text-white font-mono text-xs focus:outline-none focus:border-snap-blue"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStartBackend}
                  onChange={(e) => setSettings({ ...settings, autoStartBackend: e.target.checked })}
                  className="rounded border-ide-border text-snap-crimson focus:ring-0 bg-ide-bg"
                />
                <span className="text-white">Auto-start Python backend process on application launch</span>
              </label>

              <Button
                variant="secondary"
                size="xs"
                icon={<RefreshCw className={`w-3 h-3 ${isRestarting ? 'animate-spin' : ''}`} />}
                onClick={handleRestart}
                disabled={isRestarting}
              >
                Restart Backend
              </Button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-3">
            <h3 className="font-semibold text-white">Onboarding & Help</h3>
            <p className="text-ide-muted leading-relaxed text-xs">
              Need a refresher on navigating workspaces or configuring local AI models?
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<HelpCircle className="w-3.5 h-3.5" />}
              onClick={handleRestartTour}
            >
              Reset Welcome Tour
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-5 text-xs">
          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-4">
            <h3 className="font-semibold text-white">Application Theme</h3>
            <p className="text-ide-muted text-xs leading-relaxed">
              Rain Code Studio is optimized for high-contrast dark environments with vibrant syntax highlighting.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { id: 'dark', title: 'Dark Mode (Recommended)', desc: 'IDE default with Snapdragon red accents' },
                { id: 'light', title: 'Light Mode', desc: 'Clean high-contrast daytime interface' },
                { id: 'system', title: 'System Synchronized', desc: 'Matches Windows OS appearance preference' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as 'dark' | 'light' | 'system')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    settings.theme === t.id
                      ? 'border-snap-crimson bg-snap-crimson/10 text-white'
                      : 'border-ide-border bg-ide-sidebar/50 text-ide-muted hover:text-white hover:bg-ide-hover'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{t.title}</div>
                  <div className="text-[11px] text-ide-muted mt-1 leading-snug">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Local AI & Model */}
      {activeTab === 'ai' && (
        <div className="space-y-5 text-xs">
          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-4">
            <div className="flex items-center justify-between border-b border-ide-border pb-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Local AI Model Architecture</span>
              </div>
              <Badge variant={modelStatus === 'ready' ? 'success' : 'neutral'} dot={true}>
                {modelStatus}
              </Badge>
            </div>

            {modelActionMsg && (
              <div className="p-2.5 rounded-lg bg-ide-bg border border-ide-border text-xs text-white font-mono flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>{modelActionMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Model Name</div>
                <div className="text-white font-semibold mt-0.5 truncate">{modelInfo?.modelName || 'Qwen2.5-Coder-1.5B'}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Device</div>
                <div className="text-purple-300 font-semibold mt-0.5 uppercase">{modelInfo?.device || 'cpu'}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Temperature</div>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="1.0"
                  value={genSettings.temperature ?? 0.2}
                  onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) || 0.2 })}
                  className="w-full bg-transparent text-white font-semibold mt-0.5 outline-none"
                />
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Max Tokens</div>
                <input
                  type="number"
                  step="64"
                  min="128"
                  max="4096"
                  value={genSettings.maxTokens ?? 1024}
                  onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) || 1024 })}
                  className="w-full bg-transparent text-white font-semibold mt-0.5 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ide-border">
              <Button
                variant="secondary"
                size="sm"
                icon={<Cpu className="w-3.5 h-3.5 text-emerald-400" />}
                onClick={handleLoadModel}
                disabled={modelStatus === 'loading' || modelStatus === 'generating'}
              >
                Load Model
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUnloadModel}
                disabled={modelStatus === 'unloading' || modelStatus === 'loading'}
              >
                Unload Model
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isTestingModel ? 'animate-spin' : ''}`} />}
                onClick={handleTestModel}
                disabled={isTestingModel || modelStatus !== 'ready'}
              >
                Test Inference
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & Architecture */}
      {activeTab === 'privacy' && (
        <div className="space-y-5 text-xs">
          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-4">
            <div className="flex items-center gap-2 font-semibold text-white border-b border-ide-border pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">100% Privacy-First Architecture Guarantee</span>
            </div>

            <div className="space-y-3 leading-relaxed text-ide-muted">
              <p>
                Rain Code Studio is built with an absolute privacy invariant: <strong className="text-white">your source code, AST graphs, diffs, and local embeddings never leave your physical workstation</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-ide-bg rounded-lg border border-ide-border space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>No Cloud Code Transmission</span>
                  </div>
                  <p className="text-[11px] text-ide-muted">
                    No remote telemetry, tracking pixels, or third-party analytical SDKs are embedded.
                  </p>
                </div>
                <div className="p-3 bg-ide-bg rounded-lg border border-ide-border space-y-1">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Local Vector Database</span>
                  </div>
                  <p className="text-[11px] text-ide-muted">
                    Embeddings and indexing SQLite metadata remain confined to your local hard drive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Keyboard Shortcuts Reference */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-3">
            <h3 className="font-semibold text-white">Keyboard Shortcuts Cheat Sheet</h3>
            <p className="text-ide-muted leading-relaxed">
              Designed for rapid IDE navigation and hands-on-the-keyboard efficiency.
            </p>

            <div className="divide-y divide-ide-border font-mono text-[11px] pt-2">
              {[
                { key: 'Ctrl + Shift + P', desc: 'Open Command Palette' },
                { key: 'Ctrl + P', desc: 'Quick File Search (File Finder)' },
                { key: 'Ctrl + J', desc: 'Toggle Right Context Panel' },
                { key: 'Ctrl + B', desc: 'Toggle Left Sidebar Navigation' },
                { key: 'Ctrl + ,', desc: 'Open Settings' },
                { key: 'Ctrl + 1', desc: 'Jump to Projects Workspace' },
                { key: 'Ctrl + 2', desc: 'Jump to Project Explorer (Files)' },
                { key: 'Ctrl + 3', desc: 'Jump to AI Developer Workspace' },
                { key: 'Ctrl + 4', desc: 'Jump to Code Analysis' },
                { key: 'Ctrl + 5', desc: 'Jump to Bug Finder' },
                { key: 'Ctrl + 6', desc: 'Jump to Test Generator' },
                { key: 'Ctrl + 7', desc: 'Jump to Documentation Generator' },
                { key: 'Ctrl + 8', desc: 'Jump to Git & Developer Tools' },
                { key: 'Ctrl + 9', desc: 'Jump to Performance Dashboard' },
                { key: 'Escape', desc: 'Close modals, drawers, and command palette' }
              ].map((s) => (
                <div key={s.key} className="flex justify-between items-center py-2">
                  <span className="text-ide-text">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-ide-bg border border-ide-border text-white text-[10px]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-5 text-xs">
          <div className="p-5 rounded-xl bg-ide-surface border border-ide-border space-y-4">
            <div className="flex items-center justify-between border-b border-ide-border pb-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Developer Diagnostics & Environment Report</span>
              </div>
              <Button
                variant="outline"
                size="xs"
                icon={copiedDiagnostics ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                onClick={handleCopyDiagnostics}
              >
                {copiedDiagnostics ? 'Copied' : 'Copy Report JSON'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">App Version</div>
                <div className="text-white font-semibold mt-0.5">{APP_VERSION}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Phase Tag</div>
                <div className="text-white font-semibold mt-0.5 truncate">{APP_PHASE}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Platform OS</div>
                <div className="text-white font-semibold mt-0.5 uppercase">{systemInfo?.platform || 'Windows'}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Architecture</div>
                <div className="text-white font-semibold mt-0.5 uppercase">{hardwareInfo?.architecture || 'x64'}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Snapdragon Status</div>
                <div className="text-emerald-400 font-semibold mt-0.5">{hardwareInfo?.snapdragonDetected || 'Unknown'}</div>
              </div>
              <div className="p-2.5 rounded bg-ide-bg border border-ide-border">
                <div className="text-[10px] text-ide-muted uppercase">Backend Status</div>
                <div className="text-white font-semibold mt-0.5">{status === 'connected' ? 'Active (Port 8765)' : status}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
