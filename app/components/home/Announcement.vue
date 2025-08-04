<template>
  <ClientOnly>
    <template #fallback>
      <slot />
    </template>

    <Dialog>
      <DialogTrigger as-child>
        <slot />
      </DialogTrigger>
      <DialogScrollContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            公告
          </DialogTitle>
        </DialogHeader>
        <div v-if="announcementList && announcementList.length" v-for="item in announcementList">
          <Card class="p-4">
            <CardTitle>
              {{ formatDate(item.createdAt) }}
            </CardTitle>
            <CardDescription>
              <p>发布人：{{ item.creatorName }}</p>
            </CardDescription>
            <CardContent>
            <div class="prose-xl prose-blue prose-pre:bg-zinc-300 prose-pre:text-gray-800 text-sm m-1 p-3" v-html="$mdRenderer.render(item.markdown)" ></div>
            </CardContent>
          </Card>
        </div>
        <div v-else> 
          无公告
        </div>
      </DialogScrollContent>
    </Dialog>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';
const { $mdRenderer } = useNuxtApp();

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const { announcementList } = defineProps<{ announcementList: RouterOutput['announcement']['listSafe'] }>();
</script>