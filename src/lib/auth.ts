import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

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

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  hash: string,
  password: string
): Promise<boolean> {
  return await argon2.verify(hash, password);
}
