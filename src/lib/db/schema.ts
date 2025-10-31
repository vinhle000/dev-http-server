import {
  integer,
  varchar,
  text,
  timestamp,
  uuid,
  pgTable,
  boolean,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  email: text('email').notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 256 }).notNull(),
  isChirpyRed: boolean('is_chirpy_red').notNull().default(false),
});

export const chirps = pgTable('chirps', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  body: text('body').notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('token').primaryKey().notNull(),
  createdA: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  expiresAt: timestamp('expires_at').notNull(), // timestamp when the token expires
  revokedAt: timestamp(`revoked_at`), // timestamp when the token was revoked (null if not revoked)
});
export type NewUser = typeof users.$inferInsert;
export type Chirps = typeof chirps.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferInsert;
