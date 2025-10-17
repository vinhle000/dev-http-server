import { loadEnvFile } from 'node:process';
import type { MigrationConfig } from 'drizzle-orm/migrator';

process.loadEnvFile();

function envOrThrow(key: string): string {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return process.env[key];
}
const migrationConfig: MigrationConfig = {
  migrationsFolder: './drizzle', // same as drizzle.config.ts "out" field
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type APIConfig = {
  fileserverHits: number;
  db: DBConfig;
  platform: string;
  jwtSecret: string;
};

export const config: APIConfig = {
  fileserverHits: 0,
  db: {
    url: envOrThrow('DB_URL'),
    migrationConfig: migrationConfig,
  },
  platform: envOrThrow('PLATFORM'),
  jwtSecret: envOrThrow('JWT_SECRET'),
};
