import { db } from '../index.js';
import { chirps } from '../schema.js';
import { eq } from 'drizzle-orm';

// create chirps
export async function createChirp(body: string, userId: string) {
  const [result] = await db
    .insert(chirps)
    .values({ body: body, userId: userId })
    .returning();
  return result;
}

export async function getAllChirps(userId: string) {
  if (userId) {
    // only get specific user's records
    console.log(`DEBUG ======= get only ONLY AUTHOR'S Chirps ==\n\n `);
    return await db.select().from(chirps).where(eq(chirps.userId, userId));
  }
  return await db.select().from(chirps).orderBy(chirps.createdAt);
}

export async function getChirp(chirpId: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpId));
  return result;
}

export async function deleteChirp(chirpId: string) {
  const [result] = await db
    .delete(chirps)
    .where(eq(chirps.id, chirpId))
    .returning();
  return result;
}
