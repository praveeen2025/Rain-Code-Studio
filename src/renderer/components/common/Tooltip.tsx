/**
 * SnapDev AI - Accessible Tooltip
 * Phase 9: Hover & focus tooltip with keyboard shortcut indicator.
 */

import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const POSITION_CLASSES = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5'
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${POSITION_CLASSES[position]} z-50 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded bg-ide-surface/95 border border-ide-border shadow-lg text-[11px] text-white whitespace-nowrap backdrop-blur-sm animate-fade-in`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1 py-0.2 rounded bg-ide-active border border-ide-border text-[9px] font-mono text-ide-muted">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
