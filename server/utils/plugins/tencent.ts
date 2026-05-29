import type { TMediaSource } from "~~/types";
import { TRPCError } from "@trpc/server";
// import { consola } from "consola";
import { defaultVipSign, mediaBaseURL, searchBaseURL } from "~~/constants";
import { createPlugin } from "../plugin";

async function officialSearch(key: string) {
  const searchBase = "https://u.y.qq.com/cgi-bin/musicu.fcg";

  interface TSearchDataItem {
    album: {
      mid: string;
      name: string;
    };
    singer: { name: string }[];
    mid: string;
    name: string;
    interval: number; // second
  }

  interface TSearchResponse {
    code: number;
    req: {
      data: {
        body: {
          song: {
            list: TSearchDataItem[];
          };
        };
      };
    };
  }

  const bodyData = {
    comm: { ct: "19", cv: "1859", uin: "0" },
    req: {
      method: "DoSearchForQQMusicDesktop",
      module: "music.search.SearchCgiService",
      param: {
        grp: 1,
        num_per_page: 10,
        page_num: 1,
        query: key,
        search_type: 0,
      },
    },
  };

  const res = await $fetch<TSearchResponse>(searchBase, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language":
        "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
      "Content-Type": "application/json;charset=utf-8",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    },
    body: bodyData,
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });

  const songList = res.req.data.body.song.list.map(item => ({
    id: item.mid,
    name: item.name,
    artists: item.singer
      .map(artist => artist.name)
      .join(", ")
      .trim(),
    album: item.album.name,
    source: "tx" as TMediaSource,
    imgId: item.album.mid,
    duration: item.interval,
  }));
  return songList;
}

async function officialFetch(mid: string) {
  const serverBaseURL = mediaBaseURL.qqOfficial;
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

async function vkeyFetch(mid: string) {
  const songBaseURL = mediaBaseURL.qqVkey;
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
  return {
    url: resSongsUrl.data.url.replace(/^http:/, "https:"),
    pay: true,
  };
}

async function metingapiFetch(id: string) {
  const target_url = mediaBaseURL.qqMeting;
  const res = await fetch(`${target_url}${id}`, {
    method: "GET",
    redirect: "follow",
  }).then((res) => {
    if (res.url === `${target_url}${id}`)
      throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲链接失败" });
    return res;
  });
  return { url: res.url, pay: false };
}

export const qqmusic = createPlugin({
  name: "tx",
  alias: "QQ音乐",
  searchSongs: officialSearch,
  getMusicUrl: [
    { fn: officialFetch, priority: 1 },
    { fn: metingapiFetch, priority: 0.9 },
    { fn: vkeyFetch, priority: 0.8 },
  ],
});
