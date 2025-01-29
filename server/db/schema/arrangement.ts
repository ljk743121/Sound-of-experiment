import * as t from 'drizzle-orm/pg-core';

export const arrangements = t.pgTable('arrangements', {
  date: t.text('date').primaryKey(),
  songIds: t.json('song_ids').$type<string[]>(),
  isPublic: t.boolean('is_public').notNull().default(false),
});
