<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="outline" size="xs" class="font-mono">
        {{ songs.filter((song) => song.isRealName).length }}/{{ songs.filter((song) => !song.isRealName).length }}/{{ songs.length }}
      </Button>
    </SheetTrigger>
    <SheetContent class="overflow-scroll">
      <SheetHeader>
        <SheetTitle class="flex gap-1">
          <span>点歌记录</span>
          <Badge variant="secondary">
            (实名) {{ songs.filter((song) => song.isRealName).length }} 首
          </Badge>
        </SheetTitle>
        <SheetDescription />
      </SheetHeader>
      <div class="flex flex-col gap-3">
        <SongCard v-for="song in songs.filter((song) => song.isRealName)" :key="song.id" :song />
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';

defineProps<{
  songs: RouterOutput['user']['list'][0]['songs'];
}>();
</script>
