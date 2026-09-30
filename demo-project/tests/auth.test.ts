/**
 * Unit tests for AuthService in demo project
 */

import { AuthService } from '../src/services/auth-service';
import { validateEmail } from '../src/utils/validator';

export function testAuthLogin() {
  const service = new AuthService('test-secret-key-123');
  return service.login('dev@example.com', 'hashed_pwd');
}

export function testValidator() {
  return validateEmail('test@snapdev.ai');
}
