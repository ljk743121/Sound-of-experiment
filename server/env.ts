import process from 'node:process';
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DEV: z.string().url().optional(),
  DB_ENV: z.enum(['development', 'production']).default('production'),
  TOKEN_EXPIRATION_TIME: z.string().optional().default('5d'),
  SIGN_PUBLIC_KEY: z.string(),
  SIGN_PRIVATE_KEY: z.string(),
  ENC_PUBLIC_KEY: z.string(),
  ENC_PRIVATE_KEY: z.string(),
  SIGN_KID: z.string(),
  ENC_KID: z.string(),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('[ERROR] Invalid environment variables:', JSON.stringify(envParse.error.format(), null, 4));
  process.exit(1);
} else {
  console.warn('[INFO] Database Environment:', envParse.data.DB_ENV);
}
export const env = envParse.data;
