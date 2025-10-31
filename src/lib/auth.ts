import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { UnauthorizedError } from '../app/middleware.js';
import { createRefreshToken } from './db/queries/refreshTokens.js';
import { RefreshToken } from './db/schema.js';
process.loadEnvFile();

const { randomBytes } = await import('node:crypto');

type payload = Pick<jwt.JwtPayload, 'iss' | 'sub' | 'iat' | 'exp'>;

export function makeJWT(
  userId: string,
  expiresIn: number,
  secret: string
): string {
  //post REQ has seconds, sign() expects the default unit to be ms
  let expiresInMilliSeconds = expiresIn * 1000; // seconds -> ms
  const issuedAt = Math.floor(Date.now() / 1000);

  const payload: payload = {
    iss: 'chirpy',
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + expiresInMilliSeconds,
  };

  const token = jwt.sign(payload, secret);
  return token;
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decodedToken = jwt.verify(tokenString, secret);
    if (!(typeof decodedToken?.sub === 'string')) {
      throw new UnauthorizedError('Invalid token');
    }
    return decodedToken.sub; //returning userId
  } catch (err) {
    throw new UnauthorizedError('Invalid token');
  }
}

export function getBearerToken(req: Request): string {
  // gets email to get user -> provides userId
  const authHeader = req.headers.authorization; // or use reg.get('authorization')

  if (!authHeader) {
    throw new UnauthorizedError(`Authorization header missing`);
  }
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    return token;
  } else {
    throw new Error(`Unsupported authorization scheme`);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  hash: string,
  password: string
): Promise<boolean> {
  return await argon2.verify(hash, password);
  ``;
}

/*
// [ ] 2. add a makeRefreshToken function to your auth.ts file.
// [ ] It should use the following to generate a random 256-bit (32-byte) hex-encoded string:
    - crypto.randomBytes() to generate 32 bytes (256 bits) of random data from the built-in crypto module.
   - .toString() to convert the random data to a hex string. Just pass in 'hex' as the argument.

*/
export async function makeRefreshToken(userId: string): Promise<RefreshToken> {
  const buf = randomBytes(256);
  const tokenHexString = buf.toString('hex');

  const result = await createRefreshToken(tokenHexString, userId);

  return result;
}

export function getAPIKey(req: Request) {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('ApiKey')) {
    throw new UnauthorizedError('Invalid auth header');
  }

  const apiKey = authHeader.split(' ')[1];

  if (!apiKey) {
    throw new UnauthorizedError('Invalid polka key');
  }
  return apiKey;
}
