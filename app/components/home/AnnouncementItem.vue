<template>
  <Card class="border-none p-4">
    <CardTitle>
      <div v-if="item.createdAt" class="text-right text-xs text-muted-foreground">
        {{ timeAgo }}
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
</template>

<script setup lang="ts">
import type { RouterOutput } from "~~/types";

const props = defineProps<{
  item: RouterOutput["announcement"]["listSafe"][number];
}>();

const { $mdRenderer } = useNuxtApp();

const rawTimeAgo = useTimeAgo(() => props.item.createdAt ?? "");
const timeAgo = computed(() => (props.item.createdAt ? rawTimeAgo.value : undefined));
</script>
