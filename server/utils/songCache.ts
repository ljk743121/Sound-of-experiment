import type { TSongState } from "~~/types";
import { inArray } from "drizzle-orm";
import { db } from "~~/server/db";
import { arrangements, songs } from "~~/server/db/schema";

/**
 * 歌曲中不常变动的字段，可用于 Redis 缓存。
 * 点赞、歌曲状态等易变字段不要缓存，避免缓存频繁失效或返回过期数据。
 */
export const STABLE_SONG_COLUMNS = {
  id: true,
  name: true,
  creator: true,
  songId: true,
  source: true,
  imgId: true,
  duration: true,
  ownerId: true,
  isRealName: true,
  ownerDisplayName: true,
  expectedPlayDate: true,
  message: true,
  msgPublic: true,
  createdAt: true,
} as const;

/**
 * 歌曲中容易变动的字段，应每次从数据库实时读取。
 */
export const VOLATILE_SONG_COLUMNS = {
  id: true,
  state: true,
  likeCount: true,
  likes: true,
  arrangementDate: true,
  position: true,
  rejectMessage: true,
} as const;

export interface VolatileSongFields {
  id: number;
  state: TSongState;
  likeCount: number;
  likes: string[];
  arrangementDate: string | null;
  position: number | null;
  rejectMessage: string | null;
}

/**
 * 根据歌曲 ID 批量获取易变字段。
 */
export async function getVolatileSongMap(ids: number[]): Promise<Map<number, VolatileSongFields>> {
  if (ids.length === 0)
    return new Map();

  const rows = await db.query.songs.findMany({
    where: inArray(songs.id, ids),
    columns: VOLATILE_SONG_COLUMNS,
  });

  return new Map(rows.map(r => [r.id, r as VolatileSongFields]));
}

/**
 * 排歌记录中的易变字段（播放状态），每次实时读取，不缓存。
 */
export interface ArrangementVolatileFields {
  status: string;
}

/**
 * 根据排歌日期批量获取排歌记录易变字段（播放状态）。
 */
export async function getArrangementVolatileMap(
  dates: string[],
): Promise<Map<string, ArrangementVolatileFields>> {
  if (dates.length === 0)
    return new Map();

  const rows = await db.query.arrangements.findMany({
    where: inArray(arrangements.date, dates),
    columns: {
      date: true,
      status: true,
    },
  });

  return new Map(rows.map(r => [r.date, { status: r.status }]));
}
