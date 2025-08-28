<template>
  <span class="text-muted-foreground mr-2 my-auto">
    {{ remainSongs }}
  </span>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="xs">
        <Icon name="lucide:refresh-cw" />
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>重置提交次数</DialogTitle>
        <DialogDescription>
          将用户的提交次数重置为：
          <span class="font-mono text-muted-foreground">{{ maxSongs }}</span>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary">
            取消
          </Button>
        </DialogClose>
        <Button :disable="isPending" @click="mutate({ id, maxSongs })">
          <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const { id, remainSongs, maxSongs } = defineProps<{
  id: string;
  remainSongs: number;
  maxSongs: number;
}>();

const { $trpc } = useNuxtApp();

const isOpen = ref(false);

const queryClient = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: $trpc.user.resetRemainSongs.mutate,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['user.listSongs'] });
    toast.success('重置成功');
    isOpen.value = false;
  },
  onError: err => useErrorHandler(err),
});
</script>
