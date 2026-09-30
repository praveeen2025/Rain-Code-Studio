/**
 * Unit tests for formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { formatBytes, formatUptime, truncatePath } from '../../src/renderer/utils/formatters';

describe('Formatting Utilities', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });
  });

  describe('formatUptime', () => {
    it('should format seconds', () => {
      expect(formatUptime(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatUptime(75)).toBe('1m 15s');
      expect(formatUptime(120)).toBe('2m 0s');
    });

    it('should format hours and minutes', () => {
      expect(formatUptime(3665)).toBe('1h 1m');
    });
  });

  describe('truncatePath', () => {
    it('should return short paths unchanged', () => {
      expect(truncatePath('src/main.ts')).toBe('src/main.ts');
    });

    it('should abbreviate long paths with ellipsis', () => {
      const longPath = 'd:/workspace/deep/nested/directory/structure/file.ts';
      const truncated = truncatePath(longPath, 25);
      expect(truncated).toContain('...');
    });
  });
});
