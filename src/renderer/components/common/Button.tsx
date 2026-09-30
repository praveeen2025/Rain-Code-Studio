/**
 * SnapDev AI - Design System Button
 * Phase 9: Unified, accessible, keyboard-focused button component.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'ghost'
  | 'outline'
  | 'snap';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-snap-blue hover:bg-sky-600 text-white font-medium border border-sky-500/40 shadow-sm focus:ring-sky-500/50',
  secondary:
    'bg-ide-surface hover:bg-ide-hover text-ide-text border border-ide-border focus:ring-ide-border',
  destructive:
    'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 focus:ring-rose-500/50',
  ghost:
    'bg-transparent hover:bg-ide-hover/60 text-ide-muted hover:text-white border-transparent focus:ring-ide-border',
  outline:
    'bg-transparent hover:bg-ide-surface text-ide-text border border-ide-border focus:ring-ide-border',
  snap:
    'bg-gradient-to-r from-snap-red to-snap-crimson hover:from-rose-600 hover:to-rose-700 text-white font-semibold border border-rose-500/40 shadow-[0_0_12px_rgba(255,20,67,0.25)] focus:ring-rose-500/50'
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px] rounded gap-1.5',
  sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-xs rounded-md gap-2',
  lg: 'px-4 py-2.5 text-sm rounded-lg gap-2.5'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'sm',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-ide-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        VARIANT_CLASSES[variant]
      } ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
