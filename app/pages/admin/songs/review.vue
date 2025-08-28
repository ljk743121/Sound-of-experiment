<template>
  <ResizablePanelGroup id="review-resizable" direction="horizontal" @layout="layout = $event">
    <ResizablePanel id="review-resizable-panel-1" :default-size="layout[0]">
      <ScrollArea class="h-[calc(100svh-4rem)]">
        <div class="sticky top-0 flex h-16 items-center border-b bg-background px-4">
          <Icon name="lucide:list-music" size="17" class="mr-2" />
          <span class="text-sm font-semibold">待审核歌曲</span>
          <Button variant="secondary" class="ml-auto" @click.prevent="acceptAll" :disabled="acceptAllPending || !songList || songList.length === 0">
            <Icon name="lucide:check-circle" size="17" class="mr-2" />
            通过全部歌曲
          </Button>
        </div>
        <TransitionGroup name="list" tag="ul" class="flex flex-col gap-3 p-4">
          <li v-for="song in songList" :key="song.id">
            <SongCard
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
      <ScrollArea class="h-[calc(100svh-4rem)]">
        <AdminSongReview v-if="selectedSong" :song="selectedSong!" />
      </ScrollArea>
    </ResizablePanel>
  </ResizablePanelGroup>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';

definePageMeta({
  layout: 'admin',
});

const { $trpc } = useNuxtApp();
const queryClient = useQueryClient();
const layout = useCookie<number[]>('review-resizable:layout', {
  default: () => [35, 65],
});

const { data: songList } = useQuery({
  queryFn: () => $trpc.song.listReview.query(),
  queryKey: ['song.listReview'],
  refetchOnWindowFocus: false,
});

const selectedSong = ref<RouterOutput['song']['listReview'][0] | undefined>(songList.value?.[0]);
watch(songList, () => {
  selectedSong.value = songList.value?.[0];
});

const { mutate: acceptAll, isPending: acceptAllPending } = useMutation({
  mutationFn: $trpc.song.review.acceptAll.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['song.listReview'] });
    toast.success('已通过所有歌曲');
  },
  onError: err => useErrorHandler(err),
});

</script>
