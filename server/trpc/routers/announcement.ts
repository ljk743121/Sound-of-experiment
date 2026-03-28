import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~~/server/db";
import { announcement } from "~~/server/db/schema";
import { adminProcedure, protectedProcedure, requirePermission, router } from "../trpc";

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
    }),

  list: adminProcedure.use(requirePermission(["announcement"])).query(async () => {
    return await db.query.announcement.findMany({
      orderBy: desc(announcement.createdAt),
    });
  }),

  listSafe: protectedProcedure.query(async () => {
    return await db.query.announcement.findMany({
      where: eq(announcement.visible, "all"),
      orderBy: desc(announcement.createdAt),
      columns: {
        createdAt: true,
        markdown: true,
        creatorName: true,
        type: true,
      },
    });
  }),

  listAdmin: adminProcedure.query(async () => {
    return await db.query.announcement.findMany({
      where: eq(announcement.visible, "admin"),
      orderBy: desc(announcement.createdAt),
    });
  }),

  remove: adminProcedure
    .use(requirePermission(["announcement"]))
    .input(z.number())
    .mutation(async ({ input }) => {
      await db.delete(announcement).where(eq(announcement.id, input));
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
