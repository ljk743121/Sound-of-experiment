import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { env } from '../env';
import * as schema from './schema';

import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle({
  client: pool,
  schema,
});
