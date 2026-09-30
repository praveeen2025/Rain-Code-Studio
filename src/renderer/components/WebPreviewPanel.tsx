/**
 * Rain Code Studio - Integrated Web Preview / Browser Preview Panel
 * Live in-app sandbox for previewing HTML/CSS/JS files, web applications, and local dev servers.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  FileCode,
  X
} from 'lucide-react';
import { ProjectFile } from '../../shared/types';
import { notificationStore } from '../stores/notificationStore';

interface WebPreviewPanelProps {
  selectedFile?: ProjectFile | null;
  fileContent?: string | null;
  initialUrl?: string;
  onClose?: () => void;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const WebPreviewPanel: React.FC<WebPreviewPanelProps> = ({
  selectedFile,
  fileContent,
  initialUrl = 'http://localhost:5173',
  onClose
}) => {
  const isHtmlFile = Boolean(selectedFile?.extension === 'html' || selectedFile?.name.endsWith('.html'));

  const [urlInput, setUrlInput] = useState<string>(
    isHtmlFile ? 'local-file://active-html' : initialUrl
  );
  const [activeUrl, setActiveUrl] = useState<string>(
    isHtmlFile ? 'local-file://active-html' : initialUrl
  );
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // If user switches to an HTML file, update urlInput
  useEffect(() => {
    if (isHtmlFile) {
      setUrlInput(`local-file://${selectedFile?.name}`);
      setActiveUrl(`local-file://${selectedFile?.name}`);
    }
  }, [selectedFile?.path, isHtmlFile]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('local-file://')) {
      target = `http://${target}`;
      setUrlInput(target);
    }
    setActiveUrl(target);
    setIsLoading(true);
    setPreviewKey((k) => k + 1);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setPreviewKey((k) => k + 1);
    notificationStore.info('Preview Refreshed', activeUrl);
  };

  const handleOpenExternal = () => {
    if (activeUrl.startsWith('http')) {
      window.open(activeUrl, '_blank');
    } else {
      notificationStore.info('Local HTML Preview', 'Currently rendered directly in embedded sandbox');
    }
  };

  // Determine viewport width style
  const getViewportStyle = () => {
    if (viewportMode === 'mobile') {
      return { width: '375px', height: '667px' };
    }
    if (viewportMode === 'tablet') {
      return { width: '768px', height: '100%' };
    }
    return { width: '100%', height: '100%' };
  };

  const isLocalFileMode = activeUrl.startsWith('local-file://');

  return (
    <div className="flex-1 flex flex-col bg-ide-bg border-l border-ide-border overflow-hidden select-none h-full">
      {/* Browser Navigation Toolbar */}
      <div className="h-10 px-3 bg-ide-sidebar border-b border-ide-border flex items-center justify-between gap-2 shrink-0 text-xs">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1 text-ide-muted">
          <button
            onClick={() => {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.history.back();
              }
            }}
            title="Go Back"
            className="p-1 hover:text-ide-text-bright rounded hover:bg-ide-hover transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.history.forward();
              }
            }}
            title="Go Forward"
            className="p-1 hover:text-ide-text-bright rounded hover:bg-ide-hover transition cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRefresh}
            title="Reload Preview"
            className="p-1 hover:text-ide-text-bright rounded hover:bg-ide-hover transition cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-ide-accent' : ''}`} />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleNavigate} className="flex-1 max-w-xl flex items-center">
          <div className="w-full flex items-center gap-2 px-2.5 py-1 rounded-md bg-ide-input border border-ide-input-border text-ide-text text-xs focus-within:border-ide-accent">
            {isLocalFileMode ? (
              <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )}
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL (e.g. http://localhost:5173 or active file)..."
              className="w-full bg-transparent text-ide-text font-mono text-[11px] focus:outline-none"
            />
          </div>
        </form>

        {/* Responsive Viewport Mode Selector */}
        <div className="flex items-center gap-1 border-l border-ide-border/60 pl-2 text-ide-muted">
          <button
            onClick={() => setViewportMode('desktop')}
            title="Desktop View (100%)"
            className={`p-1.5 rounded transition cursor-pointer ${
              viewportMode === 'desktop'
                ? 'bg-ide-panel text-ide-accent font-semibold shadow-xs'
                : 'hover:text-ide-text hover:bg-ide-hover'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            title="Tablet View (768px)"
            className={`p-1.5 rounded transition cursor-pointer ${
              viewportMode === 'tablet'
                ? 'bg-ide-panel text-ide-accent font-semibold shadow-xs'
                : 'hover:text-ide-text hover:bg-ide-hover'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            title="Mobile View (375px)"
            className={`p-1.5 rounded transition cursor-pointer ${
              viewportMode === 'mobile'
                ? 'bg-ide-panel text-ide-accent font-semibold shadow-xs'
                : 'hover:text-ide-text hover:bg-ide-hover'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Quick presets */}
          <button
            onClick={() => {
              setUrlInput('http://127.0.0.1:8765/docs');
              setActiveUrl('http://127.0.0.1:8765/docs');
              setPreviewKey((k) => k + 1);
            }}
            title="Preview Local FastAPI Swagger Docs"
            className="px-2 py-0.5 ml-1 rounded bg-ide-surface hover:bg-ide-hover border border-ide-border text-[10px] font-mono text-ide-text cursor-pointer"
          >
            API Docs
          </button>

          <button
            onClick={handleOpenExternal}
            title="Open in External Browser"
            className="p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Web Preview"
              className="p-1.5 rounded hover:text-ide-text hover:bg-ide-hover transition cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Viewport Container */}
      <div className="flex-1 overflow-auto bg-ide-panel flex items-center justify-center p-2 relative">
        <div
          style={getViewportStyle()}
          className={`bg-white transition-all duration-200 relative overflow-hidden flex flex-col ${
            viewportMode !== 'desktop'
              ? 'rounded-xl shadow-2xl border-4 border-slate-700 my-auto'
              : 'w-full h-full'
          }`}
        >
          {/* Device Mockup Header for Tablet/Mobile */}
          {viewportMode !== 'desktop' && (
            <div className="h-6 bg-slate-800 text-slate-400 text-[10px] px-3 flex items-center justify-between select-none">
              <span className="font-mono">{viewportMode === 'mobile' ? '375 × 667 (iPhone)' : '768 × 1024 (iPad)'}</span>
              <div className="w-10 h-1.5 bg-slate-600 rounded-full" />
            </div>
          )}

          {/* Sandboxed iframe */}
          <iframe
            key={previewKey}
            ref={iframeRef}
            src={isLocalFileMode ? undefined : activeUrl}
            srcDoc={
              isLocalFileMode
                ? fileContent ||
                  `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Active HTML File Preview</h2><p>No content in active file.</p></body></html>`
                : undefined
            }
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              notificationStore.error('Preview Error', `Failed to load ${activeUrl}`);
            }}
            className="w-full flex-1 border-0 bg-white"
            title="Rain Code Web Preview"
          />
        </div>
      </div>
    </div>
  );
};
