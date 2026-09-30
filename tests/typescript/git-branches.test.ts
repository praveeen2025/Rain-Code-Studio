/**
 * Unit tests for Git Branches and Checkout Safety (Phase 7)
 */

import { describe, it, expect } from 'vitest';
import { parseGitBranches, isValidBranchName } from '../../src/main/git/git-branches';

describe('Git Branch Security & Parsing', () => {
  describe('isValidBranchName', () => {
    it('allows valid branch names', () => {
      expect(isValidBranchName('main')).toBe(true);
      expect(isValidBranchName('feature/login-screen')).toBe(true);
      expect(isValidBranchName('bugfix_123')).toBe(true);
      expect(isValidBranchName('v1.0.0-release')).toBe(true);
    });

    it('rejects flag injection attempts (starting with dash)', () => {
      expect(isValidBranchName('-D')).toBe(false);
      expect(isValidBranchName('--force')).toBe(false);
      expect(isValidBranchName('-m')).toBe(false);
    });

    it('rejects path traversal attempts', () => {
      expect(isValidBranchName('../main')).toBe(false);
      expect(isValidBranchName('feature/../../etc')).toBe(false);
      expect(isValidBranchName('..')).toBe(false);
    });

    it('rejects shell metacharacters and spaces', () => {
      expect(isValidBranchName('branch name')).toBe(false);
      expect(isValidBranchName('branch;rm -rf /')).toBe(false);
      expect(isValidBranchName('branch`whoami`')).toBe(false);
      expect(isValidBranchName('branch$ENV')).toBe(false);
      expect(isValidBranchName('')).toBe(false);
    });
  });

  describe('parseGitBranches', () => {
    it('parses local branches and identifies active current branch', () => {
      const output = [
        '* main                a1b2c3d [origin/main] Initial commit',
        '  feature/dev-tools   e4f5g6h Added devtools page',
        '  remotes/origin/main a1b2c3d Initial commit'
      ].join('\n');

      const branches = parseGitBranches(output);
      expect(branches).toHaveLength(3);

      const main = branches.find((b) => b.name === 'main');
      expect(main?.isCurrent).toBe(true);
      expect(main?.isRemote).toBe(false);
      expect(main?.commitHash).toBe('a1b2c3d');
      expect(main?.upstream).toBe('origin/main');

      const feature = branches.find((b) => b.name === 'feature/dev-tools');
      expect(feature?.isCurrent).toBe(false);
      expect(feature?.isRemote).toBe(false);

      const remote = branches.find((b) => b.name === 'origin/main');
      expect(remote?.isRemote).toBe(true);
    });
  });
});
