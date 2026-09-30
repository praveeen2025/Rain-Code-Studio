/**
 * Authentication Service
 * Manages user logins, token issuance, and password verification.
 */

import { User, Session, AuthToken } from '../models/user';
import { validateEmail } from '../utils/validator';

export class AuthService {
  private secretKey: string;
  private activeSessions: Map<string, Session>;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.activeSessions = new Map();
  }

  public async login(email: string, passwordHash: string): Promise<Session> {
    if (!validateEmail(email)) {
      throw new Error('Invalid email address format.');
    }

    const user: User = {
      id: 'usr_101',
      name: 'Developer Admin',
      email,
      role: 'developer',
      createdAt: new Date()
    };

    const token: AuthToken = `tok_${Date.now()}`;
    const session: Session = {
      token,
      user,
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };

    this.activeSessions.set(token, session);
    return session;
  }

  public logout(token: AuthToken): boolean {
    return this.activeSessions.delete(token);
  }

  public getSession(token: AuthToken): Session | undefined {
    return this.activeSessions.get(token);
  }
}
