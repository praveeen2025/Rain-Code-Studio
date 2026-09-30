/**
 * SnapDev AI - Git Commit Service
 * Validates commit inputs and guarantees explicit user interaction.
 * Zero automatic commits without direct user execution.
 */

export interface CommitValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate commit message before attempting `git commit`.
 */
export function validateCommitMessage(message: string): CommitValidationResult {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Commit message cannot be empty.' };
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Commit message cannot be whitespace only.' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Commit message must be at least 3 characters long.' };
  }

  // Prevent null bytes
  if (trimmed.includes('\0')) {
    return { isValid: false, error: 'Commit message contains invalid characters.' };
  }

  return { isValid: true };
}
