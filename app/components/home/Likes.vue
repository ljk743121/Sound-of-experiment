<template>
<ClientOnly>
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>点赞人</DialogTitle>
      </DialogHeader>
      <div class="grid grid-cols-2 gap-4">
        <div v-for="item in data">
          <div class="text-sm font-medium text-gray-900">{{ item }}</div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</ClientOnly>
</template>
<script setup lang="ts">

const { idList } = defineProps<{
  idList: string[];
}>();

const { $trpc } = useNuxtApp();

const { data } = useQuery({
  queryFn: () => $trpc.song.idToName.query(idList),
  queryKey: ['song.idToName'],
  refetchOnWindowFocus: false,
});

</script>