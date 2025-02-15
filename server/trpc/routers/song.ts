import { TRPCError } from '@trpc/server';
import { desc, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~~/server/db';
import { songs, users } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, requirePermission, router } from '../trpc';
import { fitsInTime } from './time';

function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

async function checkCanSubmit(userId: string) {
  if (!(await fitsInTime(new Date())))
    return false;

  const latestSubmission = await db.query.songs.findFirst({
    where: eq(songs.ownerId, userId),
    orderBy: desc(songs.createdAt),
  });

  // no submission
  if (!latestSubmission)
    return true;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      remainSubmitSongs: true,
      maxSubmitSongs: true,
    },
  });
  if ((getISOWeekNumber(new Date()) - getISOWeekNumber(latestSubmission.createdAt!)) >= 1) {
    await db.update(users).set({
      remainSubmitSongs: (user!.maxSubmitSongs),
    }).where(eq(users.id, userId));
    return true;
  }
  return (user!.remainSubmitSongs > 0);
}

export const songRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string()
        .min(1, '请输入歌名')
        .max(50, '歌名长度最大为50'),
      creator: z.string()
        .min(1, '请输入歌手名')
        .max(20, '歌手长度最大为20'),
      submitType: z.enum(['realName', 'anonymous']).refine(
        val => (val === 'anonymous' || val === 'realName'),
        '请选择提交方式',
      ),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!(await checkCanSubmit(ctx.user.id)))
        throw new TRPCError({ code: 'BAD_REQUEST', message: '您的剩余提交次数为0,请等5天后重置' });

      const chinese = `${input.name} ${input.creator} ${input.message}`.match(/[\u4E00-\u9FA5]+/g);
      const english = `${input.name} ${input.creator} ${input.message}`.match(/[\da-zA-Z]+/g);

      const blockWords = await db.query.blockWords.findMany();
      if (chinese?.some(x => blockWords.some(y => x.includes(y.word))))
        throw new TRPCError({ code: 'BAD_REQUEST', message: '投稿失败' });
      if (english?.some(x => blockWords.some(y => x === y.word)))
        throw new TRPCError({ code: 'BAD_REQUEST', message: '投稿失败' });
      let isRealName = false;
      let displayName = '';
      if (input.submitType === 'realName') {
        isRealName = true;
        displayName = ctx.user.name!;
      } else if (input.submitType === 'anonymous') {
        displayName = 'anonymous';
      }
      await db.insert(songs).values({
        ...input,
        ownerId: ctx.user.id,
        isRealName,
        ownerDisplayName: displayName,
      });
      await db
        .update(users)
        .set({
          remainSubmitSongs: (ctx.user.remainSubmitSongs - 1),
        })
        .where(eq(users.id, ctx.user.id));
    }),

  list: adminProcedure
    .use(requirePermission(['review']))
    .query(async () => {
      return await db.query.songs.findMany({
        orderBy: desc(songs.createdAt),
        columns: {
          id: true,
          name: true,
          creator: true,
          ownerDisplayName: true,
          isRealName: true,
          message: true,
          createdAt: true,
          state: true,
          rejectMessage: true,
        },
      });
    }),

  listReview: adminProcedure
    .use(requirePermission(['review']))
    .query(async () => {
      return await db.query.songs.findMany({
        where: eq(songs.state, 'pending'),
        orderBy: desc(songs.createdAt),
        columns: {
          id: true,
          name: true,
          creator: true,
          ownerDisplayName: true,
          isRealName: true,
          message: true,
          createdAt: true,
          state: true,
          rejectMessage: true,
        },
      });
    }),

  listSafe: protectedProcedure
    .query(async () => {
      return await db.query.songs.findMany({
        where: gt(songs.createdAt, new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), // One week
        orderBy: desc(songs.createdAt),
        columns: {
          id: true,
          name: true,
          creator: true,
          ownerDisplayName: true,
          isRealName: true,
          state: true,
          rejectMessage: true,
          arrangementDate: true,
          createdAt: true,
        },
      });
    }),

  listMine: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.query.songs.findMany({
        orderBy: desc(songs.createdAt),
        where: eq(songs.ownerId, ctx.user.id),
      });
    }),

  canSubmit: protectedProcedure
    .query(async ({ ctx }) => {
      return await checkCanSubmit(ctx.user.id);
    }),

  remainSubmitSongs: protectedProcedure
    .query(async ({ ctx }) => {
      const latestSubmission = await db.query.songs.findFirst({
        where: eq(songs.ownerId, ctx.user.id),
        orderBy: desc(songs.createdAt),
      });
      const maxSongs = ctx.user.maxSubmitSongs;
      if (!latestSubmission)
        return ctx.user.remainSubmitSongs;
      if (Date.now() - latestSubmission.createdAt.getTime() >= 5 * 24 * 60 * 60 * 1000) {
        await db
          .update(users)
          .set({
            remainSubmitSongs: maxSongs,
          })
          .where(eq(users.id, ctx.user.id));
        return maxSongs;
      }
      return ctx.user.remainSubmitSongs;
    }),

  review: router({
    approve: adminProcedure
      .input(z.object({
        id: z.number(),
      }))
      .use(requirePermission(['review']))
      .mutation(async ({ input }) => {
        await db
          .update(songs)
          .set({ state: 'approved' })
          .where(eq(songs.id, input.id));
      }),

    reject: adminProcedure
      .input(z.object({
        id: z.number(),
        rejectMessage: z.string().min(4, '拒绝理由不得小于4个字符'),
      }))
      .use(requirePermission(['review']))
      .mutation(async ({ input }) => {
        await db
          .update(songs)
          .set({
            state: 'rejected',
            rejectMessage: input.rejectMessage,
          })
          .where(eq(songs.id, input.id));
      }),
  }),

  qqSearch: adminProcedure
    .input(z.object({
      key: z.string(),
    }))
    .use(requirePermission(['review']))
    .query(async ({ input }) => {
      const searchBaseURL = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';

      interface TSearchDataItem {
        albummid: string;
        singer: { name: string }[];
        songmid: string;
        songname: string;
      }

      interface TSearchResponse {
        code: number;
        data: {
          song: {
            list: TSearchDataItem[];
          };
        };
      }

      const res = await $fetch<TSearchResponse>(searchBaseURL, {
        method: 'GET',
        params: {
          w: input.key,
          n: 5,
          format: 'json',
        },
        parseResponse(responseText) {
          try {
            return JSON.parse(responseText);
          } catch {
            return responseText;
          }
        },
      });

      const songList = res.data.song.list.map(item => ({
        mid: item.songmid,
        name: item.songname,
        singer: item.singer.map(singer => singer.name).join(', ').trim(),
        pic: `https://y.qq.com/music/photo_new/T002R300x300M000${item.albummid}.jpg`,
      }));
      return songList;
    }),
});
