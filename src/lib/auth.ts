import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { UnauthorizedError } from 'src/app/middleware';
process.loadEnvFile();

type payload = Pick<jwt.JwtPayload, 'iss' | 'sub' | 'iat' | 'exp'>;

export function makeJWT(
  userId: string,
  expiresIn: number,
  secret: string
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: payload = {
    iss: 'chirpy',
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  const token = jwt.sign(payload, secret);
  return token;
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decodedToken = jwt.verify(tokenString, secret);
    if (!(typeof decodedToken?.sub === 'string')) {
      throw new Error('Invalid token');
    }
    return decodedToken.sub; //returning userId
  } catch (err) {
    throw new Error('Invalid token');
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
