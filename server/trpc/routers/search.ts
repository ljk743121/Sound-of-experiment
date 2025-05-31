import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as searchApi from '~~/server/utils/song';
import { protectedProcedure, requirePermission, router } from '../trpc';

export const searchRouter = router({
  mixSearch: protectedProcedure
    .input(z.object({
      key: z.string(),
      source: z.string(),
      type: z.enum(['search', 'id']),
    }))
    .query(async ({ input }) => {
      if (input.source === 'wy') {
        return await searchApi.searchSongsWy(input.key, input.type);
      } else if (input.source === 'tx') {
        return await searchApi.searchSongsQQ(input.key, input.type);
      } else {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '未知的源' });
      }
    }),
  mixGetUrl: protectedProcedure
    .input(z.object({
      id: z.string(),
      source: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (!input.id)
        throw new TRPCError({ code: 'BAD_REQUEST', message: '缺少ID参数' });
      let url = '';
      if (input.source === 'wy') {
        try {
          url = await searchApi.getSongUrlWy(input.id);
        } catch (e: any) {
          if (e.message === '歌曲为VIP歌曲') {
            url = await searchApi.getSongUrlWyVip(input.id, ctx.user);
          } else {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `获取歌曲链接失败:${e.message}` });
          }
        }
      } else if (input.source === 'tx') {
        try {
          url = await searchApi.getSongUrlQQ(input.id);
        } catch (e: any) {
          if (e.message === '歌曲为VIP歌曲') {
            url = await searchApi.getSongUrlQQVip(input.id, ctx.user);
          } else {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `获取歌曲链接失败:${e.message}` });
          }
        }
      } else {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '未知的源' });
      }
      if (!url)
        throw new TRPCError({ code: 'BAD_REQUEST', message: '歌曲链接为空' });
      return url;
    }),
});
