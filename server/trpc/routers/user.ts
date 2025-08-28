import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { pwRegex, resetPassword } from '~~/constants';
import { db } from '~~/server/db';
import { users } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, publicProcedure, requirePermission, router } from '../trpc';
import type { TPermission } from '~~/types';
import { hasBlockWord } from '~~/server/utils/universal';

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
      password: z.string().min(6, '最少为6个字符').max(16, '最多为16个字符').regex(pwRegex, '密码需包括至少1个字母,1个数字').trim(),
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
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
      pwd: z.string().trim(),
    }))
    .use(requirePermission(['manageUser','deleteUser']))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id === input.id){
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '无法删除自己' });
      }
      if (!(await verifyPassword(ctx.user.password, input.pwd))){
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '密码错误' });
      }
      await db.delete(users).where(eq(users.id, input.id));
  }),
  resetPassword: adminProcedure
    .input(z.object({
      id: z.string(),
      pwd: z.string().trim(),
    }))
    .use(requirePermission(['manageUser']))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id === input.id){
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '请在个人资料中修改你的密码' });
      }
      if (!(await verifyPassword(ctx.user.password, input.pwd))){
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '密码错误' });
      }
      const hashpwd = await hashPassword(resetPassword);
      await db.update(users).set({
        password: hashpwd,
      }).where(eq(users.id, input.id));
    }),

  tokenValidity: protectedProcedure
    .query(() => { }), // protectedProcedure will check if user is logged in

  adminValidity: adminProcedure
    .query(() => {}),

  
  list: adminProcedure
    .use(requirePermission(['manageUser']))
    .query(async () => {
      return await db.query.users.findMany({
        orderBy: desc(users.createdAt),
        with: {
          songs: true,
        }
      })
  }),
  listSongs: adminProcedure
    .use(requirePermission(['manageUser']))
    .query(async () => {
      return await db.query.users.findMany({
        orderBy: desc(users.createdAt),
        columns: {
          id: true,
          name: true,
          displayName: true,
          maxSubmitSongs: true,
          remainSubmitSongs: true,
          createdAt: true,
        },
        with: {
          songs: {
            columns: {
              id: true,
              name: true,
              creator: true,
              ownerDisplayName: true,
              isRealName: true,
              imgId: true,
              source: true,
              message: true,
              rejectMessage: true,
              state: true,
            },
          },
        },
      });
    }),
  listPermission: adminProcedure
    .use(requirePermission(['manageUser','editPermissions']))
    .query(async () => {
      return await db.query.users.findMany({
        orderBy: desc(users.createdAt),
        columns: {
          id: true,
          name: true,
          displayName: true,
          permissions: true,
          createdAt: true,
        }
      })
    }),
  listUser: adminProcedure
    .use(requirePermission(['manageUser']))
    .query(async () => {
      return await db.query.users.findMany({
        orderBy: desc(users.createdAt),
        columns: {
          id: true,
          name: true,
          displayName: true,
        }
      })
    }),

  editPermission: adminProcedure
    .input(z.object({
      id: z.string(),
      permissions: z.custom<TPermission>().array(),
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
  resetRemainSongs: adminProcedure
    .input(z.object({
      id: z.string(),
      maxSongs: z.number().min(0, '输入须大于等于0').max(10, '输入须小于等于10'),
    })
    )
    .use(requirePermission(['manageUser']))
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({ remainSubmitSongs: input.maxSongs })
        .where(eq(users.id, input.id));
    }),
  modifyPassword: protectedProcedure
    .input(z.object({
      oldPassword: z.string(),
      newPassword: z
        .string()
        .min(8, { message: '用户密码长度应至少为8' })
        .regex(pwRegex, '密码必须包含大小写字母、数字与特殊符号'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!await verifyPassword(ctx.user.password!, input.oldPassword))
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '旧密码不正确' });
      if (input.newPassword === input.oldPassword)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '新密码与旧密码相同' });

      await db.update(users)
        .set({
          password: await hashPassword(input.newPassword),
        })
        .where(eq(users.id, ctx.user.id));
    }),
  modifyAlias: protectedProcedure
    .input(z.object({
      alias: z.string().trim().min(1, '最少为1个字符').max(32, '最多为32个字符'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (await hasBlockWord(input.alias)){
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '昵称包含违禁词' });
      }
      const user = await db.query.users.findFirst({
        where: eq(users.displayName, input.alias),
      });
      if (user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '昵称已存在' });
      }
      await db.update(users)
        .set({
          displayName: input.alias,
        })
        .where(eq(users.id, ctx.user.id));
    }),
  updateLoginTime: protectedProcedure.mutation(async ({ ctx }) => {
    await db.update(users)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));
    }),
});
