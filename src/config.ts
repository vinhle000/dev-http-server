import { loadEnvFile } from 'node:process';
process.loadEnvFile();

function envOrThrow(key: string): string {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return process.env[key];
}

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
};

export const config: APIConfig = {
  fileserverHits: 0,
  dbURL: envOrThrow('DB_URL'),
};
