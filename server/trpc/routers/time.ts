import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~~/server/db';
import { times } from '~~/server/db/schema';
import { adminProcedure, protectedProcedure, requirePermission, router } from '../trpc';

export async function fitsInTime(t: Date) {
  const list = await db.query.times.findMany({
    columns: {
      isActive: true,
      startAt: true,
      endAt: true,
      repeats: true,
    },
  });

  for (const time of list) {
    if (!time.isActive)
      continue;
    if (!time.repeats) {
      if (t < time.startAt || time.endAt < t)
        continue;
    } else {
      const getDayOfWeek = (date: Date) => {
        return date.getDay() === 0 ? 7 : date.getDay();
      };
      const getTimeNumber = (date: Date) => {
        return getDayOfWeek(date) * 1000000 + 
               date.getHours() * 10000 + 
               date.getMinutes() * 100 + 
               date.getSeconds();
      };

      const startTime = getTimeNumber(time.startAt);
      const endTime = getTimeNumber(time.endAt);
      const currentTime = getTimeNumber(t);

      let inRange = false;
      if (startTime <= endTime) {
        inRange = startTime <= currentTime && currentTime <= endTime;
      } else {
        inRange = currentTime >= startTime || currentTime <= endTime;
      }

      if (!inRange) continue;
    }
    return true;
  }
  return false;
}

export const timeRouter = router({
  create: adminProcedure
    .input(z.object({
      name: z.string(),
      startAt: z.date(),
      endAt: z.date(),
      repeats: z.boolean(),
    }))
    .use(requirePermission(['time']))
    .mutation(async ({ input }) => {
      const id = (
        await db.insert(times).values(input).returning({ id: times.id })
      )?.[0]?.id;
      return id;
    }),

  remove: adminProcedure
    .input(z.number().int())
    .use(requirePermission(['time']))
    .mutation(async ({ input }) => {
      await db.delete(times).where(eq(times.id, input));
    }),

  currently: protectedProcedure
    .query(async () => {
      return await fitsInTime(new Date());
    }),

  listSafe: protectedProcedure
    .query(async () => {
      return await db.query.times.findMany({
        where: eq(times.isActive, true),
        columns: {
          isActive: true,
          startAt: true,
          endAt: true,
          repeats: true,
        },
      });
    }),

  list: adminProcedure
    .use(requirePermission(['time']))
    .query(async () => {
      return await db.query.times.findMany({
        orderBy: asc(times.createdAt),
      });
    }),

  modify: adminProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string(),
      startAt: z.date(),
      endAt: z.date(),
      repeats: z.boolean(),
      isActive: z.boolean(),
    }))
    .use(requirePermission(['time']))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(times).set(data).where(eq(times.id, id));
    }),

  modifyActive: adminProcedure
    .input(z.object({
      id: z.number().int(),
      isActive: z.boolean(),
    }))
    .use(requirePermission(['time']))
    .mutation(async ({ input }) => {
      await db.update(times).set({ isActive: input.isActive }).where(eq(times.id, input.id));
    }),
});
