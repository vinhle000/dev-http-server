import { defineConfig } from 'drizzle-kit';

if (!process.env.DB_URL) {
  throw new Error(`DB URL not found in drizzle config`);
}
export default defineConfig({
  schema: 'src/app/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DB_URL,
  },
});
