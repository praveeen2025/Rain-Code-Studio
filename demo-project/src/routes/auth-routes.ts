/**
 * Authentication and Login API Routes
 * Handles HTTP requests for login, registration, and session token verification.
 */

import { AuthService } from '../services/auth-service';
import { validateAuthToken } from '../utils/token';

const authService = new AuthService('app-secret-jwt-key');

/**
 * API route responsible for user login.
 * Receives credentials, verifies with AuthService, and returns token.
 */
export async function loginRoute(req: { body: { email: string; passwordHash: string } }) {
  const { email, passwordHash } = req.body;
  if (!email || !passwordHash) {
    return { status: 400, error: 'Email and password required' };
  }

  try {
    const session = await authService.login(email, passwordHash);
    return { status: 200, session };
  } catch (err: any) {
    return { status: 401, error: err.message };
  }
}

/**
 * API route responsible for validating user authentication token.
 */
export async function validateTokenRoute(req: { headers: { authorization?: string } }) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return { status: 401, valid: false, error: 'Token missing' };
  }

  const isValid = validateAuthToken(token);
  return { status: isValid ? 200 : 403, valid: isValid };
}

/**
 * API route responsible for logging out the current user session.
 */
export async function logoutRoute(req: { body: { token: string } }) {
  const success = authService.logout(req.body.token);
  return { status: 200, loggedOut: success };
}
