/**
 * SnapDev AI - Design System Empty State
 * Phase 9: Informative, actionable empty state cards for all workspaces.
 */

import React from 'react';
import { Button, ButtonVariant } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto select-none ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-ide-surface/80 border border-ide-border flex items-center justify-center text-ide-muted mb-3.5 shadow-sm">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-ide-muted leading-relaxed mb-5 max-w-xs">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              icon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
