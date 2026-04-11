<template>
  <div class="flex h-[calc(100svh-4rem)] flex-col gap-4 p-4">
    <div class="flex w-full max-w-sm items-center gap-1.5">
      <Button type="submit" :disabled="isRefetching" @click="refetch()">
        <Icon v-if="isRefetching" name="lucide:loader-circle" class="mr-2 animate-spin" />
        获取{{ userStore.id }}的机器人令牌
      </Button>
    </div>
    <Textarea v-if="data" v-model="data" class="w-full" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const { $trpc } = useNuxtApp();
const userStore = useUserStore();

const { data, isRefetching, refetch } = useQuery({
  queryFn: () => $trpc.user.getRobotToken.query(),
  queryKey: ["user.getRobotToken"],
  refetchOnWindowFocus: false,
  refetchInterval: false,
  enabled: false,
});
</script>
