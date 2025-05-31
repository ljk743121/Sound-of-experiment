<template>
  <div class="sticky top-0 flex h-16 items-center gap-2 border-b bg-background px-4">
    <Button variant="outline" :disable="approvePending" @click="approve({ id: song.id })">
      <Icon v-if="approvePending" name="lucide:loader-circle" class="mr-2 animate-spin" />
      <Icon name="lucide:check" size="17" />
    </Button>
    <Button variant="outline" :disable="rejectPending"
      @click="reject({ id: song.id, rejectMessage: rejectMessage.trim() })">
      <Icon v-if="rejectPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
      <Icon name="lucide:x" size="17" />
    </Button>
    <Input v-model="rejectMessage" placeholder="拒绝理由（≥ 4个字符）" />
  </div>
  <div v-if="song.message">
    <div class="text-2xl text-center text-foreground m-5">留言</div>
    <div class="text-base text-center m-2">{{ song.message }}</div>
  </div>
  <SongPlayer :id="song.songId" :name="song.name" :artists="song.creator" :source="song.source" :img-id="song.imgId" />
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';
import SongPlayer from '~/components/song/SongPlayer.vue';

const { song } = defineProps<{
  song: RouterOutput['song']['listReview'][0];
}>();

const { $trpc } = useNuxtApp();
const queryClient = useQueryClient();

const rejectMessage = ref('');

// new song selected
watch(() => song, async () => {
  rejectMessage.value = '';
});

const { mutate: approve, isPending: approvePending } = useMutation({
  mutationFn: $trpc.song.review.approve.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['song.listReview'] });
  },
  onError: err => useErrorHandler(err),
});

const { mutate: reject, isPending: rejectPending } = useMutation({
  mutationFn: $trpc.song.review.reject.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['song.listReview'] });
  },
  onError: err => useErrorHandler(err),
});
</script>
