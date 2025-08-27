<template>
  <ClientOnly>
    <div v-if="announcementList && announcementList.length" v-for="item in announcementList">
      <Card class="p-4 border-none">
        <CardTitle>
          <div v-if="item.createdAt" class="text-xs text-muted-foreground text-right">
          {{ useTimeAgo(item.createdAt) }}
          </div>
        </CardTitle>
        <CardDescription>
          <p class="text-muted-foreground ml-2">发布人：{{ item.creatorName }}</p>
        </CardDescription>
        <CardContent>
          <div class="prose-xl prose-blue prose-pre:bg-zinc-300 prose-pre:text-gray-800 text-sm m-1 p-3"
            v-html="$mdRenderer.render(item.markdown)"></div>
        </CardContent>
      </Card>
    </div>
    <div v-else>
      无公告
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';
const { $mdRenderer } = useNuxtApp();

const { announcementList } = defineProps<{ announcementList: RouterOutput['announcement']['listSafe'] }>();
</script>