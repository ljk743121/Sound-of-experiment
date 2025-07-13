import type { TPermission } from '~~/types';

export const permissionNames: ({ value: TPermission; label: string; icon: string })[] = [
  { value: 'login', label: '登录', icon: 'lucide:log-in' },
  { value: 'admin', label: '管理', icon: 'lucide:settings-2' },
  { value: 'arrange', label: '排歌', icon: 'lucide:arrow-down-wide-narrow' },
  { value: 'manageUser', label: '管理用户', icon: 'lucide:user-cog' },
  { value: 'review', label: '审核歌曲', icon: 'lucide:music-4' },
  { value: 'time', label: '开放时间', icon: 'lucide:clock' },
  { value: 'blockWords', label: '屏蔽词', icon: 'lucide:ban' },
];

export const breadCrumb: Record<string, string> = {
  admin: '管理',
  user: '用户管理',
  review: '歌曲审核',
  arrange: '排歌列表',
  time: '开放时间',
  words: '屏蔽词',
  songs: '全部歌曲',
};

export const pwRegex = /.*(?=.*\d)(?=.*[A-Za-z]).*/;

export const searchBaseURL = {
  wySearch: 'https://music.163.com/api/search/get',
  wyDetails: 'https://music.163.com/api/song/detail',
  qqSearch: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp',
  qqPURL: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
};

export const mediaBaseURL = {
  wy: 'https://music.163.com/song/media/outer/url?id=',
  qq: 'http://ws.stream.qqmusic.qq.com/',
};

export const imgBaseURL: Record<string, string> = {
  wy: 'https://',//no imgId
  tx: 'https://y.qq.com/music/photo_new/T002R1200x1200M000',
}

export function getImgUrl(imgId: string, source: string){
  return `${imgBaseURL[source]}${imgId}.jpg`;
}
