/**
 * SnapDev AI - Design System Badge
 * Phase 9: Semantic status badges for Git, Performance, AI, and Parsers.
 */

import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'snap'
  | 'clean'
  | 'modified'
  | 'staged'
  | 'conflict'
  | 'untracked';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm';
  dot?: boolean;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-ide-surface text-ide-muted border-ide-border',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  error: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  snap: 'bg-snap-crimson/15 text-rose-300 border-snap-crimson/30',
  clean: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  modified: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  staged: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  conflict: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  untracked: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  neutral: 'bg-ide-muted',
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-rose-400',
  snap: 'bg-snap-crimson',
  clean: 'bg-emerald-400',
  modified: 'bg-amber-400',
  staged: 'bg-sky-400',
  conflict: 'bg-purple-400',
  untracked: 'bg-zinc-400'
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono border rounded font-medium select-none ${
        size === 'xs' ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      } ${BADGE_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
