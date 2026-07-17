import type { TMediaSource, TSubmitType } from "~~/types";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { MAX_DAILY_SONG_DURATION } from "~~/constants";
import { db } from "~~/server/db";
import { arrangements, songs, users } from "~~/server/db/schema";
import { cacheDel, cacheGet, cacheSet } from "~~/server/utils/redis";
import { hasBlockWord } from "~~/server/utils/universal";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  requirePermission,
  router,
} from "../trpc";
import { invalidateArrangementCache } from "./arrangements";
import { fitsInTime } from "./time";

function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

async function checkCanSubmit(remainSongs: number) {
  if (!(await fitsInTime(new Date())))
    return false;
  return remainSongs > 0;
}

export const songRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "请输入歌名").max(128, "歌名长度最大为128"),
        creator: z.string().min(1, "请输入歌手名").max(128, "歌手长度最大128"),
        songId: z.string({ required_error: "请输入歌曲ID" }).optional(),
        source: z.custom<TMediaSource>(),
        imgId: z.string(),
        duration: z.number().positive().min(30, "歌曲长度最小为30秒").max(60 * 10, "歌曲长度最大为10分钟"),
        submitType: z.custom<TSubmitType>(),
        expectedPlayDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD")
          .optional(),
        message: z.string().trim().optional(),
        msgPublic: z.string().trim().optional(),
        customUrl: z.string().trim().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!(await checkCanSubmit(ctx.user.remainSubmitSongs))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "您的剩余提交次数为0,请等5天后重置",
        });
      }

      const content = `${input.message || ""} ${input.msgPublic || ""}`;
      const blockWords = await hasBlockWord(content);
      if (blockWords.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `投稿失败，含有违禁词"${blockWords.join(",")}"` });
      }

      let isRealName = false;
      let displayName = ctx.user.displayName;
      if (input.submitType === "realName") {
        isRealName = true;
        displayName = ctx.user.name!;
      } else if (input.submitType === "anonymous") {
        displayName = "";
      }
      let songId = input.songId ? input.songId.toString() : "";
      if (input.source === "custom") {
        if (!input.customUrl)
          throw new TRPCError({ code: "BAD_REQUEST", message: "请填写歌曲链接" });
        songId = input.customUrl;
      }
      if (!songId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "请输入歌曲ID" });
      }
      const now = new Date();
      await db.insert(songs).values({
        ...input,
        songId,
        ownerId: ctx.user.id,
        isRealName,
        ownerDisplayName: displayName,
        expectedPlayDate: input.expectedPlayDate,
        createdAt: now,
      });
      await db
        .update(users)
        .set({
          remainSubmitSongs: ctx.user.remainSubmitSongs - 1,
          lastSubmitAt: now,
        })
        .where(eq(users.id, ctx.user.id));
      await cacheDel(`listMine:${ctx.user.id}`);
    }),
  deleteMine: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, input.id),
      });
      if (!song)
        throw new TRPCError({ code: "NOT_FOUND", message: "歌曲不存在" });
      if (song.ownerId !== ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "你不能删除他人的歌曲" });
      if (song.state === "used")
        throw new TRPCError({ code: "BAD_REQUEST", message: "该歌曲已被使用" });
      await db.delete(songs).where(eq(songs.id, input.id));
      await cacheDel(`listMine:${ctx.user.id}`);
    }),
  delete: adminProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .use(requirePermission(["review", "deleteSong"]))
    .mutation(async ({ input }) => {
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, input.id),
      });
      if (!song)
        throw new TRPCError({ code: "NOT_FOUND", message: "歌曲不存在" });
      await db.delete(songs).where(eq(songs.id, input.id));
    }),

  list: adminProcedure.use(requirePermission(["review"])).query(async () => {
    return await db.query.songs.findMany({
      orderBy: desc(songs.createdAt),
    });
  }),

  listReview: adminProcedure.use(requirePermission(["review"])).query(async () => {
    return await db.query.songs.findMany({
      where: eq(songs.state, "pending"),
      orderBy: desc(songs.createdAt),
      columns: {
        id: true,
        name: true,
        creator: true,
        songId: true,
        source: true,
        imgId: true,
        duration: true,
        ownerDisplayName: true,
        isRealName: true,
        message: true,
        expectedPlayDate: true,
        createdAt: true,
        state: true,
        rejectMessage: true,
      },
    });
  }),

  listSafe: protectedProcedure.query(async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);// two weeks
    return await db.query.songs.findMany({
      where: or(
        inArray(songs.state, ["pending", "approved", "dropped"]),
        and(
          inArray(songs.state, ["used", "rejected"]),
          gt(songs.createdAt, twoWeeksAgo),
        ),
      ),
      orderBy: [asc(songs.arrangementDate), desc(songs.likeCount), asc(songs.expectedPlayDate), desc(songs.createdAt)],
      columns: {
        id: true,
        name: true,
        creator: true,
        songId: true,
        source: true,
        imgId: true,
        duration: true,
        ownerDisplayName: true,
        isRealName: true,
        state: true,
        likes: true,
        likeCount: true,
        rejectMessage: true,
        arrangementDate: true,
        expectedPlayDate: true,
        createdAt: true,
        msgPublic: true,
      },
    });
  }),

  listGuest: publicProcedure.query(async () => {
    return await db.query.songs.findMany({
      limit: 5,
      orderBy: [desc(songs.createdAt)],
      columns: {
        id: true,
        name: true,
        creator: true,
        source: true,
        imgId: true,
        state: true,
        likeCount: true,
        rejectMessage: true,
        arrangementDate: true,
        createdAt: true,
        msgPublic: true,
      },
    });
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `listMine:${ctx.user.id}`;
    const cachedList = await cacheGet(cacheKey);
    if (cachedList) {
      return JSON.parse(cachedList);
    }
    const list = await db.query.songs.findMany({
      orderBy: desc(songs.createdAt),
      where: eq(songs.ownerId, ctx.user.id),
    });
    await cacheSet(cacheKey, JSON.stringify(list), { EX: 86400 });
    return list;
  }),

  canSubmit: protectedProcedure.query(async ({ ctx }) => {
    return await checkCanSubmit(ctx.user.remainSubmitSongs);
  }),

  remainSubmitSongs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.remainSubmitSongs === ctx.user.maxSubmitSongs) {
      return ctx.user.maxSubmitSongs;
    }

    // Check if it's a new week
    if (getISOWeekNumber(new Date()) - getISOWeekNumber(ctx.user.lastLoginAt) >= 1) {
      await db
        .update(users)
        .set({
          remainSubmitSongs: ctx.user.maxSubmitSongs,
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));
      return ctx.user.maxSubmitSongs;
    }

    // Check if user have submitted songs in the last 5 days
    if (Date.now() - ctx.user.lastSubmitAt.getTime() >= 5 * 24 * 60 * 60 * 1000) {
      await db
        .update(users)
        .set({
          remainSubmitSongs: ctx.user.maxSubmitSongs,
        })
        .where(eq(users.id, ctx.user.id));
      return ctx.user.maxSubmitSongs;
    }

    return ctx.user.remainSubmitSongs;
  }),

  vote: protectedProcedure.input(z.number()).mutation(async ({ input: id, ctx }) => {
    const song = await db.query.songs.findFirst({
      where: eq(songs.id, id),
    });
    if (!song)
      throw new TRPCError({ code: "NOT_FOUND", message: "歌曲不存在" });
    if (song.likes.includes(ctx.user.id))
      throw new TRPCError({ code: "BAD_REQUEST", message: "您已点过赞" });
    await db
      .update(songs)
      .set({
        likes: [...song.likes, ctx.user.id],
        likeCount: song.likeCount + 1,
      })
      .where(eq(songs.id, id));
    if (song.ownerId === ctx.user.id) {
      await cacheDel(`listMine:${ctx.user.id}`);
    }
  }),

  disvote: protectedProcedure.input(z.number()).mutation(async ({ input: id, ctx }) => {
    const song = await db.query.songs.findFirst({
      where: eq(songs.id, id),
    });
    if (!song)
      throw new TRPCError({ code: "NOT_FOUND", message: "歌曲不存在" });
    if (!song.likes.includes(ctx.user.id))
      throw new TRPCError({ code: "BAD_REQUEST", message: "您没有点赞此歌曲" });
    await db
      .update(songs)
      .set({
        likes: song.likes.filter(like => like !== ctx.user.id),
        likeCount: song.likeCount - 1,
      })
      .where(eq(songs.id, id));
    if (song.ownerId === ctx.user.id) {
      await cacheDel(`listMine:${ctx.user.id}`);
    }
  }),

  idToName: protectedProcedure.input(z.array(z.string())).query(async ({ input }) => {
    const list = [];
    for (const id of input) {
      list.push((await getUserDetailById(id)).name);
    }
    return list;
  }),

  review: router({
    approve: adminProcedure
      .input(
        z.object({
          id: z.number(),
        }),
      )
      .use(requirePermission(["review"]))
      .mutation(async ({ input }) => {
        // check if song exists and is pending
        const song = await db.query.songs.findFirst({
          where: eq(songs.id, input.id),
          columns: {
            id: true,
            state: true,
            duration: true,
            expectedPlayDate: true,
            createdAt: true,
          },
        });
        if (!song)
          throw new TRPCError({ code: "NOT_FOUND", message: "歌曲不存在" });
        if (song.state !== "pending")
          throw new TRPCError({ code: "BAD_REQUEST", message: "歌曲已被审核" });
        // if hasn't expectedPlayDate, just approve it
        if (!song.expectedPlayDate) {
          await db.update(songs).set({ state: "approved" }).where(eq(songs.id, input.id));
          return;
        }
        // if has expectedPlayDate
        const date = song.expectedPlayDate;
        const existingArrangement = await db.query.arrangements.findFirst({
          where: eq(arrangements.date, date),
          with: {
            songs: {
              columns: {
                id: true,
                duration: true,
                position: true,
                createdAt: true,
                expectedPlayDate: true,
              },
            },
          },
        });

        const existingSongs = existingArrangement?.songs ?? [];
        const currentSong = {
          id: song.id,
          duration: song.duration ?? 0,
          position: -1,
          createdAt: song.createdAt,
          expectedPlayDate: song.expectedPlayDate,
        };
        const slotSongs = [...existingSongs, currentSong].sort(
          (a, b) => {
            // if expectedPlayDate===date, put it last, otherwise put it first
            // if both expectedPlayDate!==date, keep the order
            const cmp = Number(a.expectedPlayDate === date) - Number(b.expectedPlayDate === date);
            if (cmp !== 0)
              return cmp;
            return a.createdAt.getTime() - b.createdAt.getTime();
          },
        );

        const removedIds: number[] = [];
        while (slotSongs.reduce((sum, s) => sum + (s.duration ?? 0), 0) > MAX_DAILY_SONG_DURATION) {
          const last = slotSongs.pop();
          if (!last)
            break;
          if (!last?.expectedPlayDate) {
            slotSongs.push(last);
            break;
          }
          if (last.id === input.id) {
            // 当前歌曲提交时间最晚，无法安排，保持 approved 状态
            await db.transaction(async (tx) => {
              for (const removedId of removedIds) {
                await tx
                  .update(songs)
                  .set({ state: "approved", arrangementDate: null, position: null })
                  .where(eq(songs.id, removedId));
              }
              await tx
                .update(songs)
                .set({ state: "approved", arrangementDate: null, position: null })
                .where(eq(songs.id, input.id));
            });
            await invalidateArrangementCache();
            return;
          }
          removedIds.push(last.id);
        }
        slotSongs.sort((a, b) => {
          // let songs with expectedPlayDate===date first
          const cmp = Number(b.expectedPlayDate === date) - Number(a.expectedPlayDate === date);
          if (cmp !== 0)
            return cmp;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
        await db.transaction(async (tx) => {
          if (!existingArrangement) {
            await tx.insert(arrangements).values({ date });
          }
          for (let i = 0; i < slotSongs.length; i++) {
            await tx
              .update(songs)
              .set({ state: "used", arrangementDate: date, position: i + 1 })
              .where(eq(songs.id, slotSongs[i]!.id));
          }
          for (const removedId of removedIds) {
            await tx
              .update(songs)
              .set({ state: "approved", arrangementDate: null, position: null })
              .where(eq(songs.id, removedId));
          }
        });

        await invalidateArrangementCache();
      }),

    reject: adminProcedure
      .input(
        z.object({
          id: z.number(),
          rejectMessage: z.string().min(4, "拒绝理由不得小于4个字符"),
        }),
      )
      .use(requirePermission(["review"]))
      .mutation(async ({ input }) => {
        await db
          .update(songs)
          .set({
            state: "rejected",
            rejectMessage: input.rejectMessage,
          })
          .where(eq(songs.id, input.id));
      }),

    acceptAll: adminProcedure.use(requirePermission(["review"])).mutation(async () => {
      await db
        .update(songs)
        .set({
          state: "approved",
        })
        .where(eq(songs.state, "pending"));
    }),
  }),
});
