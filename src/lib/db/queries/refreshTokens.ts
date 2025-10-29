import { db } from '../index.js';
import { users, refreshTokens, type NewUser, RefreshToken } from '../schema.js';
import { eq } from 'drizzle-orm';

export async function createRefreshToken(
  hexString: string,
  userId: string
): Promise<RefreshToken> {
  // 60days?
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const newDate = new Date(Date.now() + 60 * MS_PER_DAY);
  const [result] = await db
    .insert(refreshTokens)
    .values({ id: hexString, userId: userId, expiresAt: newDate })
    .returning();
  return result;
}

export async function getRefreshToken(refreshTokenHexString: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.id, refreshTokenHexString));

  return result;
}

export async function getUserFromRefreshToken(refreshTokenHexString: string) {
  const [result] = await db
    .select({ user: users })
    .from(refreshTokens)
    .innerJoin(users, eq(refreshTokens.userId, users.id))
    .where(eq(refreshTokens.id, refreshTokenHexString));
  // .limit(1);

  return result.user;
}

export async function revokeRefreshToken(refreshTokenHexString: string) {
  const [result] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, refreshTokenHexString))
    .returning();

  return result;
}
