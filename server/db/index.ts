import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import * as schema from './schema';

import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
  },
  schema,
});
