import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~~/server/db';
import { users } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, publicProcedure, requirePermission, router } from '../trpc';

export const userRouter = router({
  login: publicProcedure
    .input(z.object({
      id: z.string().length(7, '校园卡号为7位数字').regex(/\d+/, '输入必须为数字').trim(),
      password: z.string().min(6, '最少为6个字符').max(16, '最多为16个字符').trim(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      // make sure registration is successful
      if (!user)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '登录失败' });

      if (!(await verifyPassword(user.password!, input.password)))
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '登录失败' });

      // banned
      if (!user.permissions.includes('login'))
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '无法登录' });

      const accessToken = await produceAccessToken(user.id);
      return {
        ...user,
        accessToken,
      };
    }),
  register: publicProcedure
    .input(z.object({
      id: z.string().length(7, '校园卡号为7位数字').regex(/\d+/, '输入必须为数字').trim(),
      username: z.string().min(2, '最少为2个字符').max(7, '最多为7个字符').regex(/[一-龥]+/, '输入必须为汉字').trim(),
      // displayName: z.string(),
      password: z.string().min(6, '最少为6个字符').max(16, '最多为16个字符').regex(/.*(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*/, '密码需包括至少1个大写字母,1个小写字母,1个数字,1个特殊字符').trim(),
    }))
    .mutation(async ({ input }) => {
      let user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      // auto register
      if (!user) {
        const hashpwd = await hashPassword(input.password);
        user = (
          await db
            .insert(users)
            .values({
              id: input.id,
              name: input.username,
              // displayName: input.displayName,
              password: hashpwd,
              permissions: ['login'],
            })
            .returning()
        )[0];
      } else {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '用户已存在' });
      }

      // make sure registration is successful
      if (!user)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '注册成功,登录失败' });

      // banned
      if (!user.permissions.includes('login'))
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '注册成功，无法登录' });

      const accessToken = await produceAccessToken(user.id);
      return {
        ...user,
        accessToken,
      };
    }),
  tokenValidity: protectedProcedure
    .query(() => { }), // protectedProcedure will check if user is logged in

  list: adminProcedure
    .use(requirePermission(['manageUser']))
    .query(async () => {
      return await db.query.users.findMany({
        orderBy: desc(users.createdAt),
        with: {
          songs: {
            columns: {
              id: true,
              name: true,
              creator: true,
              message: true,
              state: true,
            },
          },
        },
      });
    }),

  editPermission: adminProcedure
    .input(z.object({
      id: z.string(),
      permissions: z.enum(['login', 'admin', 'review', 'arrange', 'manageUser', 'time', 'blockWords']).array(),
    }))
    .use(requirePermission(['manageUser']))
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({ permissions: input.permissions })
        .where(eq(users.id, input.id));
    }),
  editMaxSongs: adminProcedure
    .input(z.object({
      id: z.string(),
      maxSongs: z.number().min(0, '输入须大于等于0').max(10, '输入须小于等于10'),
    }))
    .use(requirePermission(['manageUser']))
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({ maxSubmitSongs: input.maxSongs })
        .where(eq(users.id, input.id));
    }),
});
