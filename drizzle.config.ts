import { defineConfig } from 'drizzle-kit';
import { env } from './server/env';

export default defineConfig({
  out: './drizzle',
  schema: './server/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
