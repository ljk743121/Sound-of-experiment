// modify from listen 1 bilibili.js by ljk743121
import type { TMediaSource } from "~~/types";
import { TRPCError } from "@trpc/server";

import { createPlugin } from "../plugin";
import WrapBiliRequest from "../wbi";

interface SongInfo {
  id: number;
  bvid: string;
  title: string;
  author: string;
  pic: string;
  duration: string;
}

interface SearchRes {
  code: number;
  message: string;
  data: {
    result: [{
      id: number;
      bvid: string;
      title: string;
      author: string;
      pic: string;
      duration: string;
    }];
  };
}

interface CidRes {
  code: number;
  message: string;
  data: {
    pages: [{
      cid: string;
    }];
  };
}

// interface PlayUrlRes {
//   code: number;
//   message: string;
//   data: {
//     dash: {
//       audio: [{
//         baseUrl: string;
//       }];
//     };
//   };
// }

interface NoRefererPlayUrlRes {
  code: number;
  message: string;
  data: {
    durl: [{
      url: string;
    }];
  };
}

function htmlDecode(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function bi_convert_song(song_info: SongInfo) {
  let imgUrl = song_info.pic;
  const durationStr = song_info.duration.split(":").map(x => Number.parseInt(x)).reverse();
  let duration = durationStr[0] + durationStr[1] * 60;
  if (durationStr.length === 3) {
    duration += durationStr[2] * 60 * 60;
  }
  if (imgUrl.startsWith("//")) {
    imgUrl = `https:${imgUrl}`;
  }
  // imgUrl = `/api/bbapi?p=${imgUrl}`;
  const track = {
    id: song_info.bvid,
    name: htmlDecode(song_info.title),
    artists: htmlDecode(song_info.author),
    source: "bilibili" as TMediaSource,
    imgId: imgUrl.replace(".jpg", ""),
    duration,
  };
  return track;
}

async function getTrackUrl(id: string) {
  const bvid = id;
  const target_url = "https://api.bilibili.com/x/web-interface/view";
  const resp1 = await $fetch<CidRes>(target_url, {
    method: "GET",
    params: {
      bvid,
    },
  });
  if (resp1.code !== 0 || !resp1.data?.pages?.[0]?.cid) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取视频信息失败" });
  }
  const cid = resp1.data.pages[0].cid;
  const target_url2 = "http://api.bilibili.com/x/player/playurl";
  // const resp2 = await $fetch<PlayUrlRes>(target_url2, {
  //   method: "GET",
  //   params: {
  //     fnval: 16,
  //     bvid,
  //     cid,
  //   },
  // });
  const resp2 = await $fetch<NoRefererPlayUrlRes>(target_url2, {
    method: "GET",
    params: {
      fnval: 1,
      platform: "html5",
      bvid,
      cid,
    },
  });
  // if (resp2.data.dash.audio.length > 0) {
  //   const url = resp2.data.dash.audio[0].baseUrl;
  //   return { url: `/api/bbapi?p=${encodeURIComponent(url)}`, pay: false };
  //   // return { url, pay: false };
  if (resp2.code !== 0 || !resp2.data?.durl?.[0]?.url) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲链接失败" });
  }
  const url = resp2.data.durl[0].url;
  return { url, pay: false };
}

async function search(keyword: string) {
  const sessdata = "fbda0bdc%2C1636301184%2C30180681";// 2021-08-10 00:06:25 CST
  const target_url = "https://api.bilibili.com/x/web-interface/wbi/search/type";
  const params = {
    __refresh__: "true",
    page: 1,
    page_size: 15,
    platform: "pc",
    highlight: 1,
    single_column: 0,
    keyword,
    search_type: "video",
    dynamic_offset: 0,
    preload: "true",
    com2co: "true",
  };
  const query = await WrapBiliRequest(sessdata, params);
  const resp = await $fetch<SearchRes>(`${target_url}?${query}`, {
    method: "GET",
    headers: {
      "Cookie": "buvid3=0",
      "Referer": "https://www.bilibili.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.56 Safari/537.36",
    },
  });
  if (resp.code !== 0 || !resp.data?.result) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "搜索失败" });
  }
  return resp.data.result.map((song) => {
    return bi_convert_song(song);
  });
};

export const bilibili = createPlugin({
  name: "bilibili",
  alias: "哔哩哔哩",
  searchSongs: { fn: search, retryCount: 1 },
  getMusicUrl: [
    { fn: getTrackUrl, priority: 1, retryCount: 1 },
  ],
});
