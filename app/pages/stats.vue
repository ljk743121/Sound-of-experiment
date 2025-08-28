<template>
  <div class="container max-w-screen-lg select-none divide-y px-0 md:border-x">
    <div class="flex items-center gap-2 pl-5 font-bold">
      <Button size="icon" variant="outline" @click="navigateTo('/')">
        <Icon name="lucide:chevron-left" />
      </Button>
      <span class="md:text-xl">数据统计</span>
      <div class="ml-auto flex">
        <div class="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-8 sm:py-6">
          <span class="text-xs text-muted-foreground">累计投稿</span>
          <span class="text-lg font-bold leading-none sm:text-3xl">{{ countData?.songCount }}</span>
        </div>
        <div class="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-8 sm:py-6">
          <span class="text-xs text-muted-foreground">用户数目</span>
          <span class="text-lg font-bold leading-none sm:text-3xl">{{ countData?.userCount }}</span>
        </div>
      </div>
    </div>
    <div>
      <CardHeader>
        <CardTitle>
          <span class="text-muted-foreground">#1</span> 每周投稿
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex gap-2 overflow-x-auto">
          <div v-for="(week, i) of weekData" :key="week.date" class="flex flex-col gap-2">
            <div class="relative flex h-[500px] w-8 flex-col justify-end md:h-[600px] md:w-16">
              <div v-if="week.count" :style="{ height: `${(week.count ?? 0) / weekMax * 100}%` }"
                class="flex justify-center rounded text-xs text-white"
                :class="[i % 2 === 0 ? 'bg-green-800 dark:bg-green-700' : 'bg-green-700 dark:bg-green-600']">
                <span class="py-0.5 font-mono md:py-2">{{ week.count }}</span>
              </div>
            </div>
            <div
              class="self-center font-mono text-xs text-muted-foreground [writing-mode:vertical-lr] md:[writing-mode:lr]">
              {{ week.date }}
            </div>
          </div>
        </div>
      </CardContent>
    </div>
    <div>
      <CardHeader>
        <CardTitle>
          <span class="text-muted-foreground">#2</span> 歌手统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea class="h-max-[500px]" type="always">
          <div class="flex flex-col gap-2">
            <div v-for="(singer, i) of singerData" :key="singer.name" class="items-center gap-3 md:flex">
              <div class="truncate text-xs text-muted-foreground md:w-40 md:text-right">
                {{ singer.name }}
              </div>
              <div class="flex w-full">
                <div v-if="singer.count" :style="{ width: `${(singer.count ?? 0) / singerMax * 100}%` }"
                  class="flex h-6 items-center rounded text-xs text-white" :class="[
                    (singer.count ?? 0) === 0 && 'rounded-r',
                    i % 2 === 0 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-blue-500 dark:bg-blue-400',
                  ]">
                  <span class="px-0.5 font-mono md:px-2">{{ singer.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div class="mt-4 text-center text-xs text-muted-foreground">
          * 部分歌曲为更新前提交，不一定能确认歌手
        </div>
      </CardContent>
    </div>
    <div>
      <CardHeader>
        <CardTitle>
          <span class="text-muted-foreground">#3</span> 热门歌曲统计(点赞量)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea class="h-max-[500px]" type="always">
          <div class="flex flex-col gap-2">
            <div v-for="(song, i) of likeData" :key="song.name" class="items-center gap-3 md:flex">
              <div class="flex items-center truncate text-xs text-muted-foreground md:w-40 md:text-right">
                <Avatar class="size-12 rounded mr-2">
                  <NuxtImg 
                    v-if="song.imgId && song.source" 
                    :src="getImgUrl(song.imgId, song.source)" 
                    class="object-cover"
                    :alt="song.name" 
                    loading="lazy" 
                  />
                  <Icon v-else name="lucide:music" size="12" />
                </Avatar>
                <span class="truncate">{{ song.name }}</span>
              </div>
              <div class="flex w-full">
                <div v-if="song.count" :style="{ width: `${(song.count ?? 0) / likeMax * 100}%` }"
                  class="flex h-6 items-center rounded text-xs text-white" :class="[
                    (song.count ?? 0) === 0 && 'rounded-r',
                    i % 2 === 0 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-blue-500 dark:bg-blue-400',
                  ]">
                  <span class="px-0.5 font-mono md:px-2">{{ song.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getImgUrl } from '~~/constants';

const { $trpc } = useNuxtApp();
const userStore = useUserStore();

if (!userStore.loggedIn){
  navigateTo('/auth/login');
}
try {
  await $trpc.user.tokenValidity.query();
} catch {
  navigateTo('/auth/login');
}


const { data: weekData } = useQuery({
  queryFn: () => $trpc.stats.song.query(),
  queryKey: ['stats.song'],
  refetchIntervalInBackground: false,
  refetchInterval: 60000,
});
const weekMax = computed(() => Math.max(...(weekData.value?.map(week => week.count) ?? [0])));

const { data: singerData } = useQuery({
  queryFn: () => $trpc.stats.singer.query(),
  queryKey: ['stats.singer'],
  refetchIntervalInBackground: false,
  refetchInterval: 60000,
});
const singerMax = computed(() => Math.max(...(singerData.value?.map(singer => singer.count) ?? [0])));

const { data: countData } = useQuery({
  queryFn: () => $trpc.stats.count.query(),
  queryKey: ['stats.count'],
  refetchIntervalInBackground: false,
  refetchInterval: 60000,
});

const { data: likeData } = useQuery({
  queryFn: () => $trpc.stats.like.query(),
  queryKey: ['stats.like'],
  refetchIntervalInBackground: false,
  refetchInterval: 60000,
});
const likeMax = computed(() => Math.max(...(likeData.value?.map(like => like.count) ?? [0])));
</script>
