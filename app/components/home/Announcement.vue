<template>
  <ClientOnly>
    <div v-if="announcementList && announcementList.length">
      <div v-for="(item, index) in announcementList" :key="index">
        <Card class="border-none p-4">
          <CardTitle>
            <div v-if="item.createdAt" class="text-right text-xs text-muted-foreground">
              {{ useTimeAgo(item.createdAt) }}
            </div>
          </CardTitle>
          <CardDescription>
            <p class="ml-2 text-muted-foreground">
              发布人：{{ item.creatorName }}
            </p>
          </CardDescription>
          <CardContent>
            <div
              class="prose-xl prose-blue prose-pre:bg-zinc-300 prose-pre:text-gray-800 m-1 p-3 text-sm"
              v-html="$mdRenderer.render(item.markdown || '')"
            />
          </CardContent>
        </Card>
      </div>
    </div>
    <div v-else>
      无公告
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { RouterOutput } from "~~/types";

const { announcementList } = defineProps<{
  announcementList: RouterOutput["announcement"]["listSafe"];
}>();

const { $mdRenderer } = useNuxtApp();
</script>
