<template>
  <ClientOnly>
    <div v-if="announcementList && announcementList.length">
      <div v-for="(item, index) in announcementList" :key="index">
        <HomeAnnouncementItem :item="item" />
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
</script>
