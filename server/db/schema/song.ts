import * as t from 'drizzle-orm/pg-core';
import { useNanoID } from '../../../composables/useNanoID';

export const songs = t.pgTable('songs', {
  id: t.text('id').primaryKey().$defaultFn(() => useNanoID()),
  name: t.text('name').notNull(),
  creator: t.text('creator').notNull(),
  submitterName: t.text('submitter_name').notNull(),
  submitterGrade: t.integer('submitter_grade').notNull(), // 1: 高一 | 2: 高二 | 3: 国体高一 | 4: 国体高二 | 5: 国体高三
  submitterClass: t.integer('submitter_class').notNull(),
  status: t.text('status', { enum: ['unset', 'approved', 'rejected', 'used'] }).notNull().default('unset'),
  type: t.text('type', { enum: ['normal', 'withMsg'] }).notNull(),
  message: t.text('message'),
  createdAt: t.timestamp('created_at').notNull().defaultNow(),
});
