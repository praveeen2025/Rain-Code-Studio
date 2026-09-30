/**
 * Unit tests for Git Commit Validation (Phase 7)
 */

import { describe, it, expect } from 'vitest';
import { validateCommitMessage } from '../../src/main/git/git-commit';

describe('Git Commit Validation', () => {
  it('accepts valid conventional commit messages', () => {
    expect(validateCommitMessage('feat(git): add commit panel').isValid).toBe(true);
    expect(validateCommitMessage('fix: correct diff parsing algorithm').isValid).toBe(true);
    expect(validateCommitMessage('docs: update README with Phase 7 guide').isValid).toBe(true);
  });

  it('rejects empty or whitespace-only messages', () => {
    expect(validateCommitMessage('').isValid).toBe(false);
    expect(validateCommitMessage('   ').isValid).toBe(false);
    expect(validateCommitMessage('\n\t').isValid).toBe(false);
  });

  it('rejects overly short commit messages (< 3 chars)', () => {
    const res = validateCommitMessage('a');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('at least 3 characters');
  });

  it('rejects invalid control characters like null bytes', () => {
    const res = validateCommitMessage('feat: bad\0message');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('invalid characters');
  });
});
