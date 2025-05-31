<template>
  <Card v-if="type === 'public'">
    <!-- class="hover:cursor-pointer" @click="isOpen = true" -->
    <CardHeader>
      <div class="flex flex-row">
        <Avatar class="size-12 rounded mr-4">
          <NuxtImg v-if="song.imgId && song.source" :src="getImgUrl(song.imgId, song.source)" class="object-cover"
            :alt="song.name" loading="lazy" />
          <Icon name="lucide:music" size="24" />
        </Avatar>
        <div>
          <CardTitle>
            {{ song.name }}
          </CardTitle>
          <CardDescription>
            歌手:{{ song.creator }}
            <p class="mt-1">
              <Badge variant="outline">
                {{ song.isRealName ? '实名' : '匿名' }}
              </Badge>
              <span v-if="song.isRealName" class="ml-2">提交者:{{ song.ownerDisplayName }}</span>
            </p>
          </CardDescription>
        </div>
        <div class="flex-grow" />
        <span v-if="song.createdAt" class="text-xs text-muted-foreground">
          {{ useTimeAgo(song.createdAt) }}
        </span>
      </div>
      <p v-if="song.message" class="text-xs text-muted-foreground">
        留言: {{ song.message }}
      </p>
      <SongState v-if="!isArrangement" :song />
    </CardHeader>

    <ClientOnly>
      <UseTemplate>
        <ul class="grid gap-3">
          <li v-if="song.duration" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">时长</span>
            <span class="font-mono">{{ formatDuration(song.duration) }}</span>
          </li>
          <li class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">审核状态</span>
            <SongState :song hide-reason />
          </li>
          <li v-if="song.rejectMessage" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">拒绝理由</span>
            <span>{{ song.rejectMessage }}</span>
          </li>
          <li v-if="song.arrangementDate" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">播放时间</span>
            <span class="font-mono">{{ song.arrangementDate }}</span>
          </li>
          <li v-if="song.message" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">留言</span>
            <span>{{ song.message }}</span>
          </li>
          <li v-if="song.createdAt" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">投稿时间</span>
            <span class="font-mono">{{ song.createdAt?.toLocaleString('zh-CN') }}</span>
          </li>
        </ul>
      </UseTemplate>
      <Dialog v-if="isDesktop" v-model:open="isOpen">
        <div class="flex justify-end">
          <Button :disabled="!(song.songId && song.source && song.songId.length > 0)"
            @click.prevent="$emit('songExport', song)">
              <Icon name="lucide:play" class="mr-2" />
              播放
          </Button>
          <DialogTrigger as-child>
            <Button variant="outline" @click.stop="isOpen = true">
              <Icon name="lucide:info" class="mr-2" />
              详情
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              <NuxtImg v-if="song.imgId && song.source" :src="getImgUrl(song.imgId, song.source)"
                class="object-cover mb-2" :alt="song.name" loading="lazy" />
              {{ song.name }}
            </DialogTitle>
            <DialogDescription>
              歌手:{{ song.creator }}
              <p class="mt-2">
                <Badge variant="outline">
                  {{ song.isRealName ? '实名' : '匿名' }}
                </Badge>
                <span v-if="song.isRealName" class="ml-2">提交者:{{ song.ownerDisplayName }}</span>
              </p>
            </DialogDescription>
          </DialogHeader>
          <SongDrawer />
        </DialogContent>
      </Dialog>

      <Drawer v-else v-model:open="isOpen">
        <div class="flex justify-end">
          <Button @click.prevent="$emit('songExport', song)">
            <Icon name="lucide:play" class="mr-2" />
            播放
          </Button>
          <DrawerTrigger as-child>
            <Button variant="outline" @click.stop="isOpen = true">
              <Icon name="lucide:info" class="mr-2" />
              详情
            </Button>
          </DrawerTrigger>
        </div>
        <DrawerContent>
          <DrawerHeader class="text-left">
            <DrawerTitle>
              <NuxtImg v-if="song.imgId && song.source" :src="getImgUrl(song.imgId, song.source)"
                class="object-cover mb-2" :alt="song.name" loading="lazy" />
              {{ song.name }}
            </DrawerTitle>
            <DrawerDescription>
              歌手:{{ song.creator }}
              <p>
                <Badge variant="outline">
                  {{ song.isRealName ? '实名' : '匿名' }}
                </Badge>
                <span v-if="song.isRealName">提交者:{{ song.ownerDisplayName }}</span>
              </p>
            </DrawerDescription>
          </DrawerHeader>
          <SongDrawer class="px-4" />
          <DrawerFooter class="pt-2" />
        </DrawerContent>
      </Drawer>
    </ClientOnly>
  </Card>
  <div v-else-if="type === 'review'"
    class="h-auto w-full cursor-pointer rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted"
    :class="{ 'bg-muted': selected }">
    <CardTitle>
      {{ song.name }}
    </CardTitle>
    <CardDescription>
      歌手:{{ song.creator }}
      <p>
        <Badge variant="outline">
          {{ song.isRealName ? '实名' : '匿名' }}
        </Badge>
        <span v-if="song.isRealName">提交者:{{ song.ownerDisplayName }}</span>
      </p>
    </CardDescription>
  </div>
  <Card v-else-if="type === 'songs'">
    <CardHeader>
      <div class="flex flex-row">
        <div>
          <CardTitle>
            {{ song.name }}
          </CardTitle>
          <CardDescription>
            歌手:{{ song.creator }}
            <p>
              <Badge variant="outline">
                {{ song.isRealName ? '实名' : '匿名' }}
              </Badge>
              <span v-if="song.isRealName">提交者:{{ song.ownerDisplayName }}</span>
            </p>
          </CardDescription>
        </div>
        <div class="flex-grow" />
        <span v-if="song.createdAt" class="text-xs text-muted-foreground">
          {{ useTimeAgo(song.createdAt) }}
        </span>
      </div>
      <p v-if="song.message" class="text-xs text-muted-foreground">
        留言: {{ song.message }}
      </p>

      <div v-if="song.state !== 'used' && song.state !== 'dropped'" class="flex gap-1">
        <Button v-if="song.state !== 'approved' && song.id" variant="outline" :disable="approvePending" size="xs"
          @click="approve({ id: song.id })">
          <Icon v-if="approvePending" name="lucide:loader-circle" class="mr-2 animate-spin" />
          <Icon name="lucide:check" />
        </Button>
        <template v-if="song.state !== 'rejected' && song.id">
          <Button variant="outline" :disable="rejectPending" size="xs"
            @click="reject({ id: song.id, rejectMessage: rejectMessage.trim() })">
            <Icon v-if="rejectPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
            <Icon name="lucide:x" />
          </Button>
          <Input v-model="rejectMessage" placeholder="拒绝理由" class="h-7 rounded-sm text-xs" />
        </template>
      </div>
    </CardHeader>
  </Card>
</template>

<script setup lang="ts">
import type { RouterOutput } from '~~/types';
import { getImgUrl } from '~~/constants';

const {
  song,
  type = 'public',
  selected = false,
  isArrangement = false,
} = defineProps<{
  type?: 'public' | 'review' | 'songs';
  selected?: boolean;
  song: Partial<RouterOutput['song']['listMine'][0]>;
  isArrangement?: boolean;
}>();

const songExport = defineEmits<{
  (e: 'songExport', songInformation: typeof song): void
}>()

const isOpen = ref(false);

const isDesktop = useMediaQuery('(min-width: 768px)');
const [UseTemplate, SongDrawer] = createReusableTemplate();

const { $trpc } = useNuxtApp();

const queryClient = useQueryClient();
const { mutate: approve, isPending: approvePending } = useMutation({
  mutationFn: $trpc.song.review.approve.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['song.list'] });
  },
  onError: err => useErrorHandler(err),
});

const { mutate: reject, isPending: rejectPending } = useMutation({
  mutationFn: $trpc.song.review.reject.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['song.list'] });
  },
  onError: err => useErrorHandler(err),
});

const rejectMessage = ref('');

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}
</script>
