<template>
  <div class="flex h-[calc(100svh-4rem)] flex-col gap-4 p-4">
    <div class="flex w-full max-w-sm items-center gap-1.5">
      <Input v-model="newWord" placeholder="添加屏蔽词" />
      <Button type="submit" :disabled="isPending" @click="create({ word: newWord.trim() })">
        <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
        添加
      </Button>
    </div>
    <div class="flex w-full max-w-sm items-center gap-1.5">
      <Input v-model="testWord" class="min-w-fit" placeholder="测试屏蔽词" />
      <Button type="button" :disabled="isChecking" @click="isBlocked({ content: testWord.trim() })">
        <Icon v-if="isChecking" name="lucide:loader-circle" class="mr-2 animate-spin" />
        测试
      </Button>
      <div class="ml-2 text-muted-foreground text-sm min-w-fit">
        违禁词：{{ isBlockedWord.blockedWords }}
      </div>
      <div class="items-center mt-1">
        <Icon v-if="isBlockedWord.isBlocked" name="lucide:alert-circle" class="text-red-500" />
        <Icon v-else name="lucide:check-circle" class="text-green-500" />
      </div>
    </div>
    <div class="flex w-full max-w-sm items-center gap-1.5">
      第三方敏感词检测
      <Switch v-if="isFetchedAfterMount" v-model="isApiOpen" @update:model-value="updateThirdPartyApi({ open: !isApiOpen })" />
    </div>
    <div
      class="flex h-[calc(100svh-9rem)] flex-col flex-wrap content-start gap-x-4 gap-y-2 overflow-x-scroll"
    >
      <Badge
        v-for="word in data"
        :key="word.word"
        variant="outline"
        class="relative w-40 truncate py-1.5"
      >
        {{ word.word }}
        <Icon
          name="lucide:x"
          class="absolute right-2 hover:cursor-pointer"
          @click="remove({ word: word.word })"
        />
      </Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});
const { $trpc } = useNuxtApp();

const { data } = useQuery({
  queryFn: () => $trpc.blockWords.list.query(),
  queryKey: ["blockWords.list"],
  refetchOnWindowFocus: false,
});

const newWord = ref("");
const testWord = ref("");
const isBlockedWord = ref({
  blockedWords: [] as string[],
  isBlocked: false,
});

const queryClient = useQueryClient();
const { mutate: create, isPending } = useMutation({
  mutationFn: $trpc.blockWords.create.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["blockWords.list"] });
    newWord.value = "";
  },
  onError: err => useErrorHandler(err),
});

const { mutate: remove } = useMutation({
  mutationFn: $trpc.blockWords.remove.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["blockWords.list"] });
    newWord.value = "";
  },
  onError: err => useErrorHandler(err),
});

const { mutate: isBlocked, isPending: isChecking } = useMutation({
  mutationFn: $trpc.blockWords.isBlocked.mutate,
  onSuccess: (res) => {
    isBlockedWord.value = res;
  },
});

const { data: isThirdPartyApi, isFetchedAfterMount } = useQuery({
  queryFn: () => $trpc.blockWords.isThirdPartyApiOpen.query(),
  queryKey: ["blockWords.isThirdPartyApiOpen"],
  refetchInterval: false,
});

const isApiOpen = computed(() => isThirdPartyApi.value === "true");

const { mutate: updateThirdPartyApi } = useMutation({
  mutationFn: $trpc.blockWords.updateThirdPartyApi.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["blockWords.isThirdPartyApiOpen"] });
    toast.success("更新成功");
  },
});
</script>
