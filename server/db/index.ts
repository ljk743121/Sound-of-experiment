import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as neon_dz } from 'drizzle-orm/neon-serverless';
import { drizzle as pg_dz } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import { env } from '../env';
import * as schema from './schema';

import 'dotenv/config';

function getDB() {
  if (env.DB_ENV === 'production') {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: true,
    });

    return neon_dz({
      client: pool,
      schema,
    });
  } else if (env.DB_ENV === 'development') {
    return pg_dz({
      connection: {
        connectionString: env.DATABASE_URL_DEV,
        ssl: false,
      },
      schema,
    });
  } else {
    throw new Error('DB_ENV is not set');
  }
}

export const db = getDB();
