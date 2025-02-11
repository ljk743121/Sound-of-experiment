<template>
  <NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />
  <Toaster position="top-center" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import '@ztl-uwu/v-calendar/style.css';

useHeadSafe({
  titleTemplate: (title?: string) => !title ? 'Sound of Experiment 点歌系统' : `${title} | Sound of Experiment 点歌系统`,
  meta: [{ name: 'description', content: 'Sound of Experiment 点歌系统 Made by Ljk743121.' }],
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
