import {
  integer,
  varchar,
  text,
  timestamp,
  uuid,
  pgTable,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  email: text('email').notNull().unique(),
});

export type NewUser = typeof users.$inferInsert;
