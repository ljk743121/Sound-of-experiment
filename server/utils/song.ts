import type { TPermission } from '~~/types';
import { TRPCError } from '@trpc/server';
import { consola } from 'consola';
import { mediaBaseURL, searchBaseURL } from '~~/constants';
import { env } from '../env';

interface User {
  id: string;
  name: string | null;
  displayName: string | null;
  password: string | null;
  permissions: TPermission[];
  remainSubmitSongs: number;
  maxSubmitSongs: number;
  createdAt: Date;
};

export async function searchSongsWy(key: string, type: string) {
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
    duration: number;// millisecond
  }

  interface TAlbumsResponse {
    code: number;
    songs: TDetails[];
  }

  if (!key) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '缺少搜索关键词' });
  }

  let songsIdList = <string[]>[];
  let resSongs = <TSearchResponse>{};

  if (type === 'search') {
    resSongs = await $fetch<TSearchResponse>(searchBase, {
      method: 'GET',
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
      throw new TRPCError({ code: 'BAD_REQUEST', message: '搜索失败' });
    }
    if (!resSongs.result.songs) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '搜索结果为空' });
    }

    songsIdList = resSongs.result.songs.map(song => song.id);
  } else { // id
    songsIdList = [key];
  }

  const resAlbums = await $fetch<TAlbumsResponse>(detailsBase, {
    method: 'GET',
    params: {
      ids: `[${songsIdList.join(',')}]`,
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
    throw new TRPCError({ code: 'BAD_REQUEST', message: '获取歌曲信息失败' });
  }
  if (!resAlbums.songs) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '获取歌曲信息为空' });
  }

  const transformSongs = resAlbums.songs.map(song => ({
    id: song.id.toString(),
    name: song.name,
    artists: song.artists.map(artist => artist.name).join(', ').trim(),
    album: song.album.name,
    source: 'wy',
    imgId: song.album.picUrl.replace('https://','').replace('.jpg',''),
    duration: Math.floor(song.duration / 1000),
  }));
  return transformSongs;
}

export async function searchSongsQQ(key: string, type: string) {
  const searchBase = searchBaseURL.qqSearch;
  if (type === 'id')
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'id搜索暂未实现' });

  interface TSearchDataItem {
    albummid: string;
    albumname: string;
    singer: { name: string }[];
    songmid: string;
    songname: string;
    interval: number;// second
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
    method: 'GET',
    params: {
      w: key,
      n: 10,
      format: 'json',
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
    artists: item.singer.map(artist => artist.name).join(', ').trim(),
    album: item.albumname,
    source: 'tx',
    imgId: item.albummid,
    duration: item.interval,
  }));
  return songList;
}

export async function getSongUrlWy(id: string) {
  const baseUrl = mediaBaseURL.wy;
  const res = await fetch(`${baseUrl}${id}.mp3`);
  if (!res.ok) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '获取歌曲链接失败' });
  } else if (res.url === 'https://music.163.com/404') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '歌曲为VIP歌曲' });
  } else {
    return {
      url: res.url,
      pay: false,
    };
  };
}

export async function getSongUrlQQ(mid: string) {
  const serverBaseURL = mediaBaseURL.qq;
  const songBaseURL = searchBaseURL.qqPURL;
  const PREFIX = 'M500';
  const SUFFIX = 'mp3';
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
    method: 'GET',
    params: {
      format: 'json',
      data: songData,
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });
  // if (!resPURL.ok) {
  //   throw new TRPCError({ code:'BAD_REQUEST', message: '获取歌曲链接失败' });
  // }
  if (resPURL.req_0.data.midurlinfo[0].purl.length < 1)
    throw new TRPCError({ code: 'BAD_REQUEST', message: '歌曲为VIP歌曲' });

  return {
    url: `${serverBaseURL}${resPURL.req_0.data.midurlinfo[0].purl}`,
    pay: false,
  };
}

export async function getSongUrlWyVip(id: string, user: User) {
  const songBaseURL = env.WY_URL;
  if (!songBaseURL)
    throw new TRPCError({ code: 'BAD_REQUEST', message: '未设置请求源' });
  interface TSongURL {
    code: number;
    data: {
      url: string;
      song: string;
    };
  }
  const resSongsUrl = await $fetch<TSongURL>(songBaseURL, {
    method: 'GET',
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
    throw new TRPCError({ code: 'BAD_REQUEST', message: '你的请求可能为VIP歌曲，服务器繁忙，请稍后再试' });
  }
  if (!resSongsUrl.data.url) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '获取VIP歌曲链接失败' });
  }
  consola.log(
    (new Date()).toLocaleString('zh-CN'),
    '|',
    `[${resSongsUrl.code}]`,
    `[VIPRequest]`,
    user.id,
    user.name,
    '->',
    'wy',
    '|',
    id,
  );
  return {
    url: resSongsUrl.data.url,
    pay: true,
  };
}

export async function getSongUrlQQVip(mid: string, user: User) {
  const songBaseURL = env.TX_URL;
  if (!songBaseURL)
    throw new TRPCError({ code: 'BAD_REQUEST', message: '未设置请求源' });
  interface TSongURL {
    code: number;
    data: {
      url: string;
      song: string;
    };
  };

  const resSongsUrl = await $fetch<TSongURL>(songBaseURL, {
    method: 'GET',
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
    throw new TRPCError({ code: 'BAD_REQUEST', message: '你的请求可能为VIP歌曲，服务器繁忙，请稍后再试' });
  }
  if (!resSongsUrl.data.url) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '获取VIP歌曲链接失败' });
  }
  consola.log(
    (new Date()).toLocaleString('zh-CN'),
    '|',
    `[${resSongsUrl.code}]`,
    `[VIPRequest]`,
    user.id,
    user.name,
    '->',
    'tx',
    '|',
    mid,
  );
  return {
    url: resSongsUrl.data.url,
    pay: true,
  };
}
