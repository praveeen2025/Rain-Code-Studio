/**
 * Unit tests for Git Conflict Detection (Phase 7)
 */

import { describe, it, expect } from 'vitest';
import { describeConflict } from '../../src/main/git/git-conflict';

describe('Git Conflict Service', () => {
  it('describes standard Git conflict states', () => {
    expect(describeConflict('UU')).toContain('Both modified');
    expect(describeConflict('AA')).toContain('Both added');
    expect(describeConflict('UD')).toContain('Modified by us, deleted by them');
    expect(describeConflict('DU')).toContain('Deleted by us, modified by them');
  });

  it('provides safety instructions: never auto-resolves', () => {
    const desc = describeConflict('UU');
    expect(desc).toBeDefined();
    // Verification that manual resolution is required
    expect(desc.toLowerCase()).not.toContain('auto');
  });
});
