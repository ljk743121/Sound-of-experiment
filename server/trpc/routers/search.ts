import { TRPCError } from "@trpc/server";
import { consola } from "consola";
import { z } from "zod";
import { pluginManager } from "~~/server/utils/plugin";
import { redis } from "~~/server/utils/redis";
import { protectedProcedure, router } from "../trpc";

export const searchRouter = router({
  // availableSources: protectedProcedure.query(() => {
  //   return pluginManager.getAvailablePlugins();
  // }),
  mixSearch: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        source: z.string(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.key || !input.source)
        throw new TRPCError({ code: "BAD_REQUEST", message: "缺少参数" });
      const musicSource = pluginManager.get(input.source);
      if (!musicSource) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "未知的源" });
      }
      return await musicSource.searchSongs(input.key);
    }),
  mixGetUrl: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        source: z.string(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.id || !input.source)
        throw new TRPCError({ code: "BAD_REQUEST", message: "缺少参数" });

      const cacheKey = `musicUrl:${input.source}:${input.id}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        consola.info(`Redis 缓存命中: ${cacheKey}`);
        return JSON.parse(cached);
      }

      let songInfo = { url: "", pay: false };
      const musicSource = pluginManager.get(input.source);
      if (!musicSource) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "未知的源" });
      }
      for (const source of musicSource.getMusicUrl.sort((a, b) => b.priority - a.priority)) {
        try {
          songInfo = await source.fn(input.id).then((res) => {
            if (res.url) {
              return res;
            } else {
              throw new TRPCError({ code: "BAD_REQUEST", message: "音乐链接为空" });
            }
          });
          await redis.set(cacheKey, JSON.stringify(songInfo), { EX: 3600 });
          consola.info(`Redis 缓存写入: ${cacheKey}`);
          return songInfo;
        } catch (e: any) {
          consola.log(
            new Date().toLocaleString("zh-CN"),
            "|",
            `[SongRequest]`,
            input.id,
            "->",
            input.source,
            source.fn.name,
            "|",
            e.message,
          );
        }
      }
      if (!songInfo.url) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "获取音乐链接失败" });
      }
      return songInfo;
    }),
});
