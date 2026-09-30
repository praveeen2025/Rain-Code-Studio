/**
 * Rain Code Studio - Editor Tabs Bar
 * VS Code-style tab bar with real developer icons, active accent indicator, and crisp contrast.
 */

import React from 'react';
import {
  X,
  Plus,
  SplitSquareVertical,
  MoreHorizontal,
  Globe
} from 'lucide-react';
import type { EditorTab } from '../stores/editorTabsStore';
import { FileIcon } from './FileIcon';

interface EditorTabsBarProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab?: () => void;
  onToggleWebPreview?: () => void;
  isWebPreviewOpen?: boolean;
  onSplitEditor?: () => void;
}

export const EditorTabsBar: React.FC<EditorTabsBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onToggleWebPreview,
  isWebPreviewOpen = false,
  onSplitEditor
}) => {
  return (
    <div className="h-9 bg-ide-sidebar border-b border-ide-border flex items-center justify-between select-none shrink-0 overflow-x-auto scrollbar-none z-10">
      {/* Tabs Container */}
      <div className="flex items-center h-full flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group h-full flex items-center gap-2 px-3 border-r border-ide-border text-xs cursor-pointer transition-colors relative min-w-[120px] max-w-[200px] shrink-0 ${
                isActive
                  ? 'bg-ide-editor text-ide-text-bright font-semibold border-t-2 border-t-ide-accent'
                  : 'bg-ide-tab-inactive text-ide-text hover:bg-ide-hover hover:text-ide-text-bright'
              }`}
              title={tab.path || tab.title}
            >
              <FileIcon fileName={tab.title} size={14} />
              <span className="truncate font-mono text-[11px] flex-1">{tab.title}</span>

              {/* Close Button or Dirty Dot */}
              {tab.isDirty ? (
                <div className="w-2 h-2 rounded-full bg-ide-accent group-hover:hidden" />
              ) : null}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`p-0.5 rounded text-ide-muted hover:text-ide-text-bright hover:bg-ide-hover transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close (Ctrl+W)"
                aria-label={`Close ${tab.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 px-2 shrink-0 text-ide-muted">
        {onNewTab && (
          <button
            onClick={onNewTab}
            title="New File / Quick Open (Ctrl+P)"
            className="p-1 hover:text-ide-text-bright hover:bg-ide-hover rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggleWebPreview && (
          <button
            onClick={onToggleWebPreview}
            title="Integrated Web Preview (Browser)"
            className={`p-1 rounded transition-colors cursor-pointer ${
              isWebPreviewOpen
                ? 'text-ide-accent bg-ide-surface font-semibold'
                : 'hover:text-ide-text-bright hover:bg-ide-hover'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onSplitEditor}
          title="Split Editor Right"
          className="p-1 hover:text-ide-text-bright hover:bg-ide-hover rounded transition-colors cursor-pointer"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
        </button>
        <button
          title="More Actions"
          className="p-1 hover:text-ide-text-bright hover:bg-ide-hover rounded transition-colors cursor-pointer"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
