<template>
  <!-- 桌面端：可调整宽度的左右分栏 -->
  <div class="hidden h-[calc(100svh-4rem)] md:block">
    <ResizablePanelGroup
      id="review-resizable"
      direction="horizontal"
      class="h-full"
      @layout="layout = $event"
    >
      <ResizablePanel id="review-resizable-panel-1" :default-size="layout[0]">
        <ScrollArea class="h-full">
          <div class="sticky top-0 flex h-16 items-center border-b bg-background px-4">
            <Icon name="lucide:list-music" size="17" class="mr-2" />
            <span class="text-sm font-semibold">待审核歌曲</span>
            <Button
              variant="secondary"
              class="ml-auto"
              :disabled="acceptAllPending || !songList || songList.length === 0"
              @click.prevent="acceptAll"
            >
              <Icon name="lucide:check-circle" size="17" class="mr-2" />
              通过全部歌曲
              <Icon v-if="acceptAllPending" name="lucide:loader-circle" class="ml-2 animate-spin" />
            </Button>
          </div>
          <TransitionGroup name="list" tag="ul" class="flex flex-col gap-3 p-4">
            <li v-for="song in songList" :key="song.id">
              <LazySongCard
                type="review"
                :song
                :selected="selectedSong?.id === song.id"
                @click="selectedSong = song"
              />
            </li>
          </TransitionGroup>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle id="review-resizable-resize-1" with-handle />
      <ResizablePanel id="review-resizable-panel-2" :default-size="layout[1]">
        <ScrollArea class="h-full">
          <LazyAdminSongReview v-if="selectedSong" :song="selectedSong!" />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>

  <!-- 移动端：列表/详情分屏切换 -->
  <div class="h-[calc(100svh-4rem)] md:hidden">
    <!-- 歌曲列表 -->
    <div v-if="!mobileDetailOpen" class="grid h-full grid-rows-[4rem_1fr]">
      <div class="flex h-16 items-center border-b bg-background px-4">
        <Icon name="lucide:list-music" size="17" class="mr-2" />
        <span class="text-sm font-semibold">待审核歌曲</span>
        <Button
          variant="secondary"
          class="ml-auto"
          size="sm"
          :disabled="acceptAllPending || !songList || songList.length === 0"
          @click.prevent="acceptAll"
        >
          <Icon name="lucide:check-circle" size="16" class="mr-1.5" />
          <span class="hidden sm:inline">通过全部歌曲</span>
          <span class="sm:hidden">全部通过</span>
          <Icon v-if="acceptAllPending" name="lucide:loader-circle" class="ml-1.5 animate-spin" />
        </Button>
      </div>
      <div class="custom-scrollbar overflow-y-auto">
        <TransitionGroup name="list" tag="ul" class="flex flex-col gap-3 p-4">
          <li v-for="song in songList" :key="song.id">
            <LazySongCard
              type="review"
              :song
              :selected="selectedSong?.id === song.id"
              @click="selectSong(song)"
            />
          </li>
        </TransitionGroup>
        <div v-if="!songList?.length" class="flex h-64 items-center justify-center text-sm text-muted-foreground">
          暂无待审核歌曲
        </div>
      </div>
    </div>

    <!-- 审核详情 -->
    <div v-else class="grid h-full grid-rows-[4rem_1fr]">
      <div class="flex h-16 items-center gap-2 border-b bg-background px-4">
        <Button variant="outline" size="icon" aria-label="返回列表" @click="mobileDetailOpen = false">
          <Icon name="lucide:arrow-left" size="17" />
        </Button>
        <span class="text-sm font-semibold">审核详情</span>
      </div>
      <div class="custom-scrollbar overflow-y-auto">
        <LazyAdminSongReview v-if="selectedSong" :song="selectedSong!" />
        <div v-else class="flex h-64 items-center justify-center text-sm text-muted-foreground">
          请选择一首歌曲
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RouterOutput } from "~~/types";

definePageMeta({
  layout: "admin",
});

useHead({
  meta: [
    {
      name: "referrer",
      content: "no-referrer",
    },
  ],
});

const { $trpc } = useNuxtApp();
const queryClient = useQueryClient();
const layout = useCookie<number[]>("review-resizable:layout", {
  default: () => [35, 65],
});

const { data: songList } = useQuery({
  queryFn: () => $trpc.song.listReview.query(),
  queryKey: ["song.listReview"],
  refetchOnWindowFocus: false,
});

const selectedSong = ref<RouterOutput["song"]["listReview"][0] | undefined>(songList.value?.[0]);
const mobileDetailOpen = ref(false);

watch(songList, () => {
  selectedSong.value = songList.value?.[0];
});

watch(selectedSong, (song) => {
  if (!song)
    mobileDetailOpen.value = false;
});

function selectSong(song: RouterOutput["song"]["listReview"][0]) {
  selectedSong.value = song;
  mobileDetailOpen.value = true;
}

const { mutate: acceptAll, isPending: acceptAllPending } = useMutation({
  mutationFn: $trpc.song.review.acceptAll.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["song.listReview"] });
    toast.success("已通过所有歌曲");
  },
  onError: err => useErrorHandler(err),
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 9999px;
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
</style>
