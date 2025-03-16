<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="xs">
        <Icon name="lucide:square-pen" />
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>修改每周最大提交次数</DialogTitle>
        <DialogDescription>
          更改用户的每周最大提交次数。
        </DialogDescription>
      </DialogHeader>
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="maxTimes">最大提交次数</Label>
        <Input id="maxTimes" v-model="editMaxSongs" type="number" placeholder="Times" min="0" max="10" />
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary">
            取消
          </Button>
        </DialogClose>
        <Button :disable="isPending" @click="mutate({ id, maxSongs: editMaxSongs })">
          <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Badge variant="outline">
    {{ maxSongs }}
  </Badge>
</template>

<script setup lang="ts">
const { maxSongs } = defineProps<{
  id: string;
  maxSongs: number;
}>();

const { $trpc } = useNuxtApp();

const isOpen = ref(false);

const editMaxSongs = ref(maxSongs);

watch(isOpen, (v) => {
  if (!v)
    editMaxSongs.value = maxSongs;
});

const queryClient = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: $trpc.user.editMaxSongs.mutate,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['user.list'] });
    editMaxSongs.value = maxSongs;
    isOpen.value = false;
  },
  onError: err => useErrorHandler(err),
});
</script>
