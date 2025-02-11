<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="outline" size="xs" class="font-mono">
        {{ songs.filter((song) => !song.isRealName).length }}
      </Button>
    </SheetTrigger>
    <SheetContent class="overflow-scroll">
      <SheetHeader>
        <SheetTitle class="flex gap-2">
          <span>匿名点歌记录</span>
          <Badge variant="secondary">
            {{ songs.filter((song) => !song.isRealName).length }} 首
          </Badge>
        </SheetTitle>
        <SheetDescription />
      </SheetHeader>
      <div class="flex flex-col gap-3">
        <SongCard v-for="song in songs.filter((song) => !song.isRealName)" :key="song.id" :song />
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';

defineProps<{
  songs: RouterOutput['song']['listSafe'];
}>();
</script>
