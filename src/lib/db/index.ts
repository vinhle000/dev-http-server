import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { config } from '../../config.js';

const conn = postgres(config.dbURL);
export const db = drizzle(conn, { schema });
