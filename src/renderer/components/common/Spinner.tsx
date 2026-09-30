/**
 * SnapDev AI - Loading Spinner
 * Phase 9: Non-blocking SVG spinner.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'sm',
  className = '',
  label
}) => {
  return (
    <div className={`inline-flex items-center gap-2 text-ide-muted select-none ${className}`}>
      <Loader2 className={`${SIZE_MAP[size]} animate-spin text-snap-crimson shrink-0`} />
      {label && <span className="text-xs font-mono text-ide-muted">{label}</span>}
    </div>
  );
};
