/**
 * Rain Code Studio - Primary Sidebar
 * VS Code-style collapsible sidebar with Explorer, Search, Source Control, Run & Debug, and Settings.
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  X,
  Code2,
  FolderPlus,
  FilePlus,
  Play,
  Pencil,
  Trash2,
  Minimize2,
  Folder
} from 'lucide-react';
import { ActivityBarItem } from './ActivityBar';
import { useProject } from '../hooks/useProject';
import { editorTabsStore, EditorTab } from '../stores/editorTabsStore';
import { projectStore } from '../stores/projectStore';
import { ProjectFile } from '../../shared/types';
import { notificationStore } from '../stores/notificationStore';
import { FileIcon } from './FileIcon';
import { SidebarSearch } from './SidebarSearch';
import { SidebarGit } from './SidebarGit';
import { SidebarRunDebug } from './SidebarRunDebug';
import { SidebarSettings } from './SidebarSettings';

interface PrimarySidebarProps {
  activeItem: ActivityBarItem;
  onNavigatePage: (page: import('../../shared/types').NavigationPage) => void;
  onOpenDiff?: (filePath: string) => void;
  onSelectSymbolLine?: (line: number) => void;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  activeItem,
  onNavigatePage,
  onOpenDiff,
  onSelectSymbolLine
}) => {
  const {
    activeProject,
    fileTree,
    selectedFile,
    openProjectDialog,
    loadDemoProject,
    activeFileSymbols,
    triggerReindex
  } = useProject();

  const [openEditors, setOpenEditors] = useState<EditorTab[]>(editorTabsStore.getTabs());
  const [activeTabId, setActiveTabId] = useState<string | null>(editorTabsStore.getActiveTabId());
  const [searchQuery, setSearchQuery] = useState('');
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isOpenEditorsOpen, setIsOpenEditorsOpen] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inline creation states
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [collapseKey, setCollapseKey] = useState(0);

  useEffect(() => {
    return editorTabsStore.subscribe(() => {
      setOpenEditors(editorTabsStore.getTabs());
      setActiveTabId(editorTabsStore.getActiveTabId());
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await projectStore.refreshFileTree();
    await triggerReindex();
    notificationStore.info('Workspace refreshed', 'Files & AST symbols up to date');
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateFileSubmit = async () => {
    if (!newFileName.trim() || !activeProject) {
      setIsCreatingFile(false);
      return;
    }
    await projectStore.createFile(activeProject.path, newFileName.trim());
    setNewFileName('');
    setIsCreatingFile(false);
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim() || !activeProject) {
      setIsCreatingFolder(false);
      return;
    }
    await projectStore.createFolder(activeProject.path, newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleRename = async (file: ProjectFile, newName: string) => {
    if (!newName.trim() || newName === file.name) return;
    const parent = file.path.substring(0, file.path.lastIndexOf(file.name));
    const newPath = `${parent}${newName.trim()}`;
    await projectStore.renameItem(file.path, newPath);
  };

  const handleDelete = async (file: ProjectFile) => {
    await projectStore.deleteItem(file.path);
  };

  const getAllFiles = (tree: ProjectFile[]): ProjectFile[] => {
    const list: ProjectFile[] = [];
    const traverse = (items: ProjectFile[]) => {
      for (const item of items) {
        if (!item.isDirectory) {
          list.push(item);
        } else if (item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(tree);
    return list;
  };

  const renderFileTreeItem = (file: ProjectFile, level: number = 0) => {
    const isSelected = selectedFile?.path === file.path;

    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      if (
        !file.children ||
        !file.children.some((c: ProjectFile) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ) {
        return null;
      }
    }

    return (
      <FileTreeRow
        key={`${file.path}-${collapseKey}`}
        file={file}
        level={level}
        isSelected={isSelected}
        onSelect={(f) => {
          if (!f.isDirectory) {
            editorTabsStore.openFileTab(f);
          }
        }}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <aside className="w-full h-full bg-ide-sidebar border-r border-ide-border flex flex-col select-none shrink-0 overflow-hidden">
      {/* Sidebar Header */}
      <div className="h-9 px-4 flex items-center justify-between border-b border-ide-border text-xs font-bold uppercase tracking-wider text-ide-text-bright bg-ide-sidebar">
        <span className="truncate">
          {activeItem === 'explorer' && 'Explorer'}
          {activeItem === 'search' && 'Search'}
          {activeItem === 'git' && 'Source Control'}
          {activeItem === 'chat' && 'Rain Code Copilot'}
          {activeItem === 'analysis' && 'Code Intelligence'}
          {activeItem === 'bugs' && 'Bug Audits'}
          {activeItem === 'tests' && 'Run & Debug'}
          {activeItem === 'docs' && 'Documentation'}
          {activeItem === 'performance' && 'Snapdragon'}
          {activeItem === 'settings' && 'Settings'}
        </span>

        {activeItem === 'explorer' && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                setIsCreatingFile(true);
                setIsCreatingFolder(false);
              }}
              title="New File"
              className="p-1 text-ide-muted hover:text-ide-text-bright rounded hover:bg-ide-hover transition-colors cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(true);
                setIsCreatingFile(false);
              }}
              title="New Folder"
              className="p-1 text-ide-muted hover:text-ide-text-bright rounded hover:bg-ide-hover transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              title="Refresh Explorer & Index"
              className="p-1 text-ide-muted hover:text-ide-text-bright rounded hover:bg-ide-hover transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setCollapseKey((prev) => prev + 1)}
              title="Collapse All Folders"
              className="p-1 text-ide-muted hover:text-ide-text-bright rounded hover:bg-ide-hover transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Explorer View */}
      {activeItem === 'explorer' && (
        <div className="flex-1 overflow-y-auto divide-y divide-ide-border/40 text-xs">
          {/* Quick Filter */}
          <div className="p-2 bg-ide-sidebar">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-ide-muted" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ide-surface border border-ide-border rounded px-2 pl-7 py-1 text-xs text-ide-text placeholder:text-ide-muted/80 focus:outline-none focus:border-ide-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-ide-muted hover:text-ide-text-bright"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Section: Open Editors */}
          <div>
            <button
              onClick={() => setIsOpenEditorsOpen(!isOpenEditorsOpen)}
              className="w-full px-2 py-1.5 flex items-center gap-1 text-[11px] font-bold text-ide-text hover:text-ide-text-bright uppercase tracking-wider bg-ide-surface/60 border-b border-ide-border/40"
            >
              {isOpenEditorsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-ide-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-ide-muted" />
              )}
              <span>Open Editors</span>
              <span className="ml-auto text-[10px] font-mono text-ide-muted font-normal">
                {openEditors.length}
              </span>
            </button>

            {isOpenEditorsOpen && (
              <div className="py-1">
                {openEditors.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => editorTabsStore.setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-3 py-1 cursor-pointer group ${
                      activeTabId === tab.id
                        ? 'bg-ide-active text-ide-text-bright font-semibold'
                        : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate flex-1">
                      <FileIcon fileName={tab.title} size={14} />
                      <span className="truncate font-mono text-[11px]">{tab.title}</span>
                    </div>
                    {tab.isDirty && (
                      <span className="w-1.5 h-1.5 rounded-full bg-ide-accent mr-1.5" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editorTabsStore.closeTab(tab.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-ide-text-bright p-0.5 rounded text-ide-muted"
                      title="Close"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Project Folders Tree */}
          <div>
            <button
              onClick={() => setIsFoldersOpen(!isFoldersOpen)}
              className="w-full px-2 py-1.5 flex items-center gap-1 text-[11px] font-bold text-ide-text hover:text-ide-text-bright uppercase tracking-wider bg-ide-surface/60 border-b border-ide-border/40"
            >
              {isFoldersOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-ide-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-ide-muted" />
              )}
              <span className="truncate">{activeProject ? activeProject.name : 'No Folder Opened'}</span>
            </button>

            {isFoldersOpen && (
              <div className="py-1">
                {/* Inline New File Prompt */}
                {isCreatingFile && (
                  <div className="px-3 py-1 flex items-center gap-1.5 bg-ide-surface border-b border-ide-border">
                    <FilePlus className="w-3.5 h-3.5 text-ide-accent shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="filename.ext (Enter to create, Esc to cancel)"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFileSubmit();
                        if (e.key === 'Escape') setIsCreatingFile(false);
                      }}
                      onBlur={() => {
                        if (newFileName.trim()) handleCreateFileSubmit();
                        else setIsCreatingFile(false);
                      }}
                      className="w-full bg-ide-surface border border-ide-accent rounded px-1.5 py-0.5 text-[11px] font-mono text-ide-text focus:outline-none"
                    />
                  </div>
                )}

                {/* Inline New Folder Prompt */}
                {isCreatingFolder && (
                  <div className="px-3 py-1 flex items-center gap-1.5 bg-ide-surface border-b border-ide-border">
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="folder_name (Enter to create, Esc to cancel)"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolderSubmit();
                        if (e.key === 'Escape') setIsCreatingFolder(false);
                      }}
                      onBlur={() => {
                        if (newFolderName.trim()) handleCreateFolderSubmit();
                        else setIsCreatingFolder(false);
                      }}
                      className="w-full bg-ide-surface border border-ide-accent rounded px-1.5 py-0.5 text-[11px] font-mono text-ide-text focus:outline-none"
                    />
                  </div>
                )}

                {!activeProject ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-ide-muted text-[11px]">No active workspace opened.</p>
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={openProjectDialog}
                        className="w-full py-1.5 px-3 rounded bg-ide-accent hover:bg-sky-600 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                      >
                        Open Workspace
                      </button>
                      <button
                        onClick={loadDemoProject}
                        className="w-full py-1.5 px-3 rounded bg-ide-surface hover:bg-ide-hover text-ide-text font-medium text-xs border border-ide-border transition cursor-pointer"
                      >
                        Load Demo Project
                      </button>
                    </div>
                  </div>
                ) : fileTree.length === 0 ? (
                  <div className="p-4 text-center text-ide-muted text-[11px]">No source files found</div>
                ) : (
                  <div>{fileTree.map((file) => renderFileTreeItem(file, 0))}</div>
                )}
              </div>
            )}
          </div>

          {/* Section: Active File AST Outline */}
          {activeFileSymbols && activeFileSymbols.symbols.length > 0 && (
            <div>
              <button
                onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                className="w-full px-2 py-1.5 flex items-center gap-1 text-[11px] font-bold text-ide-text hover:text-ide-text-bright uppercase tracking-wider bg-ide-surface/60 border-y border-ide-border/40"
              >
                {isOutlineOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-ide-muted" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-ide-muted" />
                )}
                <span>Outline</span>
                <span className="ml-auto text-[10px] font-mono text-ide-muted font-normal">
                  {activeFileSymbols.symbols.length}
                </span>
              </button>

              {isOutlineOpen && (
                <div className="py-1 max-h-56 overflow-y-auto">
                  {activeFileSymbols.symbols.map((sym, idx) => (
                    <div
                      key={`${sym.name}-${idx}`}
                      onClick={() => onSelectSymbolLine && onSelectSymbolLine(sym.startLine)}
                      className="flex items-center justify-between px-4 py-1 text-ide-text hover:text-ide-text-bright hover:bg-ide-hover cursor-pointer"
                      title={`${sym.kind}: ${sym.name} (Line ${sym.startLine})`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Code2 className="w-3.5 h-3.5 text-snap-crimson shrink-0" />
                        <span className="truncate font-mono text-[11px]">{sym.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-ide-muted">L{sym.startLine}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search View */}
      {activeItem === 'search' && (
        <SidebarSearch
          onOpenFile={(file, line) => {
            editorTabsStore.openFileTab(file);
            if (line && onSelectSymbolLine) {
              onSelectSymbolLine(line);
            }
          }}
        />
      )}

      {/* Source Control View */}
      {activeItem === 'git' && (
        <SidebarGit
          onOpenFile={(filePath) => {
            const allFiles = getAllFiles(fileTree);
            const found = allFiles.find((f) => f.path === filePath);
            if (found) {
              editorTabsStore.openFileTab(found);
            }
          }}
          onOpenDiff={onOpenDiff}
          onNavigateGitPage={() => onNavigatePage('git')}
        />
      )}

      {/* Run & Debug View */}
      {activeItem === 'tests' && (
        <SidebarRunDebug
          onNavigateTests={() => onNavigatePage('tests')}
          onNavigatePerformance={() => onNavigatePage('performance')}
        />
      )}

      {/* Settings View */}
      {activeItem === 'settings' && (
        <SidebarSettings
          onNavigateSettingsPage={() => onNavigatePage('settings')}
        />
      )}

      {/* Quick Switch for specialized AI tools */}
      {['chat', 'analysis', 'bugs', 'docs', 'performance'].includes(activeItem) && (
        <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto text-xs">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-ide-surface border border-ide-border space-y-1.5">
              <span className="text-[11px] font-bold text-ide-text-bright uppercase tracking-wider block">
                {activeItem} View
              </span>
              <p className="text-[11px] text-ide-text leading-relaxed">
                Open full workspace view in the primary editor or switch directly.
              </p>
              <button
                onClick={() => {
                  if (activeItem === 'chat') onNavigatePage('chat');
                  else if (activeItem === 'analysis') onNavigatePage('analysis');
                  else if (activeItem === 'bugs') onNavigatePage('bugs');
                  else if (activeItem === 'docs') onNavigatePage('docs');
                  else if (activeItem === 'performance') onNavigatePage('performance');
                }}
                className="w-full mt-2 py-1.5 px-3 rounded bg-ide-accent hover:bg-sky-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Open {activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

interface FileTreeRowProps {
  file: ProjectFile;
  level: number;
  isSelected: boolean;
  onSelect: (f: ProjectFile) => void;
  onRename: (file: ProjectFile, newName: string) => void;
  onDelete: (file: ProjectFile) => void;
}

const FileTreeRow: React.FC<FileTreeRowProps> = ({
  file,
  level,
  isSelected,
  onSelect,
  onRename,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!contextMenuPos) return;
    const handleClose = () => setContextMenuPos(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [contextMenuPos]);

  const handleClick = () => {
    if (file.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelect(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== file.name) {
      onRename(file, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className={`flex items-center gap-1.5 py-1 pr-2 rounded-sm cursor-pointer text-xs transition-colors select-none group relative ${
          isSelected
            ? 'bg-ide-active text-ide-text-bright font-semibold'
            : 'text-ide-text hover:text-ide-text-bright hover:bg-ide-hover'
        }`}
      >
        {file.isDirectory ? (
          <span className="text-ide-muted group-hover:text-ide-text-bright">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        <FileIcon file={file} isOpen={isOpen} size={15} />

        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={editName}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onBlur={handleRenameSubmit}
            className="flex-1 bg-ide-surface border border-ide-accent rounded px-1 text-[11px] font-mono text-ide-text focus:outline-none"
          />
        ) : (
          <span className="truncate font-mono text-[11px] flex-1">{file.name}</span>
        )}

        {/* Action icons on hover */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-ide-muted">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Rename"
              className="p-0.5 hover:text-ide-text-bright rounded hover:bg-ide-hover"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete ${file.name}?`)) {
                  onDelete(file);
                }
              }}
              title="Delete"
              className="p-0.5 hover:text-rose-500 rounded hover:bg-ide-hover"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenuPos && (
        <div
          style={{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }}
          className="fixed z-50 w-48 bg-ide-panel border border-ide-border rounded-lg shadow-2xl py-1 text-xs text-ide-text select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setContextMenuPos(null);
              if (!file.isDirectory) onSelect(file);
              else setIsOpen(!isOpen);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
          >
            <span>Open</span>
          </button>
          <button
            onClick={() => {
              setContextMenuPos(null);
              setIsEditing(true);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
          >
            <span>Rename</span>
            <kbd className="text-[10px] text-ide-muted font-mono ml-auto">F2</kbd>
          </button>
          <button
            onClick={() => {
              setContextMenuPos(null);
              navigator.clipboard.writeText(file.path);
              notificationStore.success('Path Copied', file.path);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
          >
            <span>Copy Path</span>
            <kbd className="text-[10px] text-ide-muted font-mono ml-auto">Shift+Alt+C</kbd>
          </button>
          <button
            onClick={() => {
              setContextMenuPos(null);
              navigator.clipboard.writeText(file.name);
              notificationStore.success('Name Copied', file.name);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-ide-hover hover:text-ide-text-bright cursor-pointer"
          >
            <span>Copy Name</span>
          </button>
          <div className="h-px bg-ide-border my-1" />
          <button
            onClick={() => {
              setContextMenuPos(null);
              if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
                onDelete(file);
              }
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer"
          >
            <span>Delete</span>
            <kbd className="text-[10px] text-rose-400 font-mono ml-auto">Del</kbd>
          </button>
        </div>
      )}

      {file.isDirectory && isOpen && file.children && (
        <div>
          {file.children.map((child: ProjectFile) => (
            <FileTreeRow
              key={child.path}
              file={child}
              level={level + 1}
              isSelected={isSelected}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
