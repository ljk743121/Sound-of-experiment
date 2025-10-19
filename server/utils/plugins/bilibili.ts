// modify from listen 1 bilibili.js by ljk743121
import type { TMediaSource } from "~~/types";
import { TRPCError } from "@trpc/server";
import { createPlugin } from "../plugin";

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
  if (resp2.data.durl.length > 0) {
    const url = resp2.data.durl[0].url;
    return { url, pay: false };
  } else {
    throw new TRPCError({ code: "BAD_REQUEST", message: "获取歌曲链接失败" });
  }
}

async function search(keyword: string) {
  const target_url = `https://api.bilibili.com/x/web-interface/search/type`;
  const resp = await $fetch<SearchRes>(target_url, {
    method: "GET",
    params: {
      __refresh__: true,
      page: 1,
      page_size: 15,
      platform: "pc",
      highlight: 1,
      single_column: 0,
      keyword,
      search_type: "video",
      dynamic_offset: 0,
      preload: true,
      com2co: true,
    },
    headers: {
      Cookie: "buvid3=0",
    },
  });
  return resp.data.result.map((song) => {
    return bi_convert_song(song);
  });
};

export const bilibili = createPlugin({
  name: "bilibili",
  alias: "哔哩哔哩",
  searchSongs: search,
  getMusicUrl: [
    { fn: getTrackUrl, priority: 1 },
  ],
});
