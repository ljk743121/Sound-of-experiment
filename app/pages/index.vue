<template>
  <main
    class="container mx-auto grid h-screen max-w-screen-xl grid-cols-1 gap-4 p-5 md:grid-cols-2 md:gap-8 md:p-10"
  >
    <section class="flex flex-col gap-3 md:self-center">
      <LogosSoe class="w-full" />

      <div class="grid grid-cols-2 gap-3">
        <div class="grid grid-rows-2 gap-3">
          <Button class="block h-full items-center gap-2" variant="outline">
            <div class="text-xs">
              两周已收集歌曲
            </div>
            <div class="text-2xl font-bold">
              {{ userStore.loggedIn ? songList?.length || songGuestList?.length || 0 : "?" }}
            </div>
          </Button>
          <TimeAvailabilityDialog>
            <TimeAvailability is-card />
          </TimeAvailabilityDialog>
        </div>
        <Button
          class="size-full text-xl font-bold"
          :disabled="!canSubmit"
          variant="secondary"
          @click.prevent="navigateTo('/submit')"
        >
          <div class="flex flex-col items-center">
            <span>
              <Icon name="lucide:music-4" size="26" class="mr-2" />
              投稿
            </span>
            <span v-if="userStore.loggedIn" class="text-sm font-normal">(剩余次数:{{ remainSubmitSongs?.valueOf() || 0 }})</span>
            <span v-else class="text-sm font-normal">登录以点歌</span>
          </div>
        </Button>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <HomeRule>
          <Button variant="outline" class="w-full">
            <Icon name="lucide:circle-help" class="mr-1" size="16" />
            <span> 规则介绍 </span>
          </Button>
        </HomeRule>

        <Button
          variant="outline"
          class="w-full"
          :disabled="!userStore.loggedIn"
          @click.prevent="navigateTo('/stats')"
        >
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
            <Button v-if="userStore.loggedIn" variant="ghost" class="min-w-max">
              <Avatar>
                <AvatarFallback>
                  {{ userStore.name.slice(0, 1) }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ userStore.name }}</span>
                <span v-if="userStore.displayName" class="truncate text-xs">{{
                  userStore.displayName
                }}</span>
                <span class="truncate text-xs">{{ userStore.id }}</span>
              </div>
              <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            :side-offset="4"
          >
            <DropdownMenuLabel class="p-0 font-normal">
              <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar>
                  <AvatarFallback>
                    {{ userStore.name.slice(0, 1) }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ userStore.name }}</span>
                  <span v-if="userStore.displayName" class="truncate text-xs">{{
                    userStore.displayName
                  }}</span>
                  <span class="truncate text-xs">{{ userStore.id }}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="navigateTo('/profile')">
              <Icon name="lucide:user-check" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="userStore.permissions.includes('admin')"
              @click="navigateTo('/admin')"
            >
              <Icon name="lucide:gauge" />
              管理
            </DropdownMenuItem>
            <DropdownMenuItem @click="logout">
              <Icon name="lucide:log-out" />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          v-if="!userStore.loggedIn"
          variant="outline"
          class="w-max"
          @click.prevent="navigateTo('/auth/login')"
        >
          <Icon name="lucide:circle-user" size="20" />
          登录/注册 <span class="text-muted-foreground">以使用完整功能</span>
        </Button>
        <div class="ml-auto flex gap-2" />
        <DarkModeToggle />
      </div>
    </section>

    <section class="md:overflow-auto md:px-4">
      <Tabs v-model="selectedTab" default-value="arrangement">
        <div class="-mx-5 bg-background px-5 pt-4 lg:m-0 lg:p-0">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="arrangement">
              排歌歌单
            </TabsTrigger>
            <TabsTrigger value="list">
              歌曲列表
            </TabsTrigger>
            <TabsTrigger
              value="notification"
              :disabled="!userStore.loggedIn"
              :class="{ 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': hasNewAnnouncement }"
              @click="() => {
                hasNewAnnouncement = false;
                updateLoginTime();
              }"
            >
              通知
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list" class="space-y-3">
          <Tabs v-model="listMode" default-value="songList">
            <div>
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="songList">
                  全部歌曲
                </TabsTrigger>
                <TabsTrigger value="myList" :disabled="!userStore.loggedIn">
                  我的歌曲
                </TabsTrigger>
              </TabsList>
              <div v-if="userStore.loggedIn" class="text-sm text-center bg-blue-50 text-blue-800 align-middle mx-auto flex rounded-xl border border-blue-200 shadow-sm p-3 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                <Icon name="lucide:info" class="mr-2 self-start flex-shrink-0 mt-0.5" />
                <span class="flex-grow">如果无法播放请点击刷新按钮</span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="ml-2 h-6 w-6 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800"
                  @click="deleteCache()"
                >
                  <Icon
                    name="lucide:refresh-cw"
                    class="h-4 w-4"
                  />
                </Button>
              </div>
              <div
                v-if="selectedTab === 'list'"
                class="relative mt-1 w-full items-center bg-background"
              >
                <Input
                  id="search"
                  v-model="searchPrompt"
                  type="text"
                  placeholder="搜索歌曲"
                  class="pl-8"
                />
                <span class="absolute inset-y-0 start-0 flex items-center justify-center pl-3">
                  <Icon name="lucide:search" class="text-muted-foreground" />
                </span>
              </div>
            </div>
            <TabsContent value="songList">
              <LazySongCard
                v-for="song in filteredList"
                :key="song.id"
                :song
                :is-playing="isTrackPlaying(song.id)"
                @song-export="playMusic"
              />
            </TabsContent>
            <TabsContent value="myList">
              <template v-if="userStore.loggedIn">
                <LazySongCard
                  v-for="song in filteredList"
                  :key="song.id"
                  :song
                  is-mine
                  :is-playing="isTrackPlaying(song.id)"
                  @song-export="playMusic"
                />
              </template>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="arrangement">
          <DatePicker
            v-model="selectedDate"
            mode="date"
            borderless
            expanded
            title-position="left"
            is-required
            :attributes="calendarAttr"
            :is-dark="isDark"
            class="mb-4 bg-background!"
          />
          <ul class="flex flex-col gap-3">
            <li v-for="song in arrangementListSongs" :key="song.id">
              <SongCard
                :song
                is-arrangement
                :is-playing="isTrackPlaying(song.id)"
                @song-export="playMusic"
              />
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
      <div class="h-16" />
      <ClientOnly>
        <MusicFlow v-if="userStore.loggedIn" :options="MusicFlowConfig" :fetch-url="fetchUrl" />
      </ClientOnly>
    </section>
    <div class="h-40" />
  </main>
</template>

<script setup lang="ts">
import type { RouterOutput } from "~~/types";
import { MusicFlow, type TMusicFlow } from "@ljk743121/vue-music-flow";
import { useFuse, type UseFuseOptions } from "@vueuse/integrations/useFuse";
import { DatePicker } from "@ztl-uwu/v-calendar";
import { getImgUrl, MusicFlowConfig } from "~~/constants";
// import { fetchMusicUrl } from "~~/deprecate/shared/plugin";

useHead({
  meta: [
    {
      name: "referrer",
      content: "no-referrer",
    },
  ],
});

const userStore = useUserStore();
const { $trpc } = useNuxtApp();
const queryClient = useQueryClient();

const selectedDate = ref(new Date());
const isDark = computed(() => useColorMode().preference === "dark");
const hasNewAnnouncement = ref(false);

if (userStore.loggedIn) {
  try {
    await $trpc.user.tokenValidity.query();
  } catch {
    userStore.logout();
  }
}

const { data: songList, suspense: songListSuspense } = useQuery({
  queryFn: () => $trpc.song.listSafe.query(),
  queryKey: ["song.listSafe"],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: songGuestList, suspense: songGuestListSuspense } = useQuery({
  queryFn: () => $trpc.song.listGuest.query(),
  queryKey: ["song.listGuest"],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: !userStore.loggedIn,
});

const { data: mySongList, suspense: mySongListSuspense } = useQuery({
  queryFn: () => $trpc.song.listMine.query(),
  queryKey: ["song.listMine"],
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: canSubmit, suspense: canSubmitSuspense } = useQuery({
  queryFn: () => $trpc.song.canSubmit.query(),
  queryKey: ["song.canSubmit"],
  refetchInterval: 10000,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: remainSubmitSongs, suspense: remainSubmitSongsSuspense } = useQuery({
  queryFn: () => $trpc.song.remainSubmitSongs.query(),
  queryKey: ["song.remainSubmitSongs"],
  refetchIntervalInBackground: false,
  refetchInterval: 10000,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: arrangementList, suspense: arrangementListSuspense } = useQuery({
  queryFn: () => $trpc.arrangements.listSafe.query(),
  queryKey: ["arrangements.listSafe"],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  enabled: userStore.loggedIn,
});

const { data: arrangementGuestList, suspense: arrangementGuestListSuspense } = useQuery({
  queryFn: () => $trpc.arrangements.listGuest.query(),
  queryKey: ["arrangements.listGuest"],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  enabled: !userStore.loggedIn,
});

const { data: announcementList, suspense: announcementListSuspense, isPending: isAnnouncementListPending } = useQuery({
  queryFn: () => $trpc.announcement.listSafe.query(),
  queryKey: ["announcement.listSafe"],
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  enabled: userStore.loggedIn,
});

function getDateString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

const arrangementListSongs = computed(() => {
  if (userStore.loggedIn) {
    if (arrangementList.value) {
      return (
        arrangementList.value?.find(e => e.date === getDateString(selectedDate.value))?.songs || []
      );
    }
    return [];
  } else {
    return (
      arrangementGuestList.value?.find(e => e.date === getDateString(selectedDate.value))?.songs
      || []
    );
  }
});

const calendarAttr = computed(() => {
  const res = [];
  const list = userStore.loggedIn ? arrangementList.value : arrangementGuestList.value;
  for (const arrangement of list ?? []) {
    res.push({
      dot: true,
      dates: new Date(arrangement.date),
    });
  }

  return res;
});

if (userStore.loggedIn) {
  try {
    await songListSuspense();
    await canSubmitSuspense();
    await mySongListSuspense();
    await arrangementListSuspense();
    await remainSubmitSongsSuspense();
  } catch {
    navigateTo("/auth/login");
  }
  await announcementListSuspense();
  if (
    announcementList.value
    && announcementList.value.length > 0
    && userStore.lastLoginAt
    && announcementList.value[0]
  ) {
    const lastLoginTime = new Date(userStore.lastLoginAt).getTime();
    const announcementTime = announcementList.value[0].createdAt.getTime();
    if (lastLoginTime < announcementTime) {
      hasNewAnnouncement.value = true;
      toast.warning("有新的公告等待查看");
    } else {
      userStore.lastLoginAt = new Date().toISOString();
    }
  }
} else {
  await arrangementGuestListSuspense();
  await songGuestListSuspense();
}

function updateLoginTime() {
  $trpc.user.updateLoginTime.mutate();
  userStore.lastLoginAt = new Date().toISOString();
}

function logout() {
  userStore.logout();
  toast.success("登出成功");
  navigateTo("/auth/login");
}

type TLists = RouterOutput["song"]["listSafe"];
type TGuestLists = RouterOutput["song"]["listGuest"];
const listMode = ref<"songList" | "myList">("songList");

const fuseOptions: UseFuseOptions<TLists[0]> = {
  fuseOptions: {
    keys: ["name", "creator"],
    shouldSort: true,
  },
  matchAllWhenSearchEmpty: true,
};
const fuseGuestOptions: UseFuseOptions<TGuestLists[0]> = {
  fuseOptions: {
    keys: ["name", "creator"],
    shouldSort: true,
  },
  matchAllWhenSearchEmpty: true,
};

const searchPrompt = ref("");
const fuse = computed(() => {
  if (!userStore.loggedIn) {
    return songGuestList.value === undefined
      ? useFuse<TGuestLists[0]>(searchPrompt, [], fuseGuestOptions)
      : useFuse<TGuestLists[0]>(searchPrompt, songGuestList, fuseGuestOptions);
  }
  if (listMode.value === "songList") {
    return songList.value === undefined
      ? useFuse<TLists[0]>(searchPrompt, [], fuseOptions)
      : useFuse<TLists[0]>(searchPrompt, songList, fuseOptions);
  }
  if (listMode.value === "myList") {
    return mySongList.value === undefined
      ? useFuse<TLists[0]>(searchPrompt, [], fuseOptions)
      : useFuse<TLists[0]>(searchPrompt, mySongList, fuseOptions);
  }
  return useFuse<TLists[0]>(searchPrompt, [], fuseOptions);
});

const filteredList = computed(() => fuse.value.results.value.map(e => e.item));

const selectedTab = ref<"list" | "arrangement" | "notification">("arrangement");

const { onPlayAsPlaylist, isTrackPlaying } = useMusicFlow();

const tracks = ref<TMusicFlow[]>([]);
const track = ref<TMusicFlow>();
const previousList = ref<string>();
const previousDate = ref(new Date());

useQuery({
  queryFn: () => $trpc.search.mixGetUrl.query,
  queryKey: ["search.mixGetUrl"],
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
  enabled: !!track.value,
});

// useQuery({
//   queryFn: () => track.value?.data?.songId && track.value?.data?.source
//     ? fetchMusicUrl(track.value.data.songId as string, track.value.data.source as string)
//     : Promise.resolve({ url: "", pay: false }),
//   queryKey: ["fetchMusicUrl"],
//   refetchOnWindowFocus: false,
//   refetchIntervalInBackground: false,
//   enabled: !!track.value?.data?.songId && !!track.value?.data?.source,
// });

async function fetchUrl(data: Record<string, unknown>) {
  if (!data)
    return "";
  if (!data.songId || !data.source)
    return "";
  const id = `${data.songId as string}-${data.source as string}`;
  if (userStore.songCache[id]) {
    return userStore.songCache[id]!;
  }
  await queryClient.invalidateQueries({ queryKey: ["search.mixGetUrl"] });
  const song = await queryClient.fetchQuery({
    queryKey: ["search.mixGetUrl"],
    queryFn: () =>
      $trpc.search.mixGetUrl.query({
        id: data.songId! as string,
        source: data.source! as string,
      }),
  });
  // await queryClient.invalidateQueries({ queryKey: ["fetchMusicUrl"] });
  // const song = await queryClient.fetchQuery({
  //   queryKey: ["fetchMusicUrl"],
  //   queryFn: () => fetchMusicUrl(data.songId! as string, data.source! as string),
  // });
  if (song) {
    if (song.url) {
      userStore.cacheSong(id, song.url);
    }
    return song.url;
  }
  return "";
}

async function playMusic(song: Partial<RouterOutput["song"]["listSafe"][0]>) {
  if (song.songId === null || song.source === null) {
    toast.error("无歌曲数据");
    return;
  }
  const isOutdate
    = (selectedTab.value === "list" ? listMode.value : selectedTab.value) !== previousList.value
      || selectedDate.value !== previousDate.value;
  if (!tracks.value.length || isOutdate) {
    let TrackList: TLists | undefined;
    if (selectedTab.value === "list") {
      if (listMode.value === "songList") {
        TrackList = songList.value;
      } else if (listMode.value === "myList") {
        TrackList = mySongList.value;
      }
    } else if (selectedTab.value === "arrangement") {
      if (selectedDate.value !== previousDate.value)
        TrackList = arrangementListSongs.value as TLists;
    }
    previousList.value = selectedTab.value === "list" ? listMode.value : selectedTab.value;
    if (TrackList) {
      tracks.value = Array.from(TrackList, (e) => {
        if (!e.songId || !e.source)
          return undefined;
        return {
          id: e.id!,
          title: e.name!,
          artist: e.creator!,
          artwork: e.imgId ? getImgUrl(e.imgId, e.source!) : "",
          album: "",
          data: {
            songId: e.songId,
            source: e.source!,
          },
        };
      }).filter(e => e !== undefined);
    }
  }
  track.value = {
    id: song.id!,
    title: song.name!,
    artist: song.creator!,
    artwork: song.imgId ? getImgUrl(song.imgId, song.source!) : "",
    album: "",
    data: {
      songId: song.songId,
      source: song.source!,
    },
  };
  onPlayAsPlaylist(tracks.value, track.value);
}

function deleteCache() {
  userStore.songCache = {};
  toast.success("已删除缓存");
  location.reload();
}
</script>
