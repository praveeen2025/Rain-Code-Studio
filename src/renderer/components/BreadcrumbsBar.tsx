/**
 * Rain Code Studio - Breadcrumbs Bar
 * VS Code-style path breadcrumb navigation with real developer icons and symbol context.
 */

import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { FileIcon } from './FileIcon';

interface BreadcrumbsBarProps {
  projectName?: string;
  filePath?: string;
  activeSymbolName?: string;
  onSelectSymbol?: () => void;
}

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
  projectName = 'Rain Code Studio',
  filePath,
  activeSymbolName,
  onSelectSymbol
}) => {
  if (!filePath) {
    return (
      <div className="h-6 px-4 bg-ide-editor border-b border-ide-border flex items-center gap-1 text-[11px] font-mono text-ide-text select-none">
        <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="font-semibold text-ide-text-bright">{projectName}</span>
      </div>
    );
  }

  // Normalize path segments
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);

  return (
    <div className="h-6 px-4 bg-ide-editor border-b border-ide-border flex items-center gap-1 text-[11px] font-mono text-ide-text select-none overflow-x-auto scrollbar-none">
      <span className="text-ide-text hover:text-ide-text-bright cursor-pointer truncate font-semibold">{projectName}</span>

      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        return (
          <React.Fragment key={`${part}-${index}`}>
            <ChevronRight className="w-3 h-3 text-ide-muted shrink-0" />
            <span
              className={`truncate cursor-pointer hover:text-ide-text-bright flex items-center gap-1 ${
                isLast ? 'text-ide-text-bright font-semibold' : 'text-ide-text'
              }`}
            >
              {isLast && <FileIcon fileName={part} size={13} />}
              <span>{part}</span>
            </span>
          </React.Fragment>
        );
      })}

      {activeSymbolName && (
        <>
          <ChevronRight className="w-3 h-3 text-ide-muted shrink-0" />
          <span
            onClick={onSelectSymbol}
            className="text-snap-crimson font-bold hover:underline cursor-pointer truncate"
          >
            {activeSymbolName}()
          </span>
        </>
      )}
    </div>
  );
};
