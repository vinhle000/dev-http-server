import { db } from '../index.js';
import { NewUser, users } from '../schema.js';

/*
INSERT INTO <table> (<columns>) VALUES (<values>) RETURNINg *;
*/
export async function createUser(user: NewUser) {
  const { email } = user;
  const [result] = await db
    .insert(users)
    .values({ email })
    .onConflictDoNothing()
    .returning();
  console.log(`[DEBUG] - create user query results ====== ${result}`);
  return result;
}

export async function deleteAllUsers() {
  const result = await db.delete(users);
  console.log('All users deleted from the "users" table');
  return result;
}
