<template>
  <div class="flex h-[calc(100svh-4rem)] flex-col gap-4 p-4">
    <h1>管理配置</h1>
    <div class="flex gap-2">
      <Table v-if="isFetchedAfterMount">
        <TableHeader>
          <TableRow>
            <TableHead> 权限 </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="config in data" :key="config.key">
            <TableCell class="font-medium">
              {{ defaultConfigs.find(item => item.key === config.key)?.label }}
            </TableCell>
            <TableCell class="text-right">
              <Switch
                :model-value="(config.value === 'true')"
                :disabled="isPending"
                @click="update({ key: config.key, value: (config.value === 'true' ? 'false' : 'true') })"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Icon v-else name="lucide:refresh-cw" class="animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defaultConfigs } from "~~/constants";

definePageMeta({
  layout: "admin",
});
const { $trpc } = useNuxtApp();

const { data, isFetchedAfterMount } = useQuery({
  queryFn: () => $trpc.config.getAll.query(),
  queryKey: ["config.getAll"],
  refetchInterval: false,
});

const queryClient = useQueryClient();
const { mutate: update, isPending } = useMutation({
  mutationFn: $trpc.config.update.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["config.getAll"] });
    toast.success("更新成功");
  },
  onError: err => useErrorHandler(err),
});
</script>
