<template>
  <div v-if="UrlFetching" class="flex h-[calc(100svh-10rem)] w-full flex-col items-center justify-center">
    正在获取歌曲链接
    <Icon name="lucide:loader-circle" class="animate-spin" size="35" />
  </div>
  <!-- information of success or error -->
  <div v-else class="flex flex-col gap-4 rounded-lg border p-5 shadow-sm ">
    <div class="flex items-center gap-3 border-b pb-3">
      <Icon name="lucide:music-4" class="text-primary" size="20" />
      <h3 class="text-xl font-semibold">
        当前播放
      </h3>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="col-span-2 space-y-4">
        <div>
          <p class="mb-1 text-sm">
            歌曲名称
          </p>
          <h4 class="max-w-md truncate text-2xl font-bold">
            {{ props.name }}
          </h4>
        </div>

        <div>
          <p class="mb-1 text-sm">
            艺术家
          </p>
          <p class="text-lg font-medium ">
            {{ props.artists }}
          </p>
        </div>

        <div v-if="props.album">
          <p class="mb-1 text-sm">
            专辑
          </p>
          <p class="text-lg font-medium">
            {{ props.album }}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <span v-if="props.id === null"
            class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
            <Icon name="lucide:x-circle" class="mr-1" size="14" />
            无播放链接
          </span>
          <span v-else-if="songUrlStatus === 'success'"
            class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
            <Icon name="lucide:check-circle" class="mr-1" size="14" />
            可播放预览
          </span>
          <span v-else-if="songUrlStatus === 'error'"
            class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
            <Icon name="lucide:x-circle" class="mr-1" size="14" />
            获取播放链接失败
          </span>

        </div>
      </div>
    </div>
  </div>
  <div v-if="props.id !== null && props.source !== null && !UrlFetching && songUrlStatus === 'success'">
    <!-- use SearchCount to force re-rendering -->
    <MusicfyPlayer v-if="config.audioSrc !== 'https://example.com/audio.mp3'" :config="config" :key="SearchCount"
      width="100%" />
  </div>
</template>

<script setup lang="ts">
import { getImgUrl } from '~~/constants';

const { $trpc } = useNuxtApp();
const queryClient = useQueryClient();

const SearchCount = ref(0);

const props = defineProps<{
  id: string | null;
  name: string;
  artists: string;
  album?: string;
  imgId: string | null;
  source: string | null;
}>();

const { status: songUrlStatus, isFetching: UrlFetching } = useQuery({
  queryFn: () => $trpc.search.mixGetUrl.query({
    id: props.id!,
    source: props.source!,
  }),
  queryKey: ['search.mixGetUrl'],
  refetchOnWindowFocus: false,
  enabled: computed(() => (props.source !== null && props.id !== null && props.id.length > 0 && props.source.length > 0)),
});

const config = ref(useMusicfyPlayer({
  audio: {
    provider: 'local',
    preload: 'none',
    src: 'https://example.com/audio.mp3',
  },
  image: {
    src: 'https://example.com/image.png',
  },
  color: {
    detect: true,
  },
}));

watchEffect(async () => {
  if (props.id === '' || props.source === ''){
    toast.error('歌曲ID或来源为空')
    
  }else if (props.id !== null && props.source !== null) {
    await queryClient.invalidateQueries({ queryKey: ['search.mixGetUrl'] });// reset cache to avoid song and message mismatch
    const data = await queryClient.fetchQuery({
      queryKey: ['search.mixGetUrl'],
      queryFn: () => $trpc.search.mixGetUrl.query({
        id: props.id!,
        source: props.source!,
      }),
    });

    if (data) {
      config.value.audioSrc = data;
      config.value.imageSrc = getImgUrl(props.imgId!, props.source);
      SearchCount.value++;
    }
  }
});

</script>