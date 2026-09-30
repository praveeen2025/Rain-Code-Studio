/**
 * Rain Code Studio - Real Developer File Icons
 * Authentic, pixel-perfect developer icons for files, folders, and languages (VS Code standard).
 */

import React from 'react';
import { ProjectFile } from '../../shared/types';

interface FileIconProps {
  file?: ProjectFile | { name: string; extension?: string; isDirectory?: boolean };
  fileName?: string;
  isOpen?: boolean;
  className?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({
  file,
  fileName,
  isOpen = false,
  className = '',
  size = 15
}) => {
  const name = fileName || file?.name || '';
  const isDir = file?.isDirectory || false;
  const ext = (file?.extension || name.split('.').pop() || '').toLowerCase().replace(/^\./, '');

  // Folder Icons (Real VS Code folder design)
  if (isDir) {
    if (isOpen) {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
        >
          <path
            d="M1.5 2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H6.08579C6.351 1.5 6.60536 1.60536 6.79289 1.79289L8.20711 3.20711C8.39464 3.39464 8.649 3.5 8.91421 3.5H13.5C14.0523 3.5 14.5 3.94772 14.5 4.5V6H2.5C2.10218 6 1.73489 6.21071 1.54921 6.54921L1.5 2.5Z"
            fill="#dcb67a"
          />
          <path
            d="M1.05079 7.44921C1.16104 7.17357 1.42858 7 1.72494 7H14.2751C14.5714 7 14.839 7.17357 14.9492 7.44921L15.9492 9.94921C16.0384 10.1722 15.9866 10.4269 15.8155 10.601C15.6444 10.7751 15.3853 10.8354 15.1528 10.7554L14.2751 10.4508L13.125 14.5H2.875L1.72494 10.4508L0.847193 10.7554C0.614691 10.8354 0.355611 10.7751 0.184511 10.601C0.013411 10.4269 -0.0384074 10.1722 0.050787 9.94921L1.05079 7.44921Z"
            fill="#e5c07b"
          />
        </svg>
      );
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path
          d="M1.5 2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H6.08579C6.351 1.5 6.60536 1.60536 6.79289 1.79289L8.20711 3.20711C8.39464 3.39464 8.649 3.5 8.91421 3.5H13.5C14.0523 3.5 14.5 3.94772 14.5 4.5V13.5C14.5 14.0523 14.0523 14.5 13.5 14.5H2.5C1.94772 14.5 1.5 14.0523 1.5 13.5V2.5Z"
          fill="#dcb67a"
        />
        <path
          d="M1.5 5.5H14.5V13.5C14.5 14.0523 14.0523 14.5 13.5 14.5H2.5C1.94772 14.5 1.5 14.0523 1.5 13.5V5.5Z"
          fill="#e5c07b"
        />
      </svg>
    );
  }

  // TypeScript (.ts) - Official Blue TS Logo
  if (ext === 'ts') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#3178C6" />
        <path
          d="M3 5.5H7.5V6.8H5.9V12H4.6V6.8H3V5.5ZM8.2 10.4C8.4 11 8.9 11.4 9.8 11.4C10.7 11.4 11.2 10.9 11.2 10.3C11.2 8.7 8.2 9.2 8.2 7.3C8.2 6.1 9.2 5.3 10.6 5.3C11.8 5.3 12.6 6 12.8 7H11.5C11.3 6.6 11 6.3 10.5 6.3C9.9 6.3 9.5 6.7 9.5 7.2C9.5 8.7 12.5 8.2 12.5 10.1C12.5 11.5 11.4 12.4 9.8 12.4C8.4 12.4 7.4 11.5 7.1 10.4H8.2Z"
          fill="white"
        />
      </svg>
    );
  }

  // TypeScript React (.tsx) - Blue TS with React Atom Cyan Dot
  if (ext === 'tsx') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#0288D1" />
        <path
          d="M2.5 5.5H6.2V6.6H4.9V11.5H3.8V6.6H2.5V5.5ZM6.8 9.9C7 10.4 7.4 10.8 8.1 10.8C8.8 10.8 9.3 10.4 9.3 9.8C9.3 8.5 6.8 8.9 6.8 7.3C6.8 6.3 7.6 5.6 8.8 5.6C9.8 5.6 10.4 6.1 10.6 7H9.5C9.4 6.6 9.1 6.4 8.7 6.4C8.2 6.4 7.9 6.7 7.9 7.1C7.9 8.3 10.4 7.9 10.4 9.5C10.4 10.7 9.5 11.5 8.1 11.5C7 11.5 6.2 10.8 5.9 9.9H6.8Z"
          fill="white"
        />
        {/* Cyan React indicator */}
        <circle cx="12.5" cy="8.5" r="2" fill="#00E5FF" />
      </svg>
    );
  }

  // JavaScript (.js) - Official Yellow JS Logo
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#F7DF1E" />
        <path
          d="M4.5 10.8C4.7 11.2 5 11.5 5.5 11.5C6 11.5 6.4 11.2 6.4 10.6V6.5H7.7V10.6C7.7 11.9 6.8 12.5 5.4 12.5C4.2 12.5 3.5 11.8 3.2 10.8H4.5ZM8.7 10.5C8.9 11.1 9.4 11.5 10.3 11.5C11.1 11.5 11.6 11 11.6 10.4C11.6 8.8 8.7 9.3 8.7 7.4C8.7 6.2 9.7 5.4 11.1 5.4C12.2 5.4 13 6.1 13.2 7.1H11.9C11.7 6.7 11.4 6.4 10.9 6.4C10.4 6.4 10 6.8 10 7.3C10 8.8 12.9 8.3 12.9 10.2C12.9 11.6 11.8 12.5 10.3 12.5C8.9 12.5 7.9 11.6 7.6 10.5H8.7Z"
          fill="#1E1E1E"
        />
      </svg>
    );
  }

  // JavaScript React (.jsx)
  if (ext === 'jsx') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#20232A" />
        <ellipse cx="8" cy="8" rx="6" ry="2.3" stroke="#61DAFB" strokeWidth="1" />
        <ellipse cx="8" cy="8" rx="6" ry="2.3" transform="rotate(60 8 8)" stroke="#61DAFB" strokeWidth="1" />
        <ellipse cx="8" cy="8" rx="6" ry="2.3" transform="rotate(120 8 8)" stroke="#61DAFB" strokeWidth="1" />
        <circle cx="8" cy="8" r="1.2" fill="#61DAFB" />
      </svg>
    );
  }

  // Python (.py) - Official Python dual snake logo
  if (ext === 'py') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path
          d="M7.9 1.5C5.4 1.5 5.5 2.6 5.5 2.6V3.8H8V4.2H4.4C3.2 4.2 2.2 4.7 2.2 6.4C2.2 8.1 3.1 8.2 3.1 8.2H4V7.2C4 5.9 5.1 5.8 5.1 5.8H7.7C8.8 5.8 9.6 5 9.6 3.9C9.6 2.8 8.8 1.5 7.9 1.5ZM6.8 2.3C7.2 2.3 7.5 2.6 7.5 3C7.5 3.4 7.2 3.7 6.8 3.7C6.4 3.7 6.1 3.4 6.1 3C6.1 2.6 6.4 2.3 6.8 2.3Z"
          fill="#3776AB"
        />
        <path
          d="M8.1 14.5C10.6 14.5 10.5 13.4 10.5 13.4V12.2H8V11.8H11.6C12.8 11.8 13.8 11.3 13.8 9.6C13.8 7.9 12.9 7.8 12.9 7.8H12V8.8C12 10.1 10.9 10.2 10.9 10.2H8.3C7.2 10.2 6.4 11 6.4 12.1C6.4 13.2 7.2 14.5 8.1 14.5ZM9.2 13.7C8.8 13.7 8.5 13.4 8.5 13C8.5 12.6 8.8 12.3 9.2 12.3C9.6 12.3 9.9 12.6 9.9 13C9.9 13.4 9.6 13.7 9.2 13.7Z"
          fill="#FFD43B"
        />
      </svg>
    );
  }

  // JSON (.json) - Official yellow brackets
  if (ext === 'json') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#FBC02D" />
        <path
          d="M5.5 4.5C4.7 4.5 4.5 5.2 4.5 5.8V7C4.5 7.5 4.1 7.8 3.5 8C4.1 8.2 4.5 8.5 4.5 9V10.2C4.5 10.8 4.7 11.5 5.5 11.5M10.5 4.5C11.3 4.5 11.5 5.2 11.5 5.8V7C11.5 7.5 11.9 7.8 12.5 8C11.9 8.2 11.5 8.5 11.5 9V10.2C11.5 10.8 11.3 11.5 10.5 11.5"
          stroke="#1E1E1E"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Markdown (.md) - Official M↓ icon
  if (ext === 'md' || ext === 'markdown') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect x="1" y="2.5" width="14" height="11" rx="1.5" stroke="#42A5F5" strokeWidth="1.2" fill="none" />
        <path d="M3 10.5V5.5L5 7.5L7 5.5V10.5M12.5 8L10.5 10.5L8.5 8M10.5 5.5V10" stroke="#42A5F5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // HTML (.html, .htm) - HTML5 Orange Shield
  if (ext === 'html' || ext === 'htm') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#E44D26" />
        <path d="M4 6.5L2 8L4 9.5M12 6.5L14 8L12 9.5M9.5 5L6.5 11" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  // CSS / SCSS (.css, .scss, .sass, .less) - Blue Shield
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#1572B6" />
        <path d="M5.5 4.5L4.5 11.5M11.5 4.5L10.5 11.5M3.5 6.5H12.5M3 9.5H12" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Git (.gitignore, .gitattributes)
  if (name.startsWith('.git') || ext === 'git') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="16" height="16" rx="2" fill="#F05032" />
        <circle cx="5" cy="5" r="1.5" fill="white" />
        <circle cx="5" cy="11" r="1.5" fill="white" />
        <circle cx="11" cy="8" r="1.5" fill="white" />
        <path d="M5 6.5V9.5M5 6.5C5 8 11 8 11 8" stroke="white" strokeWidth="1.2" />
      </svg>
    );
  }

  // SQLite / Database (.sqlite, .db, .sql)
  if (ext === 'sqlite' || ext === 'db' || ext === 'sql') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <ellipse cx="8" cy="4" rx="5" ry="2" fill="#003B57" stroke="#00A9E0" strokeWidth="1" />
        <path d="M3 4V12C3 13.1 5.2 14 8 14C10.8 14 13 13.1 13 12V4" stroke="#00A9E0" strokeWidth="1" fill="none" />
        <path d="M3 8C3 9.1 5.2 10 8 10C10.8 10 13 9.1 13 8" stroke="#00A9E0" strokeWidth="1" />
      </svg>
    );
  }

  // Generic document / fallback
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 text-ide-muted ${className}`}
    >
      <path
        d="M3.5 2C2.67157 2 2 2.67157 2 3.5V12.5C2 13.3284 2.67157 14 3.5 14H12.5C13.3284 14 14 13.3284 14 12.5V6L10 2H3.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M9.5 2V6H13.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
};
