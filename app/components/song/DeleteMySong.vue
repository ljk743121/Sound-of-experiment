<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="destructive" :disabled="isPending">
        <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
        <Icon name="lucide:trash" class="mr-1" />
        删除
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>删除歌曲</DialogTitle>
        <DialogDescription>
          确认要删除此歌曲吗？
          <p class="text-muted-foreground">歌曲名称：{{ song.name }}</p>
          <p class="text-muted-foreground">歌曲作者：{{ song.creator }}</p>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary">
            取消
          </Button>
        </DialogClose>
        <Button variant="destructive" :disable="isPending" @click="mutate({ id: song.id! })">
          <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';

const { song } = defineProps<{
  song: Partial<RouterOutput['song']['listMine'][0]>
}>();

const { $trpc } = useNuxtApp();

const isOpen = ref(false);

const queryClient = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: $trpc.song.deleteMine.mutate,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['song.listMine'] });
    await queryClient.invalidateQueries({ queryKey: ['song.listSafe'] });
    toast.success('删除成功');
    isOpen.value = false;
  },
  onError: err => useErrorHandler(err),
});
</script>
