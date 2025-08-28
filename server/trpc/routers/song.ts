import { TRPCError } from '@trpc/server';
import { desc, eq, gt, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~~/server/db';
import { songs, users } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, publicProcedure, requirePermission, router } from '../trpc';
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

async function checkCanSubmit(remainSongs: number) {
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
      source: z.custom<TMediaSource>(),
      imgId: z.string(),
      duration: z.number().positive(),
      submitType: z.custom<TSubmitType>(),
      message: z.string().trim().optional(),
      msgPublic: z.string().trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!(await checkCanSubmit(ctx.user.remainSubmitSongs)))
        throw new TRPCError({ code: 'BAD_REQUEST', message: '您的剩余提交次数为0,请等5天后重置' });

      const content = `${input.name} ${input.creator} ${input.message || ''} ${input.msgPublic || ''}`;
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
      const now = new Date();
      await db.insert(songs).values({
        ...input,
        songId: input.songId.toString(),
        ownerId: ctx.user.id,
        isRealName,
        ownerDisplayName: displayName,
        createdAt: now,
      });
      await db
        .update(users)
        .set({
          remainSubmitSongs: (ctx.user.remainSubmitSongs - 1),
          lastSubmitAt: now,
        })
        .where(eq(users.id, ctx.user.id));
    }),
  deleteMine: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, input.id),
      });
      if (!song) throw new TRPCError({ code: 'NOT_FOUND', message: '歌曲不存在' })
      if (song.ownerId !== ctx.user.id) throw new TRPCError({ code: 'BAD_REQUEST', message: '你不能删除他人的歌曲' });
      if (song.state === 'used') throw new TRPCError({ code: 'BAD_REQUEST', message: '该歌曲已被使用' });
      await db.delete(songs).where(eq(songs.id, input.id));
    }),
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .use(requirePermission(['review','deleteSong']))
    .mutation(async ({ input, ctx }) => {
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, input.id),
      });
      if (!song) throw new TRPCError({ code: 'NOT_FOUND', message: '歌曲不存在' })
      await db.delete(songs).where(eq(songs.id, input.id));
    }),

  list: adminProcedure
    .use(requirePermission(['review']))
    .query(async () => {
      return await db.query.songs.findMany({
        orderBy: desc(songs.createdAt),
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
        where: gt(songs.createdAt, new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)), // One month
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
          likes: true,
          rejectMessage: true,
          arrangementDate: true,
          createdAt: true,
          msgPublic: true,
        },
      });
    }),

  listGuest: publicProcedure
    .query(async () => { 
      return await db.query.songs.findMany({
        where: gt(songs.createdAt, new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)),
        orderBy: desc(songs.createdAt),
        columns: { 
          id: true,
          name: true,
          creator: true,
          source: true,
          imgId: true,
          state: true,
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
      return await checkCanSubmit(ctx.user.remainSubmitSongs);
    }),

  remainSubmitSongs: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.remainSubmitSongs===ctx.user.maxSubmitSongs){
        return ctx.user.maxSubmitSongs;
      }

      // Check if it's a new week
      if ((getISOWeekNumber(new Date()) - getISOWeekNumber(ctx.user.lastLoginAt)) >= 1) {
        await db
          .update(users)
          .set({
            remainSubmitSongs: (ctx.user.maxSubmitSongs),
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
  
  vote: protectedProcedure
    .input(
      z.number()
    )
    .mutation(async ({ input: id, ctx }) => { 
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, id),
      });
      if (!song) throw new TRPCError({ code: 'NOT_FOUND', message: '歌曲不存在' });
      if (song.likes.includes(ctx.user.id)) throw new TRPCError({ code: 'BAD_REQUEST', message: '您已点过赞' });
      await db.update(songs)
        .set({
          likes: [...song.likes, ctx.user.id],
        })
        .where(eq(songs.id, id));
    }),

  disvote: protectedProcedure
    .input(
      z.number()
    )
    .mutation(async ({ input: id, ctx }) => { 
      const song = await db.query.songs.findFirst({
        where: eq(songs.id, id),
      });
      if (!song) throw new TRPCError({ code: 'NOT_FOUND', message: '歌曲不存在' });
      if (!song.likes.includes(ctx.user.id)) throw new TRPCError({ code: 'BAD_REQUEST', message: '您没有点赞此歌曲' });
      await db.update(songs)
        .set({
          likes: song.likes.filter(like => like !== ctx.user.id),
        })
        .where(eq(songs.id, id));
    }),

  idToName: protectedProcedure
    .input(
      z.array(z.string())
    )
    .query(async ({ input }) => { 
      let list = [];
      console.log(input)
      for (const id of input){
        list.push((await getUserDetailById(id)).name)
      }
      return list;
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
