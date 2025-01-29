import * as t from 'drizzle-orm/pg-core';
import { useNanoID } from '../../../composables/useNanoID';

export const users = t.pgTable('users', {
  id: t.text('id').primaryKey().$defaultFn(() => useNanoID()),
  password: t.text('password').notNull(),
  createdAt: t.timestamp('created_at').notNull().defaultNow(),
});

export const refreshTokens = t.pgTable('refresh_tokens', {
  id: t.text('id').primaryKey().$defaultFn(() => useNanoID()),
  token: t.text('token').notNull(),
  owner: t.text('owner').references(() => users.id).notNull(),
});
