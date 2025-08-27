import type { TSongState } from '~~/types';
import { count } from 'drizzle-orm';
import { db } from '~~/server/db';
import { users, songs } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, router } from '../trpc';

async function getSongMap() {
  const songs = await db.query.songs.findMany({
    columns: {
      createdAt: true,
      state: true,
    },
  });

  const map = new Map<string, { [key in TSongState]: number }>();
  for (const song of songs) {
    const date = song.createdAt.toLocaleDateString('zh-CN');
    const val = map.get(date) ?? { approved: 0, dropped: 0, pending: 0, rejected: 0, used: 0 };
    val[song.state]++;
    map.set(date, val);
  };

  return { songs, map };
}

function splitSingerNames(creator: string): string[] {
  const results: string[] = [];
  const parenthesesRegex = /([^(（]*)[(（]([^)）]*)[)）]/;
  const match = creator.match(parenthesesRegex);
  
  if (match) {
    const outer = match[1].trim();
    const inner = match[2].trim();
    
    if (outer) {
      results.push(outer);
    }
    if (inner) {
      results.push(inner);
    }
    // seems if it has a secondary name, it's probably not a group of singers
  } else {
    creator.split(/, |；|;|\//).forEach(part => {
      const trimmed = part.trim();
      if (trimmed) results.push(trimmed);
    });
  }
  
  return results;
}

export const statsRouter = router({
  dashboard: adminProcedure
    .query(async () => {
      const userCount = (await db.select({ count: count() }).from(users))[0]?.count;

      const { songs, map } = await getSongMap();

      return {
        songCount: songs.length,
        userCount,
        chart: Array.from(map, ([date, count]) => ({ date, ...count })).toSorted((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime()),
      };
    }),
  count: protectedProcedure
    .query(async () => {
      const userCount = (await db.select({ count: count() }).from(users))[0]?.count;
      const songCount = (await db.select({ count: count() }).from(songs))[0]?.count;

      return {
        userCount,
        songCount,
      };
    }),

  song: protectedProcedure
    .query(async () => {
      const { map } = await getSongMap();
      return Array.from(
        map,
        ([date, count]) => ({
          date,
          count: count.approved + count.used + count.dropped + count.pending + count.rejected,
        }),
      ).toSorted((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
    }),

  singer: protectedProcedure
    .query(async () => {
      const singers = await db.query.songs.findMany({
        columns: {
          creator: true,
        },
      });

      const map = new Map<string, number>();
      for (const singer of singers) {
        if (!singer.creator) continue;
        const creators = splitSingerNames(singer.creator);

        for (const creator of creators) {
          const trimmedCreator = creator.trim();
          if (!trimmedCreator) continue;
          
          const count = map.get(trimmedCreator) ?? 0;
          map.set(trimmedCreator, count + 1);
        }
      }

      return Array.from(map, ([name, count]) => ({ name, count })).toSorted((a, b) => b.count - a.count);
    }),

  like: protectedProcedure
    .query(async () => {
      const songs = await db.query.songs.findMany({
        columns: {
          name: true,
          imgId: true,
          source: true,
          likes: true,
        },
      });

      const map = new Map<string, { count: number, source: string | null, imgId: string | null }>();
      for (const song of songs) {
        if (!song.likes||!song.likes.length) continue;
        const likes = song.likes.length ?? 0;
        const existing = map.get(song.name);
        const newCount = (existing?.count ?? 0) + likes;
        map.set(song.name, { 
          count: newCount, 
          source: existing?.source ?? song.source ?? null, 
          imgId: existing?.imgId ?? song.imgId ?? null 
        });
      }
      return Array.from(map, ([name, data]) => ({ name, ...data })).toSorted((a, b) => b.count - a.count);
    })
});
