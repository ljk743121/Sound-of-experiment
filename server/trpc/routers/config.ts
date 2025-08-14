import { z } from 'zod';
import { env } from '~~/server/env';
import { TRPCError } from '@trpc/server';
import { get } from '@vercel/edge-config'
import { adminProcedure, protectedProcedure, publicProcedure, requirePermission, router } from '../trpc';

export const configRouter = router({
  get: publicProcedure.input(
    z.string()
  ).mutation(async ({ ctx, input }) => {
    const value = await get(input);
    return value;
  }),
  update: adminProcedure
    .use(requirePermission(['manageUser']))
    .input(z.object({ key: z.string(), value: z.any() }))
    .mutation(async ({ ctx, input }) => {
      if (!(env.EDGE_CONFIG_TOKEN && env.EDGE_CONFIG_ID)){
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '未配置边缘配置',
        });
      }
      try {
        const updateEdgeConfig = await fetch(
          `https://api.vercel.com/v1/edge-config/${env.EDGE_CONFIG_ID}/items`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.EDGE_CONFIG_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: [
                {
                  operation: 'update',
                  key: input.key,
                  value: input.value,
                },
              ],
            }),
          },
        );
        await updateEdgeConfig.json();
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '更新边缘配置失败',
        });
      }
    }),
})