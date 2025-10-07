import type { TMediaSource } from "~~/types";
import type { MusicSourcePlugin } from "../plugin";
import { TRPCError } from "@trpc/server";
// import { consola } from "consola";
import { defaultVipSign, mediaBaseURL, searchBaseURL } from "~~/constants";
import { env } from "~~/server/env";

async function searchSongsWy(key: string, type?: string) {
  if (!type) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "缺少搜索类型" });
  }
  const searchBase = searchBaseURL.wySearch;
  const detailsBase = searchBaseURL.wyDetails;

  interface TSearchResponse {
    code: number;
    result: {
      songs: {
        id: string;
      }[];
      songCount: number;
    };
  }

  interface TDetails {
    id: string;
    name: string;
    artists: {
      name: string;
    }[];
    album: {
      name: string;
      picUrl: string;
    };
    duration: number; // millisecond
  }

  interface TAlbumsResponse {
    code: number;
    songs: TDetails[];
  }

  if (!key) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "缺少搜索关键词" });
  }

  let songsIdList = <string[]>[];
  let resSongs = <TSearchResponse>{};

  if (type === "search") {
    resSongs = await $fetch<TSearchResponse>(searchBase, {
      method: "GET",
      params: {
        s: key,
        type: 1,
        offset: 0,
        limit: 10,
        total: true,
      },
      parseResponse(responseText) {
        try {
          return JSON.parse(responseText);
        } catch {
          return responseText;
        }
      },
    });
    if (resSongs.code !== 200) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "搜索失败" });
    }
    if (!resSongs.result.songs) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "搜索结果为空" });
    }

    songsIdList = resSongs.result.songs.map(song => song.id);
  } else {
    // id
    songsIdList = [key];
  }

  const resAlbums = await $fetch<TAlbumsResponse>(detailsBase, {
    method: "GET",
    params: {
      ids: `[${songsIdList.join(",")}]`,
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });

  if (resAlbums.code !== 200) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲信息失败" });
  }
  if (!resAlbums.songs) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲信息为空" });
  }

  const transformSongs = resAlbums.songs.map(song => ({
    id: song.id.toString(),
    name: song.name,
    artists: song.artists
      .map(artist => artist.name)
      .join(", ")
      .trim(),
    album: song.album.name,
    source: "wy" as TMediaSource,
    imgId: song.album.picUrl.replace("https://", "").replace(".jpg", ""),
    duration: Math.floor(song.duration / 1000),
  }));
  return transformSongs;
}

async function getSongUrlWy(id: string) {
  const baseUrl = mediaBaseURL.wy;
  const res = await fetch(`${baseUrl}${id}.mp3`);
  if (!res.ok) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲链接失败" });
  } else if (res.url.replace(/^http:/, "https:") === "https://music.163.com/404") {
    throw new TRPCError({ code: "BAD_REQUEST", message: defaultVipSign });
  } else {
    return {
      url: res.url.replace(/^http:/, "https:"),
      pay: false,
    };
  }
}
async function getSongUrlWyVip(id: string) {
  const songBaseURL = env.WY_URL;
  if (!songBaseURL)
    throw new TRPCError({ code: "BAD_REQUEST", message: "服务器未配置请求源" });
  interface TSongURL {
    code: number;
    data: {
      url: string;
      song: string;
    };
  }
  const resSongsUrl = await $fetch<TSongURL>(songBaseURL, {
    method: "GET",
    params: {
      id,
      quality: 2,
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });
  if (resSongsUrl.code !== 200) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "第三方服务器繁忙，请稍后再试",
    });
  }
  if (!resSongsUrl.data.url) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取VIP歌曲链接失败" });
  }
  // consola.log(
  //   new Date().toLocaleString("zh-CN"),
  //   "|",
  //   `[${resSongsUrl.code}]`,
  //   `[VIPRequest]`,
  //   user.id,
  //   user.name,
  //   "->",
  //   "wy",
  //   "|",
  //   id,
  // );
  return {
    url: resSongsUrl.data.url.replace(/^http:/, "https:"),
    pay: true,
  };
}

export function WYMusicSourcePlugin(): MusicSourcePlugin {
  return {
    name: "wy",
    alias: "网易云音乐",
    searchSongs: searchSongsWy,
    getMusicUrl: getSongUrlWy,
    getVipMusicUrl: getSongUrlWyVip,
  };
}
