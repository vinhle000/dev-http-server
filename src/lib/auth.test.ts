import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, checkPasswordHash, makeJWT, validateJWT } from './auth';
import { hash } from 'crypto';
/* tests needed
[ ] create can validate JWT
[ ] check expired tokens are rejected
[ ] JWTs signed with wrong secret are rejected

  */
describe('Password Hashing', () => {
  const password1 = 'correctPassword123!';
  const password2 = 'anotherPassword456!';
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it('should return true for the correct password', async () => {
    const result = await checkPasswordHash(hash1, password1);
    expect(result).toBe(true);
  });
});

describe('JWT Token creation and validation', async () => {
  const userId1 = '1111-2222';
  const expiredTimeInSec1 = 10;

  const userId2 = '3333-4444';
  const expiredTimeInSec2 = 3;

  let token: string;
  let tokenShortExpiration: string;

  beforeAll(async () => {
    token = makeJWT(userId1, expiredTimeInSec1, 'my secret');
    tokenShortExpiration = makeJWT(userId2, expiredTimeInSec2, 'my secret');
  });

  it('should return true for a valid JWT Token', async () => {
    const result = validateJWT(token, 'my secret');
    expect(result).toBe(userId1);
  });

  it('should reject expired tokens', async () => {
    // Wait for the token to expire (3 seconds + 1 second buffer)
    await new Promise((resolve) => setTimeout(resolve, 4000));

    expect(() => validateJWT(tokenShortExpiration, 'my secret')).toThrow(
      'Invalid token'
    );
  });

  it('should reject token with wrong secret', async () => {
    expect(() => validateJWT(token, 'wrong secret')).toThrow('Invalid token');
  });
});
