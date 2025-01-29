import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import type { arrangements, refreshTokens, songs, users } from './schema';
import type { times } from './schema/time';

export const db = drizzle(env.DATABASE_URL!);

export type TRawUser = typeof users.$inferSelect;
export type TNewUser = typeof users.$inferInsert;
export type TRefreshToken = typeof refreshTokens.$inferInsert;

export type TRawSong = typeof songs.$inferSelect;
export type TNewSong = typeof songs.$inferInsert;

export type TRawArrangement = typeof arrangements.$inferSelect;
export type TNewArrangement = typeof arrangements.$inferInsert;

export type TRawTime = typeof times.$inferSelect;
export type TNewTime = typeof times.$inferInsert;
