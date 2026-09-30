/**
 * Rain Code Studio - Android / APK Packaging Architecture Modal
 * Comprehensive cross-platform architecture guide and export configuration.
 */

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  Layers
} from 'lucide-react';
import { notificationStore } from '../stores/notificationStore';

interface AndroidPackagingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidPackagingModal: React.FC<AndroidPackagingModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const buildSteps = [
    {
      step: 1,
      title: 'Compile Production Web Bundle',
      cmd: 'npm run build',
      desc: 'Builds optimized static assets in dist/renderer without desktop-only bindings.'
    },
    {
      step: 2,
      title: 'Initialize Capacitor Android Target',
      cmd: 'npx cap init "Rain Code Studio" com.raincodestudio.ide --web-dir dist/renderer',
      desc: 'Configures cross-platform Capacitor wrapper targeting Android SDK 33+.'
    },
    {
      step: 3,
      title: 'Add Android Platform & Gradle Workspace',
      cmd: 'npx cap add android',
      desc: 'Generates native Android Studio project with full hardware WebView bindings.'
    },
    {
      step: 4,
      title: 'Sync Web Assets to Native Android App',
      cmd: 'npx cap copy android && npx cap sync',
      desc: 'Packages React assets, icons, and fonts into android/app/src/main/assets.'
    },
    {
      step: 5,
      title: 'Build Release APK with Gradle',
      cmd: 'cd android && ./gradlew assembleRelease',
      desc: 'Generates standalone signed/unsigned APK in android/app/build/outputs/apk/release/.'
    }
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    notificationStore.success('Command Copied', text);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-ide-panel border border-ide-border rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ide-border flex items-center justify-between bg-ide-sidebar">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ide-text-bright flex items-center gap-2">
                <span>Android / APK Architecture & Export Guide</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Capacitor Ready
                </span>
              </h2>
              <p className="text-xs text-ide-muted mt-0.5">
                Clean cross-platform architecture without bloating desktop dependencies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ide-muted hover:text-ide-text hover:bg-ide-hover transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-ide-text">
          {/* Architecture Card */}
          <div className="p-4 rounded-lg bg-ide-surface border border-ide-border space-y-3">
            <div className="flex items-center gap-2 text-ide-text-bright font-semibold text-xs">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Decoupled Cross-Platform Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed text-ide-text">
              <strong>Rain Code Studio</strong> separates the core React frontend UI from host system runtimes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-ide-panel border border-ide-border/60">
                <span className="text-emerald-400 font-bold block mb-1">Desktop (Electron)</span>
                <span className="text-ide-muted text-[10px]">
                  Full Node.js child_process, native local filesystem, and local Python FastAPI backend.
                </span>
              </div>
              <div className="p-2.5 rounded bg-ide-panel border border-ide-border/60">
                <span className="text-sky-400 font-bold block mb-1">Android APK (WebView / Capacitor)</span>
                <span className="text-ide-muted text-[10px]">
                  Sandboxed Android WebView container, local IndexedDB / SQLite storage, optional ONNX Mobile inference.
                </span>
              </div>
            </div>
          </div>

          {/* Build Instructions */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-ide-text-bright uppercase tracking-wider block">
              Step-by-Step APK Generation Commands
            </span>

            <div className="space-y-2">
              {buildSteps.map((b) => (
                <div
                  key={b.step}
                  className="p-3 rounded-lg bg-ide-surface border border-ide-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ide-text-bright flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-ide-sidebar border border-ide-border flex items-center justify-center text-[10px] text-ide-accent font-bold">
                        {b.step}
                      </span>
                      <span>{b.title}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(b.cmd, b.step)}
                      className="px-2 py-0.5 rounded bg-ide-panel hover:bg-ide-hover border border-ide-border text-ide-muted hover:text-ide-text flex items-center gap-1 text-[10px] font-mono transition cursor-pointer"
                      title="Copy command"
                    >
                      {copiedIndex === b.step ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 rounded bg-ide-editor border border-ide-border font-mono text-[11px] text-sky-400 select-all overflow-x-auto">
                    {b.cmd}
                  </div>
                  <p className="text-[11px] text-ide-muted">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Architectural Notes */}
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <span className="font-semibold text-emerald-300 block">
                Zero Overhead for Desktop Users
              </span>
              <p className="text-ide-text/90 leading-relaxed">
                No mobile dependencies are packaged into the desktop build. The codebase uses clean feature detection (`window.electronAPI`), ensuring 100% desktop performance while remaining 100% portable for Android APK compilation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ide-border bg-ide-sidebar flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-ide-accent hover:bg-sky-600 text-white font-medium text-xs transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
