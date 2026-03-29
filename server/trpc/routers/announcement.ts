import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { announcement } from "~~/server/db/schema";
import { redis } from "~~/server/utils/redis";
import { adminProcedure, protectedProcedure, requirePermission, router } from "../trpc";

const cacheKey = "announcement:listSafe";
const cacheKeyAdmin = "announcement:listAdmin";

export const announcementRouter = router({
  create: adminProcedure
    .use(requirePermission(["announcement"]))
    .input(
      z.object({
        markdown: z.string().min(1),
        visible: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db.insert(announcement).values({
        markdown: input.markdown,
        creatorId: ctx.user.id,
        creatorName: ctx.user.displayName || ctx.user.name,
        visible: input.visible,
      });
      redis.del(cacheKey);
      redis.del(cacheKeyAdmin);
    }),

  list: adminProcedure.use(requirePermission(["announcement"])).query(async () => {
    return await db.query.announcement.findMany({
      orderBy: desc(announcement.createdAt),
    });
  }),

  listSafe: protectedProcedure.query(async () => {
    const cachedList = await redis.get(cacheKey);
    if (cachedList) {
      if (cachedList) {
        return JSON.parse(cachedList);
      }
    }
    const list = await db.query.announcement.findMany({
      where: eq(announcement.visible, "all"),
      orderBy: desc(announcement.createdAt),
      columns: {
        createdAt: true,
        markdown: true,
        creatorName: true,
        type: true,
      },
    });
    await redis.set(cacheKey, JSON.stringify(list), { EX: 604800 });
    return list;
  }),

  listAdmin: adminProcedure.query(async () => {
    const cachedList = await redis.get(cacheKeyAdmin);
    if (cachedList) {
      if (cachedList) {
        return JSON.parse(cachedList);
      }
    }
    const list = await db.query.announcement.findMany({
      where: eq(announcement.visible, "admin"),
      orderBy: desc(announcement.createdAt),
      columns: {
        createdAt: true,
        markdown: true,
        creatorName: true,
        type: true,
      },
    });
    await redis.set(cacheKeyAdmin, JSON.stringify(list), { EX: 604800 });
    return list;
  }),

  remove: adminProcedure
    .use(requirePermission(["announcement"]))
    .input(z.number())
    .mutation(async ({ input }) => {
      await db.delete(announcement).where(eq(announcement.id, input));
      redis.del(cacheKey);
      redis.del(cacheKeyAdmin);
    }),

  update: adminProcedure
    .use(requirePermission(["announcement"]))
    .input(
      z.object({
        id: z.number(),
        markdown: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updateList = await db.query.announcement.findFirst({
        where: eq(announcement.id, input.id),
      });
      if (!updateList)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.id !== updateList.creatorId)
        throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(announcement)
        .set({
          markdown: input.markdown,
        })
        .where(eq(announcement.id, input.id));
      redis.del(cacheKey);
      redis.del(cacheKeyAdmin);
    }),

  getHash: protectedProcedure.query(async () => {
    const latestAnnouncements = await db.query.announcement.findMany({
      where: eq(announcement.visible, "all"),
      orderBy: desc(announcement.createdAt),
      columns: {
        createdAt: true,
        id: true,
      },
    });

    if (!latestAnnouncements) {
      return { hash: "" };
    }

    const combinedString = latestAnnouncements.map(ann =>
      `${ann.id}-${ann.createdAt.toISOString()}`,
    ).join("|");
    const hash = createHash("sha256").update(combinedString).digest("hex");
    return { hash };
  }),
});
