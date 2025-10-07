import { z } from "zod";
import { getAllConfigs, getConfig, updateConfig } from "~~/server/utils/universal";
import { adminProcedure, publicProcedure, requirePermission, router } from "../trpc";

export const configRouter = router({
  get: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return getConfig(input);
    }),
  update: adminProcedure
    .use(requirePermission(["manageUser"]))
    .input(z.object({ key: z.string(), value: z.any() }))
    .mutation(async ({ input }) => {
      await updateConfig(input.key, input.value);
    }),
  getAll: adminProcedure
    .use(requirePermission(["manageUser"]))
    .query(async () => {
      return getAllConfigs();
    }),
});
