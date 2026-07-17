import type { ArrangeSong } from "~~/server/utils/arrange";
import { parseDate } from "@internationalized/date";
import { TRPCError } from "@trpc/server";
import { consola } from "consola";
// eslint-disable-next-line unused-imports/no-unused-imports
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { MAX_DAILY_SONG_DURATION } from "~~/constants";
import { db } from "~~/server/db";
import { arrangements, songs } from "~~/server/db/schema";
import { scheduleSongs } from "~~/server/utils/arrange";
import { cacheDel, cacheGet, cacheSet } from "~~/server/utils/redis";
import { getConfig } from "~~/server/utils/universal";
import verifyHasPlayedToken from "~~/server/utils/verifyHasPlayedToken";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  requirePermission,
  router,
} from "../trpc";
// import { fitsInTime } from "./time";

const order = [asc(songs.position), asc(songs.createdAt)];

export async function invalidateArrangementCache() {
  await cacheDel("arrangement:listSafe");
  await cacheDel("arrangement:listGuest");
  consola.info(`Redis 缓存失效：arrangement:listSafe, arrangement:listGuest`);
}

async function deleteArrangement(date: string) {
  const usedSongs = await db.query.songs.findMany({
    where: eq(songs.arrangementDate, date),
    columns: {
      id: true,
    },
  });
  for (const i of usedSongs) {
    await db
      .update(songs)
      .set({
        arrangementDate: null,
        position: null,
        state: "approved",
      })
      .where(eq(songs.id, i.id));
  }
  await db.delete(arrangements).where(eq(arrangements.date, date));
  await invalidateArrangementCache();
}

export const arrangementsRouter = router({
  list: adminProcedure.use(requirePermission(["arrange"])).query(async () => {
    return await db.query.arrangements.findMany({
      orderBy: desc(arrangements.date),
      columns: {
        date: true,
      },
      with: {
        songs: {
          orderBy: order,
          columns: {
            id: true,
            creator: true,
            ownerDisplayName: true,
            name: true,
            songId: true,
            source: true,
            imgId: true,
            duration: true,
            rejectMessage: true,
            message: true,
            state: true,
            createdAt: true,
            expectedPlayDate: true,
          },
        },
      },
    });
  }),

  listApproved: adminProcedure
    .use(requirePermission(["manualArrange"]))
    .query(async () => {
      return await db.query.songs.findMany({
        where: eq(songs.state, "approved"),
        orderBy: [desc(songs.arrangementDate), desc(songs.createdAt)],
      });
    }),

  updateOrder: adminProcedure
    .use(requirePermission(["manualArrange"]))
    .input(
      z.array(
        z.object({
          date: z.string(),
          songOrder: z.array(z.number()), // song id array
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const allSongIds = input.flatMap(day => day.songOrder);
      const uniqueSongIds = [...new Set(allSongIds)];
      const songRows = uniqueSongIds.length
        ? await db.query.songs.findMany({
          where: inArray(songs.id, uniqueSongIds),
          columns: { id: true, duration: true },
        })
        : [];
      const durationMap = new Map(songRows.map(s => [s.id, s.duration ?? 0]));

      const overLimitDates = input
        .filter(day => day.date !== "approved")
        .map((day) => {
          const total = day.songOrder.reduce((sum, id) => sum + (durationMap.get(id) ?? 0), 0);
          return { date: day.date, total };
        })
        .filter(day => day.total > MAX_DAILY_SONG_DURATION);

      if (overLimitDates.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `以下日期播放总时长超过 45 分钟：${overLimitDates.map(d => `${d.date}(${Math.round(d.total / 60)}分钟)`).join(", ")}`,
        });
      }

      await db.transaction(async (tx) => {
        for (const dayChange of input) {
          if (dayChange.date === "approved") {
            for (const songId of dayChange.songOrder) {
              if (!songId)
                continue;
              await tx.update(songs)
                .set({
                  state: "approved",
                  arrangementDate: null,
                  position: null,
                })
                .where(eq(songs.id, songId));
            }
            continue;
          }
          const arrangement = await tx.query.arrangements.findFirst({
            where: eq(arrangements.date, dayChange.date),
          });
          if (!arrangement) {
            await tx.insert(arrangements).values({
              date: dayChange.date,
            });
          }
          for (let i = 0; i < dayChange.songOrder.length; i++) {
            const songId = dayChange.songOrder[i];
            if (!songId)
              continue;
            await tx.update(songs)
              .set({
                state: "used",
                arrangementDate: dayChange.date,
                position: i + 1,
              })
              .where(eq(songs.id, songId));
          }
        }
      });
      await invalidateArrangementCache();
    }),

  listSafe: protectedProcedure.query(async () => {
    const cached = await cacheGet("arrangement:listSafe");
    if (cached) {
      consola.info(`${new Date().toLocaleString()} Redis 缓存命中：arrangement:listSafe`);
      return JSON.parse(cached);
    }

    const Ago = new Date();
    Ago.setDate(Ago.getDate() - 90);
    const AgoString = Ago.toISOString().split("T")[0]!;

    const arrangementsData = await db.query.arrangements.findMany({
      orderBy: desc(arrangements.date),
      where: gte(arrangements.date, AgoString),
      columns: {
        date: true,
        unplayedSongs: true,
      },
      with: {
        songs: {
          orderBy: order,
          columns: {
            id: true,
            creator: true,
            ownerDisplayName: true,
            name: true,
            songId: true,
            source: true,
            imgId: true,
            duration: true,
            likes: true,
            likeCount: true,
            rejectMessage: true,
            msgPublic: true,
            state: true,
            createdAt: true,
          },
        },
      },
    });

    await cacheSet("arrangement:listSafe", JSON.stringify(arrangementsData), { EX: 86400 });
    consola.info(`${new Date().toLocaleString()} Redis 缓存写入：arrangement:listSafe`);

    return arrangementsData;
  }),

  listGuest: publicProcedure.query(async () => {
    const cached = await cacheGet("arrangement:listGuest");
    if (cached) {
      consola.info(`${new Date().toLocaleString()} Redis 缓存命中：arrangement:listGuest`);
      return JSON.parse(cached);
    }

    const Ago = new Date();
    Ago.setDate(Ago.getDate() - 7);
    const AgoString = Ago.toISOString().split("T")[0]!;

    const arrangementsData = await db.query.arrangements.findMany({
      orderBy: desc(arrangements.date),
      where: gte(arrangements.date, AgoString),
      columns: {
        date: true,
        unplayedSongs: true,
      },
      with: {
        songs: {
          orderBy: order,
          columns: {
            id: true,
            creator: true,
            name: true,
            imgId: true,
            source: true,
            state: true,
            likeCount: true,
            createdAt: true,
          },
        },
      },
    });

    await cacheSet("arrangement:listGuest", JSON.stringify(arrangementsData), { EX: 86400 });
    consola.info(`${new Date().toLocaleString()} Redis 缓存写入：arrangement:listGuest`);

    return arrangementsData;
  }),

  stats: adminProcedure.use(requirePermission(["arrange"])).query(async () => {
    const approvedCount = await db
      .select({ count: count() })
      .from(songs)
      .where(eq(songs.state, "approved"));
    const pendingCount = await db
      .select({ count: count() })
      .from(songs)
      .where(eq(songs.state, "pending"));
    const droppedCount = await db
      .select({ count: count() })
      .from(songs)
      .where(eq(songs.state, "dropped"));

    return {
      approved: approvedCount[0]?.count ?? 0,
      pending: pendingCount[0]?.count ?? 0,
      dropped: droppedCount[0]?.count ?? 0,
    };
  }),

  arrange: adminProcedure
    .use(requirePermission(["arrange"]))
    .input(
      z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
        songCount: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      const start = parseDate(input.start);
      const end = parseDate(input.end);

      if (end.compare(start) < 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "结束日期不能早于开始日期",
        });
      }

      const dateColumns = {
        id: true,
        duration: true,
        expectedPlayDate: true,
        createdAt: true,
      } as const;

      const approvedSongs = await db.query.songs.findMany({
        where: eq(songs.state, "approved"),
        orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
        columns: dateColumns,
      });

      let droppedSongs: typeof approvedSongs = [];
      if (
        (end.compare(start) + 1) * (input.songCount || 1) > approvedSongs.length
        || input.songCount === 0
      ) {
        droppedSongs = await db.query.songs.findMany({
          where: eq(songs.state, "dropped"),
          orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
          columns: dateColumns,
        });
      }

      const candidateSongs: ArrangeSong[] = [...approvedSongs, ...droppedSongs].map(s => ({
        id: s.id,
        duration: s.duration ?? 0,
        expectedPlayDate: s.expectedPlayDate,
        createdAt: s.createdAt,
      }));
      if (candidateSongs.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "没有歌曲可播放",
        });
      }

      const rangeDates: string[] = [];
      for (let date = start; date.compare(end) <= 0; date = date.add({ days: 1 })) {
        rangeDates.push(date.toString());
      }

      const existingArrangements = await db.query.arrangements.findMany({
        where: and(
          gte(arrangements.date, input.start),
          lte(arrangements.date, input.end),
        ),
        with: {
          songs: {
            orderBy: order,
            columns: {
              id: true,
              duration: true,
            },
          },
        },
      });

      const existingAssignments: Record<string, number[]> = {};
      const existingSongs: ArrangeSong[] = [];
      const existingSongIds = new Set<number>();
      for (const arrangement of existingArrangements) {
        if (!rangeDates.includes(arrangement.date))
          continue;
        existingAssignments[arrangement.date] = arrangement.songs.map((s) => {
          if (!existingSongIds.has(s.id)) {
            existingSongIds.add(s.id);
            existingSongs.push({
              id: s.id,
              duration: s.duration ?? 0,
              expectedPlayDate: null,
              createdAt: new Date(),
            });
          }
          return s.id;
        });
      }

      const unavailableConfig = await getConfig("unavailableDates");
      let unavailableDates: string[] = [];
      if (unavailableConfig) {
        try {
          const parsed = JSON.parse(unavailableConfig);
          if (Array.isArray(parsed))
            unavailableDates = parsed.map(String);
        } catch {
          consola.warn("无法解析 unavailableDates 配置");
        }
      }

      const result = scheduleSongs(candidateSongs, input.start, input.end, {
        maxDailyDuration: MAX_DAILY_SONG_DURATION,
        maxSongsPerDay: input.songCount > 0 ? input.songCount : undefined,
        unavailableDates,
        existingAssignments,
        existingSongs,
      });

      await db.transaction(async (tx) => {
        for (const [dateString, songIds] of Object.entries(result.assignments)) {
          const existingIds = new Set(existingAssignments[dateString] ?? []);
          const newSongIds = songIds.filter(id => !existingIds.has(id));
          if (newSongIds.length === 0)
            continue;

          const arrangement = await tx.query.arrangements.findFirst({
            where: eq(arrangements.date, dateString),
          });
          if (!arrangement) {
            await tx.insert(arrangements).values({ date: dateString });
          }

          const existingCount = existingIds.size;
          for (let i = 0; i < newSongIds.length; i++) {
            await tx
              .update(songs)
              .set({
                arrangementDate: dateString,
                state: "used",
                position: existingCount + i + 1,
              })
              .where(eq(songs.id, newSongIds[i]!));
          }
        }

        for (const songId of result.dropped) {
          await tx
            .update(songs)
            .set({ state: "dropped", arrangementDate: null, position: null })
            .where(eq(songs.id, songId));
        }
      });

      const placedCount = Object.entries(result.assignments).reduce(
        (sum, [dateString, songIds]) => {
          const existingIds = new Set(existingAssignments[dateString] ?? []);
          return sum + songIds.filter(id => !existingIds.has(id)).length;
        },
        0,
      );

      await invalidateArrangementCache();

      return {
        conflicts: result.conflicts,
        droppedCount: result.dropped.length,
        placedCount,
      };
    }),

  getArrangement: protectedProcedure.use(requirePermission(["robot"]))
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
    }))
    .query(async ({ input }) => {
      return await db.query.arrangements.findFirst({
        where: eq(arrangements.date, input.date),
        columns: {
          date: true,
        },
        with: {
          songs: {
            orderBy: [asc(songs.position), desc(songs.createdAt)],
            columns: {
              id: true,
              creator: true,
              name: true,
              songId: true,
              source: true,
              imgId: true,
              message: true,
              msgPublic: true,
              rejectMessage: true,
              duration: true,
              createdAt: true,
              position: true,
              likeCount: true,
              ownerDisplayName: true,
              isRealName: true,
            },
          },
        },
      });
    }),
  today: publicProcedure.query(async () => {
    const today = new Date().toISOString().split("T")[0]!;
    const arrangement = await db.query.arrangements.findFirst({
      where: eq(arrangements.date, today),
      columns: {
        date: true,
      },
      with: {
        songs: {
          orderBy: [asc(songs.position), desc(songs.createdAt)],
          columns: {
            id: true,
            creator: true,
            name: true,
            songId: true,
            source: true,
            imgId: true,
            duration: true,
            ownerDisplayName: true,
            message: true,
            position: true,
          },
        },
      },
    });

    return arrangement;
  }),

  hasPlayed: publicProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
        songs: z.array(z.number().int().positive()).min(1, "歌曲列表不能为空"),
        token: z.string().min(1, "Token 不能为空"),
        hasPlayed: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const monitorHasPlayed = getConfig("monitorHasPlayed");
      if (!monitorHasPlayed) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "监控是否完成放歌任务未开启，无法处理请求",
        });
      }
      const { date, songs: songIds, token, hasPlayed } = input;
      if (!(await verifyHasPlayedToken(token))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token 验证失败",
        });
      }
      if (songIds.length === 0) {
        return {
          success: true,
          count: 0,
          processedIds: [],
          notFoundIds: [],
          message: "歌曲列表为空，未处理任何歌曲",
        };
      }

      const arrangement = await db.query.arrangements.findFirst({
        where: eq(arrangements.date, date),
        columns: { date: true },
      });

      if (!arrangement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `指定日期 ${date} 的排歌记录不存在`,
        });
      }

      if (!hasPlayed) {
        const usedSongs = await db.query.songs.findMany({
          where: eq(songs.arrangementDate, date),
          columns: {
            id: true,
          },
        });
        for (const i of usedSongs) {
          await db
            .update(songs)
            .set({
              arrangementDate: null,
              position: null,
              state: "approved",
            })
            .where(eq(songs.id, i.id));
        }
        await db.update(arrangements).set({ unplayedSongs: usedSongs.length }).where(eq(arrangements.date, date));
        await invalidateArrangementCache();
        return {
          success: true,
          count: usedSongs.length,
          processedIds: usedSongs.map(s => s.id),
          notFoundIds: [],
          message: `成功将 ${usedSongs.length} 首歌曲从排歌中移除，将参与下一次排歌`,
        };
      }

      const matchingSongs = await db.query.songs.findMany({
        where: and(eq(songs.arrangementDate, date), inArray(songs.id, songIds)),
        columns: { id: true },
      });

      const foundIds = matchingSongs.map(s => s.id);
      const notFoundIds = songIds.filter(id => !foundIds.includes(id));

      if (foundIds.length === 0) {
        return {
          success: true,
          count: 0,
          processedIds: [],
          notFoundIds,
          message: "未在当天的排歌记录中找到需要处理的歌曲",
        };
      }

      await db.transaction(async (tx) => {
        await tx
          .update(songs)
          .set({
            state: "approved",
            arrangementDate: null,
            position: null,
          })
          .where(inArray(songs.id, foundIds));
      });

      await db.update(arrangements).set({ unplayedSongs: foundIds.length }).where(eq(arrangements.date, date));

      await invalidateArrangementCache();

      return {
        success: true,
        count: foundIds.length,
        processedIds: foundIds,
        notFoundIds,
        message: `成功处理 ${foundIds.length} 首歌曲`,
      };
    }),

  delete: adminProcedure
    .use(requirePermission(["arrange", "deleteArrangement"]))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteArrangement(input.date);
    }),
});
