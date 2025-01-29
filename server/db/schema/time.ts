import * as t from 'drizzle-orm/pg-core';
import { useNanoID } from '../../../composables/useNanoID';

export const times = t.pgTable('times', {
  id: t.text('id').primaryKey().$defaultFn(() => useNanoID()),
  name: t.text('name').notNull(),
  startAt: t.timestamp('start_at').notNull(),
  endAt: t.timestamp('end_at').notNull(),
  repeats: t.boolean('repeats').notNull().default(false),
  isActive: t.boolean('is_active').notNull().default(true),
});
