<template>
  <footer
    class="relative z-10 flex flex-col gap-1 rounded-xl border bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur dark:bg-card/60 md:px-4"
  >
    <!-- 主行：封面 / 歌名 / 控制 / 音量 / 播放列表 -->
    <div class="flex items-center gap-2 md:gap-3">
      <!-- 封面：点击进入详情页 -->
      <button
        class="group relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted md:size-11"
        :disabled="!currentTrack"
        title="歌曲详情"
        aria-label="歌曲详情"
        @click="detailOpen = true"
      >
        <NuxtImg
          v-if="currentTrack?.artwork"
          :src="currentTrack.artwork"
          :alt="currentTrack?.title || '封面'"
          class="size-full object-cover"
          loading="lazy"
        />
        <Icon v-else name="lucide:music" class="m-auto size-5 text-muted-foreground" />
        <span
          v-if="currentTrack"
          class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Icon name="lucide:expand" class="size-4 text-white" />
        </span>
      </button>

      <!-- 歌名 / 歌手 -->
      <div class="w-28 min-w-0 shrink-0 cursor-pointer md:w-44" @click="detailOpen = true">
        <p class="truncate text-sm font-medium">
          {{ currentTrack?.title || "等待播放" }}
        </p>
        <p class="truncate text-xs" :class="errorMessage ? 'text-destructive' : 'text-muted-foreground'">
          {{ errorMessage || currentTrack?.artist || '' }}
        </p>
      </div>

      <!-- 播放控制 -->
      <div class="flex items-center gap-0.5 md:gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="size-8 md:size-9"
          :disabled="!currentTrack"
          title="上一首"
          aria-label="上一首"
          @click="onPlayPreviousTrack"
        >
          <Icon name="lucide:skip-back" class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-9 md:size-10"
          :disabled="!currentTrack"
          :title="isPlaying ? '暂停' : '播放'"
          aria-label="播放或暂停"
          @click="togglePlayback"
        >
          <Icon v-if="isLoading" name="lucide:loader-circle" class="size-4 animate-spin" />
          <Icon v-else :name="isPlaying ? 'lucide:pause' : 'lucide:play'" class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 md:size-9"
          :disabled="!currentTrack"
          title="下一首"
          aria-label="下一首"
          @click="onPlayNextTrack"
        >
          <Icon name="lucide:skip-forward" class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 md:size-9"
          :disabled="!playlist.length"
          :title="playModeText"
          aria-label="播放模式"
          @click="togglePlayMode"
        >
          <Icon :name="playModeIcon" class="size-4" />
        </Button>
      </div>

      <div class="flex-1 md:hidden" />

      <!-- 音量（桌面端） -->
      <div class="hidden items-center gap-1.5 md:flex">
        <Button
          variant="ghost"
          size="icon"
          class="size-8"
          :title="isMuted ? '取消静音' : '静音'"
          aria-label="静音"
          @click="toggleMute"
        >
          <Icon
            :name="isMuted || volume === 0 ? 'lucide:volume-x' : volume < 0.5 ? 'lucide:volume-1' : 'lucide:volume-2'"
            class="size-4"
          />
        </Button>
        <div
          ref="volumeBarRef"
          class="group relative h-4 w-14 cursor-pointer touch-none select-none lg:w-20"
          @mousedown.prevent="startVolumeDrag($event, volumeBarRef)"
          @click="handleVolumeClick($event, volumeBarRef)"
        >
          <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted">
            <div
              class="absolute inset-y-0 left-0 rounded-full bg-primary"
              :style="{ width: `${displayVolume}%` }"
            />
          </div>
          <div
            class="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow transition-opacity"
            :class="volumeDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            :style="{ left: `${displayVolume}%` }"
          />
        </div>
      </div>

      <!-- 播放列表 -->
      <Popover>
        <PopoverTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="relative size-8 md:size-9"
            :disabled="!playlist.length"
            title="播放列表"
            aria-label="播放列表"
          >
            <Icon name="lucide:list-music" class="size-4" />
            <span
              v-if="playlist.length"
              class="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
            >
              {{ playlist.length }}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" :side-offset="8" class="w-72 p-0 md:w-80">
          <div class="flex items-center justify-between border-b px-3 py-2">
            <span class="text-sm font-semibold">
              播放列表（{{ playlist.length }}）
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="size-7 text-muted-foreground hover:text-destructive"
              title="清空播放列表"
              aria-label="清空播放列表"
              @click="clearPlaylist"
            >
              <Icon name="lucide:trash-2" class="size-3.5" />
            </Button>
          </div>
          <ScrollArea class="h-64 md:h-72">
            <div class="p-1">
              <button
                v-for="(t, i) in playlist"
                :key="t.id"
                class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
                :class="{ 'bg-muted': isTrackPlaying(t.id) }"
                @click="playByIndex(i)"
              >
                <div class="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
                  <NuxtImg
                    v-if="t.artwork"
                    :src="t.artwork"
                    :alt="t.title"
                    class="size-full object-cover"
                    loading="lazy"
                  />
                  <Icon v-else name="lucide:music" class="m-auto size-4 text-muted-foreground" />
                  <span v-if="isTrackPlaying(t.id)" class="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Icon :name="isPlaying ? 'lucide:volume-2' : 'lucide:pause'" class="size-3.5 text-white" />
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm" :class="isTrackPlaying(t.id) ? 'font-medium text-primary' : ''">
                    {{ t.title }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ t.artist }}
                  </p>
                </div>
              </button>
              <p v-if="!playlist.length" class="py-10 text-center text-xs text-muted-foreground">
                播放列表为空，点击歌曲卡片开始播放
              </p>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>

    <!-- 进度条 -->
    <div class="flex items-center gap-2">
      <span class="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground md:w-10">
        {{ formattedCurrentTime }}
      </span>
      <div
        ref="progressBarRef"
        class="group relative h-4 min-w-0 flex-1 cursor-pointer touch-none select-none"
        :class="{ 'pointer-events-none opacity-60': !currentTrack }"
        @mousedown.prevent="startProgressDrag($event, progressBarRef)"
        @click="handleProgressClick($event, progressBarRef)"
      >
        <div
          class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted transition-all group-hover:h-1.5"
        >
          <div
            class="absolute inset-y-0 left-0 rounded-full bg-primary"
            :style="{ width: `${displayProgress}%` }"
          />
        </div>
        <div
          class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-md transition-opacity"
          :class="dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          :style="{ left: `${displayProgress}%` }"
        />
      </div>
      <span class="w-9 shrink-0 text-xs tabular-nums text-muted-foreground md:w-10">
        {{ formattedDuration }}
      </span>
    </div>

    <!-- 歌曲详情页（全屏覆盖层） -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="detailOpen"
          class="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md"
          @click.self="detailOpen = false"
        >
          <div class="flex items-center justify-between p-4">
            <span class="text-sm font-semibold">歌曲详情</span>
            <Button
              variant="ghost"
              size="icon"
              class="size-9"
              aria-label="关闭"
              @click="detailOpen = false"
            >
              <Icon name="lucide:x" class="size-5" />
            </Button>
          </div>

          <div class="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 pb-10">
            <!-- 大封面 -->
            <div class="relative aspect-square w-full max-w-64 overflow-hidden rounded-2xl bg-muted shadow-xl md:max-w-80">
              <NuxtImg
                v-if="currentTrack?.artwork"
                :src="currentTrack.artwork"
                :alt="currentTrack?.title || '封面'"
                class="size-full object-cover"
                loading="lazy"
              />
            </div>

            <!-- 歌名 / 歌手 -->
            <div class="w-full max-w-md text-center">
              <h2 class="line-clamp-2 text-xl font-bold">
                {{ currentTrack?.title || "等待播放" }}
              </h2>
              <p class="mt-1 text-sm" :class="errorMessage ? 'text-destructive' : 'text-muted-foreground'">
                {{ errorMessage || currentTrack?.artist || '' }}
              </p>
            </div>

            <!-- 进度 -->
            <div class="flex w-full max-w-md items-center gap-2">
              <span class="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {{ formattedCurrentTime }}
              </span>
              <div
                ref="detailProgressRef"
                class="group relative h-4 min-w-0 flex-1 cursor-pointer touch-none select-none"
                :class="{ 'pointer-events-none opacity-60': !currentTrack }"
                @mousedown.prevent="startProgressDrag($event, detailProgressRef)"
                @click="handleProgressClick($event, detailProgressRef)"
              >
                <div
                  class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted transition-all group-hover:h-1.5"
                >
                  <div
                    class="absolute inset-y-0 left-0 rounded-full bg-primary"
                    :style="{ width: `${displayProgress}%` }"
                  />
                </div>
                <div
                  class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-md transition-opacity"
                  :class="dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                  :style="{ left: `${displayProgress}%` }"
                />
              </div>
              <span class="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                {{ formattedDuration }}
              </span>
            </div>

            <!-- 控制 -->
            <div class="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                class="size-11"
                :disabled="!currentTrack"
                aria-label="上一首"
                @click="onPlayPreviousTrack"
              >
                <Icon name="lucide:skip-back" class="size-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                class="size-14 rounded-full"
                :disabled="!currentTrack"
                aria-label="播放或暂停"
                @click="togglePlayback"
              >
                <Icon v-if="isLoading" name="lucide:loader-circle" class="size-6 animate-spin" />
                <Icon v-else :name="isPlaying ? 'lucide:pause' : 'lucide:play'" class="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-11"
                :disabled="!currentTrack"
                aria-label="下一首"
                @click="onPlayNextTrack"
              >
                <Icon name="lucide:skip-forward" class="size-6" />
              </Button>
            </div>

            <!-- 播放模式 + 音量 -->
            <div class="flex w-full max-w-md items-center justify-center gap-6">
              <Button
                variant="outline"
                class="h-9 gap-1.5"
                :disabled="!playlist.length"
                :title="playModeText"
                @click="togglePlayMode"
              >
                <Icon :name="playModeIcon" class="size-4" />
                {{ playModeText }}
              </Button>
              <div class="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-9"
                  :title="isMuted ? '取消静音' : '静音'"
                  aria-label="静音"
                  @click="toggleMute"
                >
                  <Icon
                    :name="isMuted || volume === 0 ? 'lucide:volume-x' : volume < 0.5 ? 'lucide:volume-1' : 'lucide:volume-2'"
                    class="size-4"
                  />
                </Button>
                <div
                  ref="detailVolumeRef"
                  class="group relative h-4 w-28 cursor-pointer touch-none select-none"
                  @mousedown.prevent="startVolumeDrag($event, detailVolumeRef)"
                  @click="handleVolumeClick($event, detailVolumeRef)"
                >
                  <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted">
                    <div
                      class="absolute inset-y-0 left-0 rounded-full bg-primary"
                      :style="{ width: `${displayVolume}%` }"
                    />
                  </div>
                  <div
                    class="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow transition-opacity"
                    :class="volumeDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                    :style="{ left: `${displayVolume}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </footer>
</template>

<script setup lang="ts">
import type { TFetchUrlFunction } from "~/composables/useMusicPlayer";

defineOptions({ name: "MusicPlayer" });

const props = defineProps<{
  /** 异步获取歌曲链接的函数 */
  fetchUrl?: TFetchUrlFunction;
}>();

const {
  currentTrack,
  isPlaying,
  isLoading,
  progress,
  volume,
  isMuted,
  errorMessage,
  formattedCurrentTime,
  formattedDuration,
  playlist,
  playModeText,
  playModeIcon,
  togglePlayback,
  togglePlayMode,
  onPlayNextTrack,
  onPlayPreviousTrack,
  seekByPercent,
  playByIndex,
  setVolume,
  toggleMute,
  setFetchUrl,
  clearPlaylist,
  pause,
  isTrackPlaying,
} = useMusicPlayer();

// 将异步获取链接的函数注册到全局播放器
setFetchUrl(props.fetchUrl);
watch(
  () => props.fetchUrl,
  fn => setFetchUrl(fn),
);

// 歌曲详情页（全屏覆盖层）
const detailOpen = ref(false);

// 离开页面时暂停播放（播放列表与当前歌曲保留，回来可继续）
onUnmounted(() => pause());

// ── 进度条拖拽（底部条与详情页共用） ──
const progressBarRef = ref<HTMLElement | null>(null);
const detailProgressRef = ref<HTMLElement | null>(null);
const dragging = ref(false);
const dragProgress = ref(0);
const activeProgressBar = ref<HTMLElement | null>(null);

const displayProgress = computed(() => (dragging.value ? dragProgress.value : progress.value));

function pctFromEvent(e: MouseEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
}

function handleProgressClick(e: MouseEvent, el: HTMLElement | null) {
  if (!currentTrack.value || dragging.value || !el)
    return;
  seekByPercent(pctFromEvent(e, el));
}

function startProgressDrag(e: MouseEvent, el: HTMLElement | null) {
  if (!currentTrack.value || !el)
    return;
  e.preventDefault();
  dragging.value = true;
  activeProgressBar.value = el;
  dragProgress.value = progress.value;
  document.body.style.userSelect = "none";
  handleProgressMove(e);
}

function handleProgressMove(e: MouseEvent) {
  if (!dragging.value || !activeProgressBar.value)
    return;
  dragProgress.value = pctFromEvent(e, activeProgressBar.value);
}

function endProgressDrag() {
  if (dragging.value)
    seekByPercent(dragProgress.value);
  dragging.value = false;
  activeProgressBar.value = null;
  document.body.style.userSelect = "";
}

// ── 音量拖拽（底部条与详情页共用） ──
const volumeBarRef = ref<HTMLElement | null>(null);
const detailVolumeRef = ref<HTMLElement | null>(null);
const volumeDragging = ref(false);
const activeVolumeBar = ref<HTMLElement | null>(null);

const displayVolume = computed(() => (isMuted.value ? 0 : volume.value) * 100);

function handleVolumeClick(e: MouseEvent, el: HTMLElement | null) {
  if (!el)
    return;
  const rect = el.getBoundingClientRect();
  setVolume((e.clientX - rect.left) / rect.width);
}

function startVolumeDrag(e: MouseEvent, el: HTMLElement | null) {
  if (!el)
    return;
  e.preventDefault();
  volumeDragging.value = true;
  activeVolumeBar.value = el;
  document.body.style.userSelect = "none";
  handleVolumeMove(e);
}

function handleVolumeMove(e: MouseEvent) {
  if (!volumeDragging.value || !activeVolumeBar.value)
    return;
  const rect = activeVolumeBar.value.getBoundingClientRect();
  setVolume((e.clientX - rect.left) / rect.width);
}

function endVolumeDrag() {
  volumeDragging.value = false;
  activeVolumeBar.value = null;
  document.body.style.userSelect = "";
}

onMounted(() => {
  window.addEventListener("mousemove", handleProgressMove);
  window.addEventListener("mouseup", endProgressDrag);
  window.addEventListener("mousemove", handleVolumeMove);
  window.addEventListener("mouseup", endVolumeDrag);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleProgressMove);
  window.removeEventListener("mouseup", endProgressDrag);
  window.removeEventListener("mousemove", handleVolumeMove);
  window.removeEventListener("mouseup", endVolumeDrag);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
