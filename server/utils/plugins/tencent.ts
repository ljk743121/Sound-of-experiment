import type { TMediaSource } from "~~/types";
import type { MusicSourcePlugin } from "../plugin";
import { TRPCError } from "@trpc/server";
// import { consola } from "consola";
import { defaultVipSign, mediaBaseURL, searchBaseURL } from "~~/constants";
import { env } from "~~/server/env";

async function searchSongsQQ(key: string, type?: string) {
  const searchBase = searchBaseURL.qqSearch;
  if (type === "id")
    throw new TRPCError({ code: "BAD_REQUEST", message: "id搜索暂未实现" });

  interface TSearchDataItem {
    albummid: string;
    albumname: string;
    singer: { name: string }[];
    songmid: string;
    songname: string;
    interval: number; // second
  }

  interface TSearchResponse {
    code: number;
    data: {
      song: {
        list: TSearchDataItem[];
      };
    };
  }

  const res = await $fetch<TSearchResponse>(searchBase, {
    method: "GET",
    params: {
      w: key,
      n: 10,
      format: "json",
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });

  const songList = res.data.song.list.map(item => ({
    id: item.songmid,
    name: item.songname,
    artists: item.singer
      .map(artist => artist.name)
      .join(", ")
      .trim(),
    album: item.albumname,
    source: "tx" as TMediaSource,
    imgId: item.albummid,
    duration: item.interval,
  }));
  return songList;
}

async function getSongUrlQQ(mid: string) {
  const serverBaseURL = mediaBaseURL.qq;
  const songBaseURL = searchBaseURL.qqPURL;
  const PREFIX = "M500";
  const SUFFIX = "mp3";
  const songData = `{"req_0":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"filename":["${PREFIX}${mid}${mid}.${SUFFIX}"],"guid":"10000","songmid":["${mid}"],"songtype":[0],"uin":"0","loginflag":1,"platform":"20"}},"loginUin":"0","comm":{"uin":"0","format":"json","ct":24,"cv":0}}`;
  interface TQQSongResponse {
    req_0: {
      data: {
        midurlinfo: {
          purl: string;
          vkey: string;
        }[];
      };
    };
  }

  const resPURL = await $fetch<TQQSongResponse>(songBaseURL, {
    method: "GET",
    params: {
      format: "json",
      data: songData,
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
    onResponseError() {
      throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲链接失败" });
    },
  });
  if (resPURL.req_0.data.midurlinfo[0].purl.length < 1)
    throw new TRPCError({ code: "BAD_REQUEST", message: defaultVipSign });

  return {
    url: `${serverBaseURL}${resPURL.req_0.data.midurlinfo[0].purl}`.replace(/^http:/, "https:"),
    pay: false,
  };
}

async function getSongUrlQQVip(mid: string) {
  const songBaseURL = env.TX_URL;
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
      mid,
      quality: 6,
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
  //   "tx",
  //   "|",
  //   mid,
  // );
  return {
    url: resSongsUrl.data.url.replace(/^http:/, "https:"),
    pay: true,
  };
}

export function QQMusicSourcePlugin(): MusicSourcePlugin {
  return {
    name: "tx",
    alias: "QQ音乐",
    searchSongs: searchSongsQQ,
    getMusicUrl: getSongUrlQQ,
    getVipMusicUrl: getSongUrlQQVip,
  };
}
