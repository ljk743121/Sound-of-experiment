import { parseDate } from "@internationalized/date";
import { TRPCError } from "@trpc/server";
import { consola } from "consola";
// eslint-disable-next-line unused-imports/no-unused-imports
import { asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { arrangements, songs } from "~~/server/db/schema";
import { cacheGet, cacheSet } from "~~/server/utils/redis";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  requirePermission,
  router,
} from "../trpc";
// import { fitsInTime } from "./time";

const order = [asc(songs.position), asc(songs.createdAt)];

async function invalidateArrangementCache() {
  await cacheDel("arrangement:listSafe");
  await cacheDel("arrangement:listGuest");
  consola.info(`Redis 缓存失效：arrangement:listSafe, arrangement:listGuest`);
}

async function reviewAll() {
  return (
    (
      await db.query.songs.findMany({
        where: eq(songs.state, "pending"),
        columns: { id: true },
      })
    ).length === 0
  );
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
        orderBy: desc(songs.createdAt),
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
      await db.transaction(async (tx) => {
        for (const dayChange of input) {
          if (dayChange.date === "approved") {
            for (const songId of dayChange.songOrder) {
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
    const AgoString = Ago.toISOString().split("T")[0];

    const arrangementsData = await db.query.arrangements.findMany({
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
    const AgoString = Ago.toISOString().split("T")[0];

    const arrangementsData = await db.query.arrangements.findMany({
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

  reviewAll: adminProcedure.use(requirePermission(["arrange"])).query(async () => {
    return await reviewAll();
  }),

  arrange: adminProcedure
    .use(requirePermission(["arrange"]))
    .input(
      z.object({
        start: z.string(),
        end: z.string(),
        songCount: z.number().int(),
      }),
    )
    .mutation(async ({ input }) => {
      // if (!(await reviewAll()))
      //   throw new TRPCError({ code: "FORBIDDEN", message: "请审核全部歌曲" });

      // if (await fitsInTime(new Date()))
      //   throw new TRPCError({ code: "FORBIDDEN", message: "请在投稿截止后排歌" });

      const start = parseDate(input.start);
      const end = parseDate(input.end);

      const dayTimes = end.compare(start) + 1;

      // get unused songs
      const approvedSongs = await db.query.songs.findMany({
        where: eq(songs.state, "approved"),
        orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
        columns: {
          id: true,
        },
      });

      // get dropped songs
      let droppedSongs: typeof approvedSongs = [];
      // (only when insufficient unused songs is present)
      if (
        (end.compare(start) + 1) * input.songCount > approvedSongs.length
        || input.songCount === 0
      ) {
        droppedSongs = await db.query.songs.findMany({
          where: eq(songs.state, "dropped"),
          orderBy: [desc(songs.likeCount), asc(songs.createdAt)],
          columns: {
            id: true,
          },
        });
      }

      const totalLength = approvedSongs.length + droppedSongs.length;
      // throw new TRPCError({ code:'BAD_REQUEST', message: `已选择${totalLength}首歌曲`})
      if (totalLength === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "没有歌曲可播放",
        });
      }

      await db.transaction(async (tx) => {
        let songIndex = 0;
        let droppedSongIndex = 0;
        let songCount = input.songCount === 0 ? Math.ceil(totalLength / dayTimes) : input.songCount;
        for (let date = start; date.compare(end) <= 0; date = date.add({ days: 1 })) {
          const dateString = date.toString();
          const pre = await tx.query.arrangements.findFirst({
            where: eq(arrangements.date, dateString),
            with: {
              songs: {
                orderBy: order,
                columns: {
                  id: true,
                  likeCount: true,
                  createdAt: true,
                },
              },
            },
          });
          if (!pre && songIndex + droppedSongIndex < totalLength)
            await tx.insert(arrangements).values({ date: dateString });

          const pre_len = pre?.songs?.length ?? 0;

          for (let i = 0; i < songCount; i++) {
            if (songIndex < approvedSongs.length) {
              await tx
                .update(songs)
                .set({
                  arrangementDate: dateString,
                  state: "used",
                  position: pre_len + 1 + i,
                })
                .where(eq(songs.id, approvedSongs[songIndex]!.id));

              songIndex++;
            } else if (droppedSongIndex < droppedSongs.length) {
              // recover dropped songs
              await tx
                .update(songs)
                .set({
                  arrangementDate: dateString,
                  state: "used",
                  position: pre_len + 1 + i,
                })
                .where(eq(songs.id, droppedSongs[droppedSongIndex]!.id));

              droppedSongIndex++;
            }
          }

          if (input.songCount === 0) {
            songCount
              = totalLength - songCount >= 0
                ? Math.ceil((totalLength - songCount) / (dayTimes - 1))
                : 0;
          }
        }

        // Drop extra songs
        while (songIndex < approvedSongs.length) {
          await tx
            .update(songs)
            .set({ state: "dropped" })
            .where(eq(songs.id, approvedSongs[songIndex]!.id));

          songIndex++;
        }
      });
      await invalidateArrangementCache();
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
    const today = new Date().toISOString().split("T")[0];
    const arrangement = await db.query.arrangements.findFirst({
      where: eq(arrangements.date, today),
      columns: {
        date: true,
      },
      with: {
        songs: {
          orderBy: [asc(songs.position), desc(songs.createdAt)],
          columns: {
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
  delete: adminProcedure
    .use(requirePermission(["arrange", "deleteArrangement"]))
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
      }),
    )
    .mutation(async ({ input }) => {
      const usedSongs = await db.query.songs.findMany({
        where: eq(songs.arrangementDate, input.date),
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
      await db.delete(arrangements).where(eq(arrangements.date, input.date));
      await invalidateArrangementCache();
    }),
});
