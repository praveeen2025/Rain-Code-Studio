/**
 * Rain Code Studio - Activity Bar
 * VS Code-style leftmost 48px navigation bar with view toggling and theme switching.
 */

import React, { useEffect, useState } from 'react';
import {
  Files,
  Search,
  GitBranch,
  Bot,
  SearchCode,
  Bug,
  FlaskConical,
  BookOpen,
  Gauge,
  Settings,
  Sun,
  Moon,
  BrainCircuit
} from 'lucide-react';
import { themeStore } from '../stores/themeStore';

export type ActivityBarItem =
  | 'explorer'
  | 'search'
  | 'git'
  | 'chat'
  | 'analysis'
  | 'bugs'
  | 'tests'
  | 'docs'
  | 'performance'
  | 'model-hub'
  | 'settings';

interface ActivityBarProps {
  activeItem: ActivityBarItem;
  onSelectItem: (item: ActivityBarItem) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  gitChangesCount?: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeItem,
  onSelectItem,
  isSidebarOpen,
  onToggleSidebar,
  gitChangesCount = 0
}) => {
  const [isDark, setIsDark] = useState(themeStore.isDark());

  useEffect(() => {
    return themeStore.subscribe(() => {
      setIsDark(themeStore.isDark());
    });
  }, []);

  const handleClick = (item: ActivityBarItem) => {
    if (activeItem === item && isSidebarOpen) {
      onToggleSidebar();
    } else {
      if (!isSidebarOpen) {
        onToggleSidebar();
      }
      onSelectItem(item);
    }
  };

  const topItems: { id: ActivityBarItem; label: string; icon: React.ReactNode; badge?: number; shortcut: string }[] = [
    {
      id: 'explorer',
      label: 'Explorer',
      icon: <Files className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+Shift+E'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+Shift+F'
    },
    {
      id: 'git',
      label: 'Source Control',
      icon: <GitBranch className="w-5 h-5 stroke-[1.8]" />,
      badge: gitChangesCount > 0 ? gitChangesCount : undefined,
      shortcut: 'Ctrl+Shift+G'
    },
    {
      id: 'chat',
      label: 'Rain Code Copilot',
      icon: <Bot className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+L'
    },
    {
      id: 'analysis',
      label: 'Code Intelligence & AST',
      icon: <SearchCode className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+4'
    },
    {
      id: 'bugs',
      label: 'Bug Analysis & Error Audits',
      icon: <Bug className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+5'
    },
    {
      id: 'tests',
      label: 'Automated Test Suite',
      icon: <FlaskConical className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+6'
    },
    {
      id: 'docs',
      label: 'Documentation Generator',
      icon: <BookOpen className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+7'
    },
    {
      id: 'performance',
      label: 'Snapdragon & Performance Telemetry',
      icon: <Gauge className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+9'
    },
    {
      id: 'model-hub',
      label: 'Local AI Model Hub',
      icon: <BrainCircuit className="w-5 h-5 stroke-[1.8]" />,
      shortcut: 'Ctrl+0'
    }
  ];

  return (
    <aside
      className="w-12 bg-ide-activitybar border-r border-ide-border flex flex-col justify-between items-center py-2 select-none shrink-0 z-30"
      aria-label="Activity Bar"
    >
      {/* Top Tool Icons */}
      <div className="flex flex-col items-center gap-1 w-full">
        {topItems.map((item) => {
          const isActive = activeItem === item.id && isSidebarOpen;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              title={`${item.label} (${item.shortcut})`}
              aria-label={item.label}
              className={`relative w-full h-11 flex items-center justify-center transition-colors group ${
                isActive
                  ? 'text-ide-accent font-semibold'
                  : 'text-ide-muted hover:text-ide-text-bright'
              }`}
            >
              {/* Active Indicator Bar on Left */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-ide-accent rounded-r" />
              )}

              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-ide-accent text-[9px] font-bold text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Icons: Theme Toggle & Settings */}
      <div className="flex flex-col items-center gap-1 w-full pt-2 border-t border-ide-border/40">
        {/* Instant Theme Switcher Button */}
        <button
          onClick={() => themeStore.toggleTheme()}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
          className="w-full h-11 flex items-center justify-center text-ide-muted hover:text-ide-text-bright transition-colors group"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform stroke-[1.8]" />
          ) : (
            <Moon className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform stroke-[1.8]" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => handleClick('settings')}
          title="Settings (Ctrl+,)"
          aria-label="Settings"
          className={`relative w-full h-11 flex items-center justify-center transition-colors ${
            activeItem === 'settings' && isSidebarOpen
              ? 'text-ide-accent font-semibold'
              : 'text-ide-muted hover:text-ide-text-bright'
          }`}
        >
          {activeItem === 'settings' && isSidebarOpen && (
            <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-ide-accent rounded-r" />
          )}
          <Settings className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>
    </aside>
  );
};
