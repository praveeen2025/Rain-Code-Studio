/**
 * User domain interfaces, types, and enums
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  createdAt: Date;
}

export interface Session {
  token: string;
  user: User;
  expiresAt: Date;
}

export type AuthToken = string;

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}
