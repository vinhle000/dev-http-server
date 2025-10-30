import { db } from '../index.js';
import { NewUser, users } from '../schema.js';
import { eq } from 'drizzle-orm';

/*
INSERT INTO <table> (<columns>) VALUES (<values>) RETURNINg *;
*/
export async function createUser(user: NewUser) {
  const { email, hashedPassword } = user;
  const [result] = await db
    .insert(users)
    .values({ email, hashedPassword })
    .onConflictDoNothing()
    .returning();

  return result;
}

export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}

export async function getUserById(userId: string) {
  const [result] = await db.select().from(users).where(eq(users.id, userId));
  return result;
}

export async function deleteAllUsers() {
  const result = await db.delete(users);
  console.log('All users deleted from the "users" table');
  return result;
}

export async function updateUserCredentials(
  userId: string,
  email: string,
  hashedPassword: string
) {
  const [result] = await db
    .update(users)
    .set({ email: email, hashedPassword: hashedPassword })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

export async function updateUserChirpRedStatus(userId: string) {
  const [result] = await db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, userId))
    .returning();
  return result;
}
