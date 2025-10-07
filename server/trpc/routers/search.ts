import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { defaultVipSign } from "~~/constants";
import { pluginManager } from "~~/server/utils/plugin";
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
        type: z.enum(["search", "id"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.key || !input.source)
        throw new TRPCError({ code: "BAD_REQUEST", message: "缺少参数" });
      const musicSource = pluginManager.get(input.source);
      if (!musicSource) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "未知的源" });
      }
      return await musicSource.searchSongs(input.key, input.type);
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
      let songInfo = { url: "", pay: false };
      const musicSource = pluginManager.get(input.source);
      if (!musicSource) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "未知的源" });
      }
      try {
        songInfo = await musicSource.getMusicUrl(input.id);
      } catch (e: any) {
        if (e.message === defaultVipSign) {
          if (musicSource.getVipMusicUrl) {
            songInfo = await musicSource.getVipMusicUrl(input.id);
          } else {
            throw new TRPCError({ code: "BAD_REQUEST", message: "因版权问题，无法播放歌曲" });
          }
        } else {
          throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
        }
      }
      if (!songInfo.url)
        throw new TRPCError({ code: "BAD_REQUEST", message: "歌曲链接为空" });
      return songInfo;
    }),
});
