import { defineConfig } from 'drizzle-kit';
import { env } from './server/env';
import 'dotenv/config';

const databaseUrl = env.DB_ENV === 'production' ? env.DATABASE_URL : env.DATABASE_URL_DEV!;

export default defineConfig({
  out: './drizzle',
  schema: './server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
