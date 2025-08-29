<template>
  <main
    class="mx-auto flex max-w-screen-sm flex-col gap-4 p-5 lg:mx-auto lg:grid lg:h-screen lg:max-w-screen-xl lg:grid-cols-2 lg:gap-8 lg:p-10">
    <section class="flex flex-col gap-3 lg:self-center">
      <LogosSoe class="w-full" />

      <div class="grid grid-cols-2 gap-3">
        <div class="grid grid-rows-2 gap-3">
          <Button class="block h-full items-center gap-2" variant="outline">
            <div class="text-xs">
              本月已收集歌曲
            </div>
            <div class="text-2xl font-bold">
              {{ songList?.length || songGuestList?.length || 0 }}
            </div>
          </Button>
          <TimeAvailabilityDialog>
            <TimeAvailability is-card />
          </TimeAvailabilityDialog>
        </div>
        <Button class="size-full text-xl font-bold" :disabled="!canSubmit" variant="secondary"
          @click.prevent="navigateTo('/submit')">
          <div class="flex flex-col items-center">
            <span>
              <Icon name="lucide:music-4" size="26" class="mr-2" />
              投稿
            </span>
            <span v-if="userStore.loggedIn" class="text-sm font-normal">(剩余次数:{{ remainSubmitSongs?.valueOf() || 0
              }})</span>
            <span v-else class="text-sm font-normal">登录以点歌</span>
          </div>
        </Button>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <HomeRule>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:circle-help" class="mr-1" size="16" />
            <span>
              规则介绍
            </span>
          </Button>
        </HomeRule>

        <Button variant="outline" @click.prevent="navigateTo('/stats')" class="w-full" :disabled="!userStore.loggedIn">
          <Icon name="lucide:chart-column" class="mr-1" size="16" />
          数据统计
        </Button>

        <HomeAboutUs>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:info" class="mr-1" size="16" />
            关于我们
          </Button>
        </HomeAboutUs>
      </div>

      <div class="mt-4 flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button v-if="userStore.loggedIn" variant="ghost" class="w-full">
              <Avatar class="rounded-lg h-8 w-8">
                {{ userStore.name.slice(0, 1) }}
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ userStore.name }}</span>
                <span class="truncate text-xs" v-if="userStore.displayName">{{ userStore.displayName }}</span>
                <span class="truncate text-xs">{{ userStore.id }}</span>
              </div>
              <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom"
            :side-offset="4">
            <DropdownMenuLabel class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar class="rounded-lg h-8 w-8">
                  {{ userStore.name.slice(0, 1) }}
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ userStore.name }}</span>
                  <span class="truncate text-xs" v-if="userStore.displayName">{{ userStore.displayName }}</span>
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
              <Icon name="lucide:gauge" />
              管理
            </DropdownMenuItem>
            <DropdownMenuItem @click="logout">
              <Icon name="lucide:log-out" />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ModifyPasswordDialog />
        <Button v-if="!userStore.loggedIn" variant="outline" class="w-full" @click.prevent="navigateTo('/auth/login')">
          <Icon name="lucide:circle-user" size="20" />
          登录
        </Button>
        <div class="ml-auto flex gap-2" />
        <DarkModeToggle />
      </div>

      <div class="grid gap-3">
        <SongPlayer v-if="songPlayingConfig.id.length > 0" :id="songPlayingConfig.id" :name="songPlayingConfig.name"
          :artists="songPlayingConfig.artists" :source="songPlayingConfig.source" :img-id="songPlayingConfig.imgId" />
      </div>
    </section>

    <section class="lg:overflow-auto lg:px-4">
      <Tabs v-model="selectedTab" default-value="arrangement">
        <div class="sticky top-0 z-50 -mx-5 bg-background px-5 pt-4 lg:m-0 lg:p-0">
          <TabsList class="grid grid-cols-3">
            <TabsTrigger value="arrangement">
              排歌歌单
            </TabsTrigger>
            <TabsTrigger value="list">
              歌曲列表
            </TabsTrigger>
            <TabsTrigger value="notification" :disabled="!userStore.loggedIn" @click="hasNewAnnouncement=false">
              通知
              <span v-if="hasNewAnnouncement" class="absolute right-2 top-2 flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list" class="space-y-3">
          <Tabs v-model="listMode" default-value="songList">
            <div>
              <TabsList class="grid grid-cols-2">
                <TabsTrigger value="songList">
                  本月歌曲
                </TabsTrigger>
                <TabsTrigger value="myList" :disabled="!userStore.loggedIn">
                  我的歌曲
                </TabsTrigger>
              </TabsList>
              <div v-if="selectedTab === 'list'" class="relative mt-1 w-full items-center bg-background">
                <Input id="search" v-model="searchPrompt" type="text" placeholder="搜索歌曲" class="pl-8" />
                <span class="absolute inset-y-0 start-0 flex items-center justify-center pl-3">
                  <Icon name="lucide:search" class="text-muted-foreground" />
                </span>
              </div>
            </div>
            <TabsContent value="songList">
              <SongCard v-for="song in filteredList" :key="song.id" :song @songExport="playMusic" />
            </TabsContent>
            <TabsContent value="myList">
              <SongCard v-if="userStore.loggedIn" v-for="song in filteredList" :key="song.id" :song
                @songExport="playMusic" isMine />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="arrangement">
          <DatePicker v-model="selectedDate" mode="date" borderless expanded title-position="left" is-required
            :attributes="calendarAttr" :is-dark="isDark" class="mb-4 !bg-background" />
          <ul class="flex flex-col gap-3">
            <li v-for="song in arrangementListSongs" :key="song.id">
              <SongCard :song @songExport="playMusic" is-arrangement />
            </li>
          </ul>
        </TabsContent>
        <TabsContent value="notification">
          <div v-if="isAnnouncementListPending">
            <Icon name="lucide:loader-2" size="20" class="animate-spin" />
          </div>
          <HomeAnnouncement v-else :announcement-list="announcementList!" />
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
const hasNewAnnouncement = ref(false);

const { data: songList, refetch: songListRefetch } = useQuery({
  queryFn: () => $trpc.song.listSafe.query(),
  queryKey: ['song.listSafe'],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: songGuestList, refetch: songGuestListRefetch } = useQuery({
  queryFn: () => $trpc.song.listGuest.query(),
  queryKey: ['song.listGuest'],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: false,
});

const { data: mySongList, refetch: mySongListRefetch } = useQuery({
  queryFn: () => $trpc.song.listMine.query(),
  queryKey: ['song.listMine'],
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: canSubmit, refetch: canSubmitRefetch } = useQuery({
  queryFn: () => $trpc.song.canSubmit.query(),
  queryKey: ['song.canSubmit'],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: remainSubmitSongs, refetch: remainSubmitSongsRefetch } = useQuery({
  queryFn: () => $trpc.song.remainSubmitSongs.query(),
  queryKey: ['song.remainSubmitSongs'],
  refetchIntervalInBackground: false,
  refetchInterval: 10000,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: arrangementList, refetch: arrangementListRefetch } = useQuery({
  queryFn: () => $trpc.arrangements.listSafe.query(),
  queryKey: ['arrangements.listSafe'],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: arrangementGuestList, refetch: arrangementGuestListRefetch } = useQuery({
  queryFn: () => $trpc.arrangements.listGuest.query(),
  queryKey: ['arrangements.listGuest'],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  enabled: false,
});

const { data: announcementList, refetch: listRefetch, isPending: isAnnouncementListPending } = useQuery({
  queryFn: () => $trpc.announcement.listSafe.query(),
  queryKey: ['announcement.listSafe'],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  enabled: false,
})

function getDateString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

const arrangementListSongs = computed(
  () => {
    if (userStore.loggedIn){
      if (arrangementList.value){
        return arrangementList.value?.find(e => e.date === getDateString(selectedDate.value))?.songs || [];
      }
      return [];
    }else {
      return arrangementGuestList.value?.find(e => e.date === getDateString(selectedDate.value))?.songs || [];
    }
  }
);

const calendarAttr = computed(() => {
  const res = [];
  let list = userStore.loggedIn ? arrangementList.value : arrangementGuestList.value;
  for (const arrangement of list ?? []) {
    res.push({
      dot: true,
      dates: new Date(arrangement.date),
    });
  }

  return res;
});

if (!userStore.loggedIn) {
  // navigateTo('/auth/login');
  await arrangementGuestListRefetch();
  await songGuestListRefetch();
} else {
  try {
    await $trpc.user.tokenValidity.query();
  } catch {
    // navigateTo('/auth/login');
    userStore.loggedIn = false;
  }
  if (userStore.loggedIn) {
    try {
      await songListRefetch();
      await canSubmitRefetch();
      await mySongListRefetch();
      await arrangementListRefetch();
      await remainSubmitSongsRefetch();
    } catch {
      navigateTo('/auth/login');
    }
    await listRefetch();
    if (announcementList.value &&
      announcementList.value.length > 0 &&
      userStore.lastLoginAt &&
      announcementList.value[0]) {
      const lastLoginTime = new Date(userStore.lastLoginAt).getTime();
      const announcementTime = announcementList.value[0].createdAt.getTime();
      if (lastLoginTime < announcementTime) {
        hasNewAnnouncement.value = true;
        toast.warning("有新的公告等待查看");
        $trpc.user.updateLoginTime.mutate();
        userStore.lastLoginAt = (new Date()).toISOString();
      } else {
        userStore.lastLoginAt = (new Date()).toISOString();
      };
    }
  }else {
    await arrangementGuestListRefetch();
    await songGuestListRefetch();
  }
}

function logout() {
  userStore.logout();
  toast.success('登出成功');
  navigateTo('/auth/login');
}

type TLists = RouterOutput['song']['listSafe'];
type TGuestLists = RouterOutput['song']['listGuest'];
const listMode = ref<'songList' | 'myList'>('songList');

const fuseOptions: UseFuseOptions<TLists[0]> = {
  fuseOptions: {
    keys: ['name', 'creator'],
    shouldSort: true,
  },
  matchAllWhenSearchEmpty: true,
};
const fuseGuestOptions: UseFuseOptions<TGuestLists[0]> = {
  fuseOptions: {
    keys: ['name', 'creator'],
    shouldSort: true,
  },
  matchAllWhenSearchEmpty: true,
};

const searchPrompt = ref('');
const fuse = computed(() => {
  if (!userStore.loggedIn){
    return songGuestList.value === undefined
  ? useFuse<TGuestLists[0]>(searchPrompt, [], fuseGuestOptions)
  : useFuse<TGuestLists[0]>(searchPrompt, songGuestList, fuseGuestOptions);
  }
  if (listMode.value==='songList'){
    return songList.value === undefined
  ? useFuse<TLists[0]>(searchPrompt, [], fuseOptions)
  : useFuse<TLists[0]>(searchPrompt, songList, fuseOptions);
  }
  if (listMode.value==='myList'){
    return mySongList.value === undefined
  ? useFuse<TLists[0]>(searchPrompt, [], fuseOptions)
  : useFuse<TLists[0]>(searchPrompt, mySongList, fuseOptions);
  }
  return useFuse<TLists[0]>(searchPrompt, [], fuseOptions);
})

const filteredList = computed(() => fuse.value.results.value.map(e => e.item));

const selectedTab = ref<'list' | 'arrangement' | 'notification'>('arrangement');

const songPlayingConfig = ref({
  id: '',
  name: '',
  source: '',
  artists: '',
  imgId: '',
});
function playMusic(song: Partial<RouterOutput['song']['listSafe'][0]>) {
  if (song.songId === null || song.source === null) {
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
