/**
 * Input validation utilities
 */

export const MAX_RETRY_ATTEMPTS = 5;
export const DEFAULT_TIMEOUT_MS = 3000;

export function validateEmail(email: string): boolean {
  if (!email || !email.includes('@')) {
    return false;
  }
  return email.length > 5;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export const isNonEmptyString = (val: unknown): val is string => {
  return typeof val === 'string' && val.trim().length > 0;
};
