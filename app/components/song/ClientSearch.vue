<!-- <script setup lang="ts">
import type { RouterOutput, TMediaSource } from "~~/types"
import { searchBaseURL } from '~~/constants';
import { TRPCClientError } from "@trpc/client";


const {
  searchSource,
  searchKey,
  searchType,
} = defineProps<{
  searchSource?: TMediaSource;
  searchKey?: string;
  searchType?: 'search' | 'id';
}>();

defineEmits<{
  (e: 'searchExport', info: typeof status.value): void
}>()

async function searchSongsWy(key: string, type: string) {
  const searchBase = searchBaseURL.wySearch;
  const detailsBase = searchBaseURL.wyDetails;
  let songsIdList: string[] = [];
  if (type === 'search') {
    const resSongs: any = await $fetch(searchBase, {
      method: 'GET',
      params: {
        s: key,
        type: 1,
        offset: 0,
        limit: 20,
        total: true,
      },
    })
    if (resSongs.code !== 200) {
      throw new TRPCClientError('搜索失败')
    }
    if (!resSongs.result?.songs?.length) {
      throw new TRPCClientError('搜索结果为空')
    }
    songsIdList = resSongs.result.songs.map((song: any) => song.id)
  } else {
    songsIdList = [key];
  }
  const resAlbums: any = await $fetch(detailsBase, {
    method: 'GET',
    params: {
      ids: `[${songsIdList.join(',')}]`,
    },
  })
  if (resAlbums.code !== 200) {
    throw new TRPCClientError('获取歌曲信息失败')
  }

  if (!resAlbums.songs?.length) {
    throw new TRPCClientError('获取歌曲信息为空')
  }

  return resAlbums.songs.map((song: any) => ({
    id: song.id.toString(),
    name: song.name,
    artists: song.artists.map((artist: any) => artist.name).join(', ').trim(),
    album: song.album.name,
    source: 'wy',
    imgId: song.album.picUrl.replace('https://', '').replace('.jpg', ''),
    duration: Math.floor(song.duration / 1000),
  })) as RouterOutput['search']['mixSearch'];
}

async function searchSongsQQ(key: string, type: string) {
  const searchBase = searchBaseURL.qqSearch;

  if (type === 'id') {
    throw new TRPCClientError('ID搜索暂未实现')
  }

  const res: any = await $fetch(searchBase, {
    method: 'GET',
    params: {
      w: key,
      n: 20,
      format: 'json',
    },
  })

  if (res.code !== 0) {
    throw new TRPCClientError('搜索失败')
  }
  if (!res.data?.song?.list?.length) {
    throw new TRPCClientError('搜索结果为空')
  }

  return res.data.song.list.map((item: any) => ({
    id: item.songmid,
    name: item.songname,
    artists: item.singer.map((artist: any) => artist.name).join(', ').trim(),
    album: item.albumname,
    source: 'tx',
    imgId: item.albummid,
    duration: item.interval,
  })) as RouterOutput['search']['mixSearch'];
}

const { pending: isFetching, data: songsList, refresh, clear } = useAsyncData(
  'songSearch',
  async () => {
    if (!(searchKey&&searchType&&searchSource)){
      return [] as RouterOutput['search']['mixSearch'];
    }
    if (!searchKey.trim()) {
      if (searchType === 'search') {
        throw new TRPCClientError('请输入歌曲名或歌手名！')
      } else {
        throw new TRPCClientError('请输入歌曲ID！')
      }
    }

    if (!searchSource) {
      throw new TRPCClientError('请选择歌曲来源！')
    }

    if (searchSource === 'wy') {
      return await searchSongsWy(searchKey, searchType)
    } else {
      return await searchSongsQQ(searchKey, searchType)
    }
  },
  {
    immediate: false,
    deep: false
  }
)

const status = ref({
  songs: songsList.value || [],
  isFetching,
})

watch(() => [searchKey, searchType, searchSource], () => {
  if (searchKey&&searchType&&searchSource){
    clear();
    refresh();
  } 
})

</script> -->