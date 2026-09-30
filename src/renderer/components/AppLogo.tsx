/**
 * Rain Code Studio - Official IDE Logo
 * Authentic geometric crystal "R" emblem in emerald and lime gradients.
 */

import React from 'react';
import logoUrl from '../assets/logo.png';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 20, className = '' }) => {
  return (
    <img
      src={logoUrl}
      alt="Rain Code Studio Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain select-none transition-transform hover:scale-105 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter: 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.25))'
      }}
    />
  );
};
