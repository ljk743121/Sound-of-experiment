import type { ArrangeSong } from "~~/server/utils/arrange";
import { parseDate } from "@internationalized/date";
import { TRPCError } from "@trpc/server";
import { consola } from "consola";
// eslint-disable-next-line unused-imports/no-unused-imports
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { MAX_DAILY_SONG_DURATION } from "~~/constants";
import { db } from "~~/server/db";
import { arrangements, songs, users } from "~~/server/db/schema";
import { scheduleSongs } from "~~/server/utils/arrange";
import { cacheDel, cacheGet, cacheSet } from "~~/server/utils/redis";
import { getArrangementVolatileMap, getVolatileSongMap } from "~~/server/utils/songCache";
import { getConfig } from "~~/server/utils/universal";
// import verifyHasPlayedToken from "~~/server/utils/verifyHasPlayedToken";
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
  // status 为易变字段不缓存，稳定缓存仅含 date 与 songs；统一使用单一版本键
  await cacheDel("arrangement:listSafe:stable");
  await cacheDel("arrangement:listGuest:stable");
  consola.info(`Redis 缓存失效：arrangement:listSafe:stable, arrangement:listGuest:stable`);
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

  listApproved: adminProcedure.use(requirePermission(["manualArrange"])).query(async () => {
    return await db.query.songs.findMany({
      where: inArray(songs.state, ["approved", "missed"]),
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
              await tx
                .update(songs)
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
            await tx
              .update(songs)
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
    const cacheKey = "arrangement:listSafe:stable";
    const cached = await cacheGet(cacheKey);

    let arrangementsData;
    if (cached) {
      consola.info(`${new Date().toLocaleString()} Redis 缓存命中：${cacheKey}`);
      arrangementsData = JSON.parse(cached);
    } else {
      const Ago = new Date();
      Ago.setDate(Ago.getDate() - 90);
      const AgoString = Ago.toISOString().split("T")[0]!;

      arrangementsData = await db.query.arrangements.findMany({
        orderBy: desc(arrangements.date),
        where: gte(arrangements.date, AgoString),
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
              msgPublic: true,
              createdAt: true,
            },
          },
        },
      });

      await cacheSet(cacheKey, JSON.stringify(arrangementsData), { EX: 86400 });
      consola.info(`${new Date().toLocaleString()} Redis 缓存写入：${cacheKey}`);
    }

    // 易变字段（点赞、状态、未播放数等）不缓存，每次实时读取并合并
    const songIds = arrangementsData.flatMap((a: { songs: { id: number }[] }) =>
      a.songs.map((s: { id: number }) => s.id),
    );
    const volatileMap = await getVolatileSongMap(songIds);
    const dates = arrangementsData.map((a: { date: string }) => a.date);
    const arrangementVolatileMap = await getArrangementVolatileMap(dates);

    const likerIds = [
      ...new Set(
        arrangementsData.flatMap((a: { songs: { id: number }[] }) =>
          a.songs.flatMap((s: { id: number }) => volatileMap.get(s.id)?.likes ?? []),
        ),
      ),
    ] as string[];
    const likers = likerIds.length
      ? await db.query.users.findMany({
        where: inArray(users.id, likerIds),
        columns: { id: true, displayName: true, name: true },
      })
      : [];
    const likerMap = new Map(likers.map(u => [u.id, u]));

    return arrangementsData.map((arrangement: { date: string; songs: { id: number }[] }) => {
      const arrangementVolatile = arrangementVolatileMap.get(arrangement.date) ?? {
        unplayedSongs: 0,
        status: "pending",
      };
      return {
        ...arrangement,
        unplayedSongs: arrangementVolatile.unplayedSongs,
        status: arrangementVolatile.status,
        songs: arrangement.songs.map((song: { id: number }) => {
          const volatile = volatileMap.get(song.id);
          return {
            ...song,
            ...volatile,
            likeUsers:
              volatile?.likes.map(id => likerMap.get(id)?.displayName || likerMap.get(id)!.name)
              ?? [],
          };
        }),
      };
    });
  }),

  listGuest: publicProcedure.query(async () => {
    const cacheKey = "arrangement:listGuest:stable";
    const cached = await cacheGet(cacheKey);

    let arrangementsData;
    if (cached) {
      consola.info(`${new Date().toLocaleString()} Redis 缓存命中：${cacheKey}`);
      arrangementsData = JSON.parse(cached);
    } else {
      const Ago = new Date();
      Ago.setDate(Ago.getDate() - 7);
      const AgoString = Ago.toISOString().split("T")[0]!;

      arrangementsData = await db.query.arrangements.findMany({
        orderBy: desc(arrangements.date),
        where: gte(arrangements.date, AgoString),
        columns: { date: true },
        with: {
          songs: {
            orderBy: order,
            columns: {
              id: true,
              creator: true,
              name: true,
              imgId: true,
              source: true,
              createdAt: true,
            },
          },
        },
      });

      await cacheSet(cacheKey, JSON.stringify(arrangementsData), { EX: 86400 });
      consola.info(`${new Date().toLocaleString()} Redis 缓存写入：${cacheKey}`);
    }

    // 易变字段（点赞数、状态、未播放数等）不缓存，每次实时读取并合并
    const songIds = arrangementsData.flatMap((a: { songs: { id: number }[] }) =>
      a.songs.map((s: { id: number }) => s.id),
    );
    const volatileMap = await getVolatileSongMap(songIds);
    const dates = arrangementsData.map((a: { date: string }) => a.date);
    const arrangementVolatileMap = await getArrangementVolatileMap(dates);

    return arrangementsData.map((arrangement: { date: string; songs: { id: number }[] }) => {
      const arrangementVolatile = arrangementVolatileMap.get(arrangement.date) ?? {
        unplayedSongs: 0,
        status: "pending",
      };
      return {
        ...arrangement,
        unplayedSongs: arrangementVolatile.unplayedSongs,
        status: arrangementVolatile.status,
        songs: arrangement.songs.map((song: { id: number }) => ({
          ...song,
          state: volatileMap.get(song.id)?.state,
          likeCount: volatileMap.get(song.id)?.likeCount ?? 0,
        })),
      };
    });
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
    const missedCount = await db
      .select({ count: count() })
      .from(songs)
      .where(eq(songs.state, "missed"));

    return {
      approved: approvedCount[0]?.count ?? 0,
      pending: pendingCount[0]?.count ?? 0,
      dropped: droppedCount[0]?.count ?? 0,
      missed: missedCount[0]?.count ?? 0,
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
        state: true,
      } as const;

      const approvedSongs = await db.query.songs.findMany({
        where: eq(songs.state, "approved"),
        orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
        columns: dateColumns,
      });
      const missedSongs = await db.query.songs.findMany({
        where: eq(songs.state, "missed"),
        orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
        columns: dateColumns,
      });

      let droppedSongs: typeof approvedSongs = [];
      const availableSongs = [...approvedSongs, ...missedSongs];
      if (
        (end.compare(start) + 1) * (input.songCount || 1) > availableSongs.length
        || input.songCount === 0
      ) {
        droppedSongs = await db.query.songs.findMany({
          where: eq(songs.state, "dropped"),
          orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
          columns: dateColumns,
        });
      }

      const candidateSongs: ArrangeSong[] = [...availableSongs, ...droppedSongs].map(s => ({
        id: s.id,
        duration: s.duration ?? 0,
        expectedPlayDate: s.expectedPlayDate,
        createdAt: s.createdAt,
        priority: s.state === "missed" ? 0 : s.state === "dropped" ? 2 : 1,
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
        where: and(gte(arrangements.date, input.start), lte(arrangements.date, input.end)),
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
              priority: 0,
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

        const droppedSongRows = result.dropped.length
          ? await db.query.songs.findMany({
            where: inArray(songs.id, result.dropped),
            columns: { id: true, state: true },
          })
          : [];
        // missed 状态的歌曲未排上时保持 missed，不降级为 dropped
        const songsToDrop = droppedSongRows.filter(s => s.state !== "missed").map(s => s.id);
        if (songsToDrop.length > 0) {
          await tx
            .update(songs)
            .set({ state: "dropped", arrangementDate: null, position: null })
            .where(inArray(songs.id, songsToDrop));
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

  getArrangement: protectedProcedure
    .use(requirePermission(["robot"]))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
      }),
    )
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
  listRange: protectedProcedure
    .use(requirePermission(["robot"]))
    .input(
      z.object({
        start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
        end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
      }),
    )
    .query(async ({ input }) => {
      if (input.end < input.start) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "结束日期不能早于开始日期",
        });
      }

      return await db.query.arrangements.findMany({
        where: and(gte(arrangements.date, input.start), lte(arrangements.date, input.end)),
        orderBy: asc(arrangements.date),
        columns: {
          date: true,
          unplayedSongs: true,
          status: true,
        },
        with: {
          songs: {
            orderBy: order,
            columns: {
              id: true,
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

  hasPlayed: protectedProcedure
    .use(requirePermission(["robot"]))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
        songs: z.array(z.number().int().positive()).min(1, "歌曲列表不能为空"),
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
      const { date, songs: songIds, hasPlayed } = input;
      // if (!(await verifyHasPlayedToken(token))) {
      //   throw new TRPCError({
      //     code: "UNAUTHORIZED",
      //     message: "Token 验证失败",
      //   });
      // }
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
              state: "missed",
            })
            .where(eq(songs.id, i.id));
        }
        await db
          .update(arrangements)
          .set({ unplayedSongs: usedSongs.length, status: "missed" })
          .where(eq(arrangements.date, date));
        await invalidateArrangementCache();
        await cacheDel("songMap");
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

      await db
        .update(arrangements)
        .set({ unplayedSongs: foundIds.length, status: "failed" })
        .where(eq(arrangements.date, date));

      await invalidateArrangementCache();
      await cacheDel("songMap");

      return {
        success: true,
        count: foundIds.length,
        processedIds: foundIds,
        notFoundIds,
        message: `成功处理 ${foundIds.length} 首歌曲`,
      };
    }),

  finish: protectedProcedure
    .use(requirePermission(["robot"]))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
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
      const arrangement = await db.query.arrangements.findFirst({
        where: eq(arrangements.date, input.date),
        columns: { date: true },
      });
      if (!arrangement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `指定日期 ${input.date} 的排歌记录不存在`,
        });
      }
      await db
        .update(arrangements)
        .set({ unplayedSongs: 0, status: "success" })
        .where(eq(arrangements.date, input.date));
      await invalidateArrangementCache();
      await cacheDel("songMap");
      return {
        success: true,
        date: input.date,
        message: `成功将 ${input.date} 标记为全部播放完成`,
      };
    }),

  recover: protectedProcedure
    .use(requirePermission(["robot"]))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
        songIds: z.array(z.number()).min(1),
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
      const arrangement = await db.query.arrangements.findFirst({
        where: eq(arrangements.date, input.date),
        columns: { date: true, unplayedSongs: true },
      });
      if (!arrangement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `指定日期 ${input.date} 的排歌记录不存在`,
        });
      }

      // 恢复重试后重新下载成功的歌曲到当天（仅当未被安排到其他日期）
      const restorable = await db.query.songs.findMany({
        where: inArray(songs.id, input.songIds),
        columns: { id: true, arrangementDate: true },
      });
      const restoredIds = restorable
        .filter(s => s.arrangementDate === null || s.arrangementDate === input.date)
        .map(s => s.id);
      if (restoredIds.length > 0) {
        await db
          .update(songs)
          .set({ state: "used", arrangementDate: input.date })
          .where(inArray(songs.id, restoredIds));
      }

      // 扣减未播放数；归零则标记当天为 success，否则保持 failed
      const remaining = Math.max((arrangement.unplayedSongs ?? 0) - restoredIds.length, 0);
      const status = remaining === 0 ? "success" : "failed";
      await db
        .update(arrangements)
        .set({ unplayedSongs: remaining, status })
        .where(eq(arrangements.date, input.date));
      await invalidateArrangementCache();
      await cacheDel("songMap");
      return {
        success: true,
        date: input.date,
        restored: restoredIds.length,
        unplayedSongs: remaining,
        status,
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
