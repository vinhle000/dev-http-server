import { db } from '../index.js';
import { refreshTokens, type RefreshToken } from '../schema.js';

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
