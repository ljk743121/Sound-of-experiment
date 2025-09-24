<template>
  <NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />
  <Toaster
    position="top-right"
    class="pointer-events-auto"
    close-button
    rich-colors
    :duration="7000"
    expand
    :visible-toasts="5"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import "@ztl-uwu/v-calendar/style.css";

useHead({
  titleTemplate: (title?: string) =>
    !title ? "Voice of SZSY 点歌系统" : `${title} | Voice of SZSY 点歌系统`,
  meta: [
    {
      name: "description",
      content:
        "Voice of SZSY 点歌系统,Made by Ljk743121。开源校园广播站管理系统,支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
    },
    {
      name: "keywords",
      content:
        "深圳实验,校园点歌系统,广播站,管理系统,点歌平台,开源广播系统,教育科技,Nuxt3,Vue3,Voice of SZSY,voszsy,Github项目,开源项目",
    },
  ],
});
</script>

<style>
/* List animation */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
  width: 100%;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
