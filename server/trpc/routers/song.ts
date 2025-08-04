import { TRPCError } from '@trpc/server';
import { desc, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~~/server/db';
import { songs, users } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, requirePermission, router } from '../trpc';
import { fitsInTime } from './time';
import { hasBlockWord } from '~~/server/utils/universal';
import { TMediaSource, TSubmitType } from '~~/types';

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

async function checkCanSubmit(userId: string, remainSongs: number) {
  if (!(await fitsInTime(new Date())))
    return false;
  return remainSongs > 0;
}

export const songRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string()
        .min(1, '请输入歌名')
        .max(128, '歌名长度最大为128'),
      creator: z.string()
        .min(1, '请输入歌手名')
        .max(128, '歌手长度最大128'),
      songId: z.string({ required_error: '请输入歌曲ID' }),
      source: z.custom<TMediaSource>(),// adapt more sources
      imgId: z.string(),
      duration: z.number().positive(),
      submitType: z.custom<TSubmitType>(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!(await checkCanSubmit(ctx.user.id, ctx.user.remainSubmitSongs)))
        throw new TRPCError({ code: 'BAD_REQUEST', message: '您的剩余提交次数为0,请等5天后重置' });

      const content = `${input.name} ${input.creator} ${input.message || ''}`;
      if (await hasBlockWord(content)){
        throw new TRPCError({ code: 'BAD_REQUEST', message: '投稿失败，含有违禁词' });
      }
      
      let isRealName = false;
      let displayName = ctx.user.displayName;
      if (input.submitType === 'realName') {
        isRealName = true;
        displayName = ctx.user.name!;
      } else if (input.submitType === 'anonymous') {
        displayName = '';
      }
      await db.insert(songs).values({
        ...input,
        songId: input.songId.toString(),
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
          songId: true,
          source: true,
          imgId: true,
          duration: true,
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
          songId: true,
          source: true,
          imgId: true,
          duration: true,
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
          songId: true,
          source: true,
          imgId: true,
          duration: true,
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
      return await checkCanSubmit(ctx.user.id, ctx.user.remainSubmitSongs);
    }),

  remainSubmitSongs: protectedProcedure
    .query(async ({ ctx }) => {
      const latestSubmission = await db.query.songs.findFirst({
        where: eq(songs.ownerId, ctx.user.id),
        orderBy: desc(songs.createdAt),
      });
      if (!latestSubmission)
        return ctx.user.remainSubmitSongs;

      // Check if it's a new week
      if ((getISOWeekNumber(new Date()) - getISOWeekNumber(latestSubmission.createdAt!)) >= 1) {
        await db
          .update(users)
          .set({
            remainSubmitSongs: (ctx.user!.maxSubmitSongs),
          })
          .where(eq(users.id, ctx.user.id));
      }
      // Check if user have submitted songs in the last 5 days
      if (Date.now() - latestSubmission.createdAt.getTime() >= 5 * 24 * 60 * 60 * 1000) {
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

    acceptAll: adminProcedure
      .use(requirePermission(['review']))
      .mutation(async () => {
        await db
          .update(songs)
          .set({
            state: 'approved',
          })
          .where(eq(songs.state, 'pending'));
      }),
  }),
});
