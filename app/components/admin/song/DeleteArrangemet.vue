<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="destructive" :disabled="isPending" size="xs">
        <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
        <Icon name="lucide:trash" />
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>删除排期</DialogTitle>
        <DialogDescription>
          确认要删除<span text="text-muted-foreground">{{ date }}</span>排期吗？
          <p class="text-destructive">删除排期不会删除该排期中的歌曲</p>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary">
            取消
          </Button>
        </DialogClose>
        <Button variant="destructive" :disable="isPending" @click="mutate({ date })">
          <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">

const { date } = defineProps<{
  date: string;
}>();

const { $trpc } = useNuxtApp();

const isOpen = ref(false);

const queryClient = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: $trpc.arrangements.delete.mutate,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['arrangements.list'] });
    toast.success('删除成功');
    isOpen.value = false;
  },
  onError: err => useErrorHandler(err),
});
</script>
