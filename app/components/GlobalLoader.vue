<template>
  <Transition name="global-loader">
    <div
      v-if="!isReady"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
      aria-busy="true" aria-live="polite"
    >
      <div class="flex flex-col items-center gap-6">
        <div class="relative">
          <div class="absolute inset-0 rounded-2xl bg-primary/20 motion-safe:animate-ping" />
          <div
            class="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20"
          >
            <LogosSchoolFm class="size-full" />
          </div>
        </div>

        <div class="flex flex-col items-center gap-3 text-center">
          <h1 class="text-2xl font-bold tracking-tight">
            SchoolFm | {{ SCHOOL_NAME }}
          </h1>
          <p class="text-sm text-muted-foreground">
            正在加载中...
          </p>
          <div class="w-64 space-y-1.5">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all duration-200 ease-out"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              {{ Math.round(progress) }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { SCHOOL_NAME } from "~~/constants";

const isReady = ref(false);
const progress = ref(0);

onMounted(() => {
  const minimumDisplayTime = 600;
  const startTime = Date.now();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const finish = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    progress.value = 100;

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minimumDisplayTime - elapsed);

    setTimeout(() => {
      isReady.value = true;
    }, remaining + 150);
  };

  intervalId = setInterval(() => {
    if (progress.value < 85) {
      progress.value += Math.random() * 6 + 2;
      if (progress.value > 85) {
        progress.value = 85;
      }
    }
  }, 180);

  if (document.readyState === "complete") {
    finish();
  } else {
    window.addEventListener("load", finish, { once: true });
  }
});
</script>

<style scoped>
.global-loader-leave-active {
  transition:
    opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.global-loader-leave-to {
  opacity: 0;
  transform: scale(1.05);
  pointer-events: none;
}
</style>
