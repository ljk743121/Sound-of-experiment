<template>
  <main
    class="mx-auto flex max-w-screen-sm flex-col gap-4 p-5 lg:mx-auto lg:grid lg:h-screen lg:max-w-screen-xl lg:grid-cols-2 lg:gap-8 lg:p-10"
  >
    <section class="flex flex-col gap-3 lg:self-center">
      <LogosSoe class="w-full" />

      <div class="grid grid-cols-2 gap-3">
        <div class="grid grid-rows-2 gap-3">
          <Button class="block h-full items-center gap-2" variant="outline">
            <div class="text-xs">
              本周已收集歌曲
            </div>
            <div class="text-2xl font-bold">
              {{ songList?.length || 0 }}
            </div>
          </Button>
          <TimeAvailabilityDialog>
            <TimeAvailability is-card />
          </TimeAvailabilityDialog>
        </div>
        <!-- <ClientOnly>
          <template #fallback>
            <Button class="size-full text-xl font-bold" :disabled="!canSubmit" variant="secondary">
              <Icon name="lucide:music-4" size="26" class="mr-2" />
              投稿<span class="text-sm">(剩余次数:{{ remainSubmitSongs?.valueOf() || 0 }})</span>
            </Button>
          </template>
          <SongSubmitDialog>
            <Button class="size-full text-xl font-bold" :disabled="!canSubmit" variant="secondary">
              <Icon name="lucide:music-4" size="26" class="mr-2" />
              投稿<span class="text-sm">(剩余次数:{{ remainSubmitSongs?.valueOf() || 0 }})</span>
            </Button>
          </SongSubmitDialog>
        </ClientOnly> -->
        <Button class="size-full text-xl font-bold" :disabled="!canSubmit" variant="secondary" @click.prevent="navigateTo('/submit')">
          <div class="flex flex-col items-center">
            <span>
              <Icon name="lucide:music-4" size="26" class="mr-2" />
              投稿
            </span>
            <span class="text-sm font-normal">(剩余次数:{{ remainSubmitSongs?.valueOf() || 0 }})</span>
          </div>
        </Button>
      </div>

      <div class="hidden sm:grid sm:grid-cols-4 gap-3">
        <HomeRule>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:circle-help" class="mr-2" />
            <span>
              规则介绍
            </span>
          </Button>
        </HomeRule>

        <Button variant="outline" disabled v-if="isAnnouncementListPending" class="w-full">
            <Icon name="lucide:loader-2" size="20" class="animate-spin" />
            公告
        </Button>
        <HomeAnnouncement v-else :announcement-list="announcementList!" class="w-full">
          <Button variant="outline" :disabled="isAnnouncementListPending" class="w-full">
            <Icon name="lucide:bell" class="mr-2" />
            公告
          </Button>
        </HomeAnnouncement>

        <Button variant="outline" @click.prevent="navigateTo('/stats')" class="w-full">
          <Icon name="lucide:info" class="mr-2" />
          数据统计
        </Button>

        <HomeAboutUs>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:info" class="mr-2" />
            关于我们
          </Button>
        </HomeAboutUs>
      </div>
      
      <!-- 小屏幕显示的2x2网格布局 -->
      <div class="grid grid-cols-2 gap-3 sm:hidden">
        <HomeRule>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:circle-help" class="mr-2" />
            规则介绍
          </Button>
        </HomeRule>
        
        <Button variant="outline" disabled v-if="isAnnouncementListPending" class="w-full">
            <Icon name="lucide:loader-2" size="20" class="animate-spin" />
            公告
        </Button>
        <HomeAnnouncement v-else :announcement-list="announcementList!" class="w-full">
          <Button variant="outline" :disabled="isAnnouncementListPending" class="w-full">
            <Icon name="lucide:bell" class="mr-2" />
            公告
          </Button>
        </HomeAnnouncement>

        <Button variant="outline" @click.prevent="navigateTo('/stats')" class="w-full">
          <Icon name="lucide:info" class="mr-2" />
          数据统计
        </Button>

        <HomeAboutUs>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:info" class="mr-2" />
            关于我们
          </Button>
        </HomeAboutUs>
      </div>

      <div class="mt-4 flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="w-full">
                <Avatar class="rounded-lg">
                  <Icon name="lucide:circle-user" size="20" />
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ userStore.name }}</span>
                  <span class="truncate text-xs" v-if="userStore.displayName">昵称：{{ userStore.displayName }}</span>
                  <span class="truncate text-xs">{{ userStore.id }}</span>
                </div>
                <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom"
              :side-offset="4"
            >
              <DropdownMenuLabel class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar class="rounded-lg">
                    <Icon name="lucide:circle-user" size="20" />
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{ userStore.name }}</span>
                    <span class="truncate text-xs" v-if="userStore.displayName">昵称：{{ userStore.displayName }}</span>
                    <span class="truncate text-xs">{{ userStore.id }}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="navigateTo('/profile')">
                <Icon name="lucide:user-check" />
                个人资料
              </DropdownMenuItem>
              <DropdownMenuItem v-if="userStore.permissions.includes('admin')" @click="navigateTo('/admin')">
                <Icon name="lucide:user-cog" />
                管理
              </DropdownMenuItem>
              <DropdownMenuItem @click="logout">
                <Icon name="lucide:log-out" />
                登出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModifyPasswordDialog />
        <div class="ml-auto flex gap-2" />
        <DarkModeToggle />
      </div>

      <div class="grid gap-3">
        <SongPlayer 
          v-if=" songPlayingConfig.id.length > 0"
          :id="songPlayingConfig.id"
          :name="songPlayingConfig.name"
          :artists=" songPlayingConfig.artists"
          :source="songPlayingConfig.source"
          :img-id="songPlayingConfig.imgId"
        />
      </div>
    </section>

    <section class="lg:overflow-auto lg:px-4">
      <Tabs v-model="selectedTab" default-value="list">
        <div class="sticky top-0 z-50 -mx-5 bg-background px-5 pt-4 lg:m-0 lg:p-0">
          <TabsList class="grid grid-cols-3">
            <TabsTrigger value="list">
              本周投稿
            </TabsTrigger>
            <TabsTrigger value="arrangement">
              歌单
            </TabsTrigger>
            <TabsTrigger value="mine">
              我的投稿
            </TabsTrigger>
          </TabsList>
          <div v-if="selectedTab === 'list'" class="relative mt-1 w-full items-center bg-background">
            <Input id="search" v-model="searchPrompt" type="text" placeholder="搜索歌曲" class="pl-8" />
            <span class="absolute inset-y-0 start-0 flex items-center justify-center pl-3">
              <Icon name="lucide:search" class="text-muted-foreground" />
            </span>
          </div>
        </div>
        <TabsContent value="list" class="space-y-3">
          <SongCard v-for="song in filteredList" :key="song.id" :song @songExport="playMusic" />
        </TabsContent>
        <TabsContent value="arrangement">
          <DatePicker
            v-model="selectedDate" mode="date" view="weekly" borderless expanded title-position="left"
            is-required :attributes="calendarAttr" :is-dark="isDark" class="mb-4 !bg-background"
          />
          <ul class="flex flex-col gap-3">
            <li v-for="song in arrangementListSongs" :key="song.id">
              <SongCard :song @songExport="playMusic" is-arrangement />
            </li>
          </ul>
        </TabsContent>
        <TabsContent value="mine" class="space-y-3">
          <SongCard v-for="song in mySongList" :key="song.id" :song @songExport="playMusic"/>
        </TabsContent>
      </Tabs>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';
import { useFuse, type UseFuseOptions } from '@vueuse/integrations/useFuse';
import { DatePicker } from '@ztl-uwu/v-calendar';
import ModifyPasswordDialog from '~/components/profile/ModifyPasswordDialog.vue';
import SongPlayer from '~/components/song/SongPlayer.vue'

const userStore = useUserStore();
const { $trpc } = useNuxtApp();

const selectedDate = ref(new Date());
const isDark = computed(() => useColorMode().preference === 'dark');

const { data: songList, suspense: songListSuspense } = useQuery({
  queryFn: () => $trpc.song.listSafe.query(),
  queryKey: ['song.listSafe'],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
});

const { data: mySongList, suspense: mySongListSuspense } = useQuery({
  queryFn: () => $trpc.song.listMine.query(),
  queryKey: ['song.listMine'],
});

const { data: canSubmit, suspense: canSubmitSuspense } = useQuery({
  queryFn: () => $trpc.song.canSubmit.query(),
  queryKey: ['song.canSubmit'],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
});

const { data: remainSubmitSongs, suspense: remainSubmitSongsSuspense } = useQuery({
  queryFn: () => $trpc.song.remainSubmitSongs.query(),
  queryKey: ['song.remainSubmitSongs'],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
});

const { data: arrangementList, suspense: arrangementListSuspense } = useQuery({
  queryFn: () => $trpc.arrangements.listSafe.query(),
  queryKey: ['arrangements.listSafe'],
  refetchIntervalInBackground: false,
});

const { data: announcementList, suspense: listSuspense, isPending: isAnnouncementListPending } = useQuery({
  queryFn: () => $trpc.announcement.listSafe.query(),
  queryKey: ['announcement.listSafe'],
})

function getDateString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

const arrangementListSongs = computed(
  () => arrangementList.value?.find(e => e.date === getDateString(selectedDate.value))?.songs || [],
);

const calendarAttr = computed(() => {
  const res = [];
  for (const arrangement of arrangementList.value ?? []) {
    res.push({
      dot: true,
      dates: new Date(arrangement.date),
    });
  }

  return res;
});

if (!userStore.loggedIn) {
  navigateTo('/auth/login');
} else {
  try {
    await $trpc.user.tokenValidity.query();
  } catch {
    navigateTo('/auth/login');
  }
  try {
    await songListSuspense();
    await canSubmitSuspense();
    await mySongListSuspense();
    await arrangementListSuspense();
    await remainSubmitSongsSuspense();
  } catch {
    navigateTo('/auth/login');
  }
  await listSuspense();
  if (announcementList.value &&
    announcementList.value.length > 0 &&
    userStore.lastLoginAt &&
    announcementList.value[0])
  {
    const lastLoginTime = new Date(userStore.lastLoginAt).getTime();
    const announcementTime = announcementList.value[0].createdAt.getTime();
    if (lastLoginTime < announcementTime) {
      toast.info("有新的公告等待查看",{ style: { background: 'red'}});
      userStore.lastLoginAt = new Date();
      $trpc.user.updateLoginTime.mutate();
    }else{
      userStore.lastLoginAt = new Date();
    };
  }
}

function logout() {
  userStore.logout();
  toast.success('登出成功');
  navigateTo('/auth/login');
}

type TLists = RouterOutput['song']['listSafe'];

const fuseOptions: UseFuseOptions<TLists[0]> = {
  fuseOptions: {
    keys: ['name', 'creator'],
    shouldSort: true,
  },
  matchAllWhenSearchEmpty: true,
};

const searchPrompt = ref('');
const fuse = songList.value === undefined
  ? useFuse<TLists[0]>(searchPrompt, [], fuseOptions)
  : useFuse<TLists[0]>(searchPrompt, songList, fuseOptions);

const filteredList = computed<TLists>(() => fuse.results.value.map(e => e.item));

const selectedTab = ref<'list' | 'arrangement' | 'mine'>('list');

const songPlayingConfig = ref({
  id: '',
  name: '',
  source: '',
  artists: '',
  imgId: '',
});
function playMusic(song: Partial<RouterOutput['song']['listSafe'][0]>){
  if (song.songId === null || song.source === null){
    toast.error('无歌曲数据');
    return;
  }
  songPlayingConfig.value.id = song.songId!;
  songPlayingConfig.value.name = song.name!;
  songPlayingConfig.value.artists = song.creator!;
  songPlayingConfig.value.source = song.source!;
  songPlayingConfig.value.imgId = song.imgId || '';
}
</script>
