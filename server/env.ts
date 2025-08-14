import process from 'node:process';
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: '.env.local' })

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DEV: z.string().url().optional(),
  WY_URL: z.string().url().optional(),
  TX_URL: z.string().url().optional(),
  DB_ENV: z.enum(['development', 'production']).default('production'),
  TOKEN_EXPIRATION_TIME: z.string().optional().default('7d'),
  SIGN_PUBLIC_KEY: z.string(),
  SIGN_PRIVATE_KEY: z.string(),
  ENC_PUBLIC_KEY: z.string(),
  ENC_PRIVATE_KEY: z.string(),
  SIGN_KID: z.string(),
  ENC_KID: z.string(),
  EDGE_CONFIG_ID: z.string().optional(),
  EDGE_CONFIG_TOKEN: z.string().optional(),
  CF_TOKEN: z.string().optional(),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('[ERROR] Invalid environment variables:', JSON.stringify(envParse.error.format(), null, 4));
  process.exit(1);
} else {
  console.warn('[INFO] Database Environment:', envParse.data.DB_ENV);
}
export const env = envParse.data;
