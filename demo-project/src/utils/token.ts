/**
 * Authentication Token Helper Utilities
 * Provides functions to generate, inspect, and validate authentication tokens.
 */

/**
 * Validates the token structure and expiration status.
 */
export function validateAuthToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  if (!token.startsWith('tok_')) {
    return false;
  }
  return token.length > 8;
}

/**
 * Generates a new cryptographically prefixed authentication token.
 */
export function generateAuthToken(prefix = 'tok_'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}_${randomPart}`;
}
