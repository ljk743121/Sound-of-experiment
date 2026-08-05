/**
 * 全局音乐播放器组合式函数（底部播放条）
 *
 * 基于原生 HTMLAudioElement 实现的模块级单例，供页面任意位置调用：
 * - 支持通过异步函数 (fetchUrl) 动态获取歌曲链接
 * - 使用 <audio> 元素播放，mp4 容器仅播放音频轨、不渲染画面
 * - 提供播放/暂停、上一首/下一首、进度跳转、音量、播放列表等能力
 */
import { computed, ref, shallowRef } from "vue";

export interface TPlayerTrack {
  id: string | number;
  /** 已解析的直接音频地址（存在时优先使用） */
  audio?: string;
  title: string;
  artist: string;
  artwork: string;
  album: string;
  original?: Record<string, unknown>;
  /** 传递给 fetchUrl 用于动态获取音频地址的数据 */
  data?: Record<string, unknown>;
}

export type TFetchUrlFunction = (data: Record<string, unknown>) => string | Promise<string>;

/** 播放模式：列表循环 / 单曲循环 / 随机播放 */
export type TPlayMode = "list" | "single" | "random";

// ── 模块级单例状态（全局共享） ──
const playlist = ref<TPlayerTrack[]>([]);
const currentTrack = shallowRef<TPlayerTrack | null>(null);
const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.8);
const isMuted = ref(false);
const playMode = ref<TPlayMode>("list");
const errorMessage = ref<string | null>(null);

let audioEl: HTMLAudioElement | null = null;
let fetchUrlFn: TFetchUrlFunction | null = null;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0)
    return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined")
    return null;
  if (audioEl)
    return audioEl;

  audioEl = new Audio();
  audioEl.preload = "metadata";
  audioEl.volume = volume.value;

  audioEl.addEventListener("timeupdate", () => {
    currentTime.value = audioEl!.currentTime || 0;
  });
  audioEl.addEventListener("loadedmetadata", () => {
    duration.value = Number.isFinite(audioEl!.duration) ? audioEl!.duration : 0;
  });
  audioEl.addEventListener("durationchange", () => {
    duration.value = Number.isFinite(audioEl!.duration) ? audioEl!.duration : 0;
  });
  audioEl.addEventListener("play", () => {
    isPlaying.value = true;
    isLoading.value = false;
  });
  audioEl.addEventListener("pause", () => {
    isPlaying.value = false;
  });
  audioEl.addEventListener("waiting", () => {
    isLoading.value = true;
  });
  audioEl.addEventListener("canplay", () => {
    isLoading.value = false;
  });
  audioEl.addEventListener("playing", () => {
    isLoading.value = false;
  });
  audioEl.addEventListener("error", () => {
    isLoading.value = false;
    isPlaying.value = false;
    errorMessage.value = "音频加载失败，可点击歌曲卡片上的刷新按钮重试";
  });
  audioEl.addEventListener("ended", onEnded);

  return audioEl;
}

async function playTrack(track: TPlayerTrack) {
  currentTrack.value = track;
  currentTime.value = 0;
  duration.value = 0;
  errorMessage.value = null;

  // 解析音频地址：优先 track.audio，否则通过异步 fetchUrl 获取
  let src = track.audio;
  if (!src && track.data && fetchUrlFn) {
    isLoading.value = true;
    try {
      const url = await fetchUrlFn(track.data);
      src = url && url.trim() ? url.trim() : undefined;
    } catch (err) {
      console.error("获取歌曲链接失败:", err);
      isLoading.value = false;
      errorMessage.value = "获取歌曲链接失败";
      return;
    }
  }

  if (!src) {
    isLoading.value = false;
    errorMessage.value = "暂无可用音源";
    return;
  }

  const el = ensureAudio();
  if (!el)
    return;

  el.src = src;
  isLoading.value = true;
  try {
    await el.play();
  } catch (err) {
    // 自动播放被浏览器拦截时，等待用户再次点击播放
    console.warn("自动播放被拦截:", err);
    isLoading.value = false;
  }
}

function togglePlayback() {
  const el = ensureAudio();
  if (!el || !currentTrack.value)
    return;
  if (el.paused) {
    el.play().catch(err => console.warn("播放失败:", err));
  } else {
    el.pause();
  }
}

function pause() {
  ensureAudio()?.pause();
}

function playAsPlaylist(tracks: TPlayerTrack[], track?: TPlayerTrack) {
  if (!tracks.length)
    return;
  playlist.value = [...tracks];

  const target = track ?? tracks[0];
  if (!target)
    return;
  // 点击正在播放的歌曲时切换播放/暂停，避免重复加载
  if (currentTrack.value && target.id === currentTrack.value.id) {
    togglePlayback();
    return;
  }
  if (!playlist.value.some(t => t.id === target.id)) {
    playlist.value = [...playlist.value, target];
  }
  playTrack(target);
}

function playByIndex(index: number) {
  const track = playlist.value[index];
  if (!track)
    return;
  if (track.id === currentTrack.value?.id) {
    togglePlayback();
  } else {
    playTrack(track);
  }
}

function onEnded() {
  // 单曲循环：重播当前歌曲；其余模式自动切到下一首/随机
  if (playMode.value === "single") {
    const el = ensureAudio();
    if (el) {
      el.currentTime = 0;
      el.play().catch(err => console.warn("重播失败:", err));
    }
    return;
  }
  onPlayNextTrack();
}

function onPlayNextTrack() {
  const list = playlist.value;
  if (!list.length)
    return;
  if (!currentTrack.value) {
    playTrack(list[0]!);
    return;
  }
  const idx = list.findIndex(t => t.id === currentTrack.value!.id);
  let next: TPlayerTrack;
  if (playMode.value === "random" && list.length > 1) {
    let r = idx;
    while (r === idx) r = Math.floor(Math.random() * list.length);
    next = list[r]!;
  } else {
    next = list[idx < 0 || idx === list.length - 1 ? 0 : idx + 1]!;
  }
  playTrack(next);
}

function onPlayPreviousTrack() {
  const list = playlist.value;
  if (!list.length)
    return;
  if (!currentTrack.value) {
    playTrack(list[0]!);
    return;
  }
  // 已播放超过 3 秒则回到当前歌曲开头
  const el = ensureAudio();
  if (el && el.currentTime > 3) {
    el.currentTime = 0;
    currentTime.value = 0;
    return;
  }
  const idx = list.findIndex(t => t.id === currentTrack.value!.id);
  const prev = idx <= 0 ? list.length - 1 : idx - 1;
  playTrack(list[prev]!);
}

function togglePlayMode() {
  playMode.value = playMode.value === "list" ? "single" : playMode.value === "single" ? "random" : "list";
}

function setPlayMode(mode: TPlayMode) {
  playMode.value = mode;
}

const playModeText = computed(() => {
  switch (playMode.value) {
    case "single":
      return "单曲循环";
    case "random":
      return "随机播放";
    default:
      return "列表循环";
  }
});

const playModeIcon = computed(() => {
  switch (playMode.value) {
    case "single":
      return "lucide:repeat-1";
    case "random":
      return "lucide:shuffle";
    default:
      return "lucide:repeat";
  }
});

function seek(seconds: number) {
  const el = ensureAudio();
  if (!el)
    return;
  if (Number.isFinite(seconds)) {
    el.currentTime = seconds;
    currentTime.value = seconds;
  }
}

function seekByPercent(percent: number) {
  const target = duration.value * (percent / 100);
  seek(target);
}

function setVolume(v: number) {
  volume.value = Math.max(0, Math.min(1, v));
  const el = ensureAudio();
  if (el)
    el.volume = volume.value;
  if (volume.value > 0)
    isMuted.value = false;
}

function toggleMute() {
  const el = ensureAudio();
  if (!el)
    return;
  if (el.muted || isMuted.value) {
    el.muted = false;
    isMuted.value = false;
  } else {
    el.muted = true;
    isMuted.value = true;
  }
}

function setFetchUrl(fn?: TFetchUrlFunction) {
  fetchUrlFn = fn ?? null;
}

function stop() {
  const el = ensureAudio();
  if (el) {
    el.pause();
    el.removeAttribute("src");
    el.load();
  }
  isPlaying.value = false;
  isLoading.value = false;
  currentTime.value = 0;
}

function clearPlaylist() {
  stop();
  playlist.value = [];
  currentTrack.value = null;
  errorMessage.value = null;
}

function isTrackPlaying(id: string | number) {
  return currentTrack.value?.id === id && isPlaying.value;
}

const progress = computed(() => {
  if (!duration.value)
    return 0;
  return Math.min(100, (currentTime.value / duration.value) * 100);
});

const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));

export function useMusicPlayer() {
  return {
    // 状态
    playlist,
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    playMode,
    playModeText,
    playModeIcon,
    errorMessage,
    formattedCurrentTime,
    formattedDuration,

    // 播放控制
    playTrack,
    playAsPlaylist,
    playByIndex,
    togglePlayback,
    pause,
    onPlayNextTrack,
    onPlayPreviousTrack,
    togglePlayMode,
    setPlayMode,
    seek,
    seekByPercent,
    setVolume,
    toggleMute,
    setFetchUrl,
    stop,
    clearPlaylist,
    isTrackPlaying,
  };
}
