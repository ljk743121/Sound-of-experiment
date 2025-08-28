<template>
  <Card v-if="type === 'public'">
    <!-- class="hover:cursor-pointer" @click="isOpen = true" -->
    <CardHeader>
      <div class="flex flex-row">
        <Avatar class="size-12 rounded mr-4 relative overflow-hidden" :class="{ 'cursor-pointer': song.songId && song.source && song.songId.length > 0, 'cursor-not-allowed opacity-50': !(song.songId && song.source && song.songId.length > 0) }" @click.stop="handleAvatarClick">
          <NuxtImg v-if="song.imgId && song.source" :src="getImgUrl(song.imgId, song.source)" class="object-cover"
            :alt="song.name" loading="lazy" />
          <Icon name="lucide:music" size="24" />
          <div 
            v-if="song.songId && song.source && song.songId.length > 0"
            class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <Icon name="lucide:play" size="24" class="text-white" />
          </div>
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
              <span v-if="song.ownerDisplayName">提交者:{{ song.ownerDisplayName }}</span>
            </p>
          </CardDescription>
        </div>
        <div class="flex-grow" />
        <span v-if="song.createdAt" class="text-xs text-muted-foreground">
          {{ useTimeAgo(song.createdAt) }}
        </span>
      </div>
      <p v-if="song.msgPublic" class="text-xs text-muted-foreground">
        留言: {{ song.msgPublic }}
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
          <li v-if="song.msgPublic" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">留言</span>
            <span>{{ song.msgPublic }}</span>
          </li>
          <li v-if="song.message" class="flex justify-between">
            <span class="min-w-20 text-sm text-muted-foreground">私密留言</span>
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
          <span v-if="song.likes && !isArrangement">
            <Button v-if="song.likes.includes(userStore.id)" variant="outline" @click.prevent="disvote(song.id!)"
              :disabled="isDisVoting">
              <Icon name="lucide:heart" class="mr-1 fill-red-500 text-red-500" />
              取消点赞
              <Badge variant="destructive">{{ song.likes.length || 0 }}</Badge>
            </Button>
            <Button v-else variant="outline" @click.prevent="vote(song.id!)"
              :disabled="isVoting || !userStore.loggedIn">
              <Icon name="lucide:heart" class="mr-1" />
              点赞
              <Badge v-if="song.likes" variant="destructive">{{ song.likes.length || 0 }}</Badge>
            </Button>
            <!-- <HomeLikes v-if="song.likes" :idList="song.likes">
            <Button v-if="isMine" variant="ghost" class="text-sm text-muted-foreground" >
              <Icon name="lucide:info" class="mr-2" />
              点赞详情
            </Button>
          </HomeLikes> -->
          </span>
          <span v-if="isArrangement">
            <Button variant="outline" disabled>
              <Icon name="lucide:heart" class="mr-1" />
              <Badge variant="destructive">{{ userStore.loggedIn ? (song.likes?.length || 0) : "登录查看点赞数" }}</Badge>
            </Button>
          </span>
          <template v-if="isMine&&song.state&&song.state!=='used'">
            <SongDeleteMySong :song="song" />
          </template>
          <DialogTrigger as-child>
            <Button variant="outline" @click.stop="isOpen = true">
              <Icon name="lucide:info" class="mr-1" />
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
                <span v-if="song.ownerDisplayName">提交者:{{ song.ownerDisplayName }}</span>
              </p>
            </DialogDescription>
          </DialogHeader>
          <SongDrawer />
        </DialogContent>
      </Dialog>

      <Drawer v-else v-model:open="isOpen">
        <div class="flex justify-end">
          <span v-if="song.likes && !isArrangement">
            <Button v-if="song.likes.includes(userStore.id)" variant="outline" @click.prevent="disvote(song.id!)"
              :disabled="isDisVoting">
              <Icon name="lucide:heart" class="mr-1 fill-red-500 text-red-500" />
              取消点赞
              <Badge variant="destructive">{{ song.likes.length || 0 }}</Badge>
            </Button>
            <Button v-else variant="outline" @click.prevent="vote(song.id!)"
              :disabled="isVoting || !userStore.loggedIn">
              <Icon name="lucide:heart" class="mr-1" />
              点赞
              <Badge v-if="song.likes" variant="destructive">{{ Array.from(song.likes).length || 0 }}</Badge>
            </Button>
          </span>
          <span v-if="isArrangement">
            <Button variant="outline" disabled>
              <Icon name="lucide:heart" class="mr-1" />
              <Badge variant="destructive">{{ userStore.loggedIn ? (song.likes?.length || 0) : "登录以查看点赞数" }}</Badge>
            </Button>
          </span>
          <template v-if="isMine&&song.state&&song.state!=='used'">
            <SongDeleteMySong :song="song" />
          </template>
          <DrawerTrigger as-child>
            <Button variant="outline" @click.stop="isOpen = true">
              <Icon name="lucide:info" class="mr-1" />
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
                <span v-if="song.ownerDisplayName">提交者:{{ song.ownerDisplayName }}</span>
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
        <span v-if="song.ownerDisplayName">提交者:{{ song.ownerDisplayName }}</span>
      </p>
      <p v-if="song.message" class="text-xs text-muted-foreground">
        私密留言: {{ song.message }}
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
              <span v-if="song.ownerDisplayName">提交者:{{ song.ownerDisplayName }}</span>
            </p>
          </CardDescription>
        </div>
        <div class="flex-grow" />
        <span v-if="song.createdAt" class="text-xs text-muted-foreground">
          {{ useTimeAgo(song.createdAt) }}
        </span>
      </div>
      <p v-if="song.message" class="text-xs text-muted-foreground">
        私密留言: {{ song.message }}
      </p>
      <p v-if="song.msgPublic" class="text-xs text-muted-foreground">
        公开留言: {{ song.msgPublic }}
      </p>
      
      <div class="flex gap-1">
        <template v-if="song.state !== 'used' && song.state !== 'dropped'">
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
        </template>
        <AdminSongDeleteSong v-if="userStore.permissions.includes('deleteSong')" :song="song" />
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
  isMine = false,
} = defineProps<{
  type?: 'public' | 'review' | 'songs';
  selected?: boolean;
  song: Partial<RouterOutput['song']['listMine'][0]>;
  isArrangement?: boolean;
  isMine?: boolean;
}>();

const emit = defineEmits<{
  (e: 'songExport', songInformation: typeof song): void
}>()

const isOpen = ref(false);

const isDesktop = useMediaQuery('(min-width: 768px)');
const [UseTemplate, SongDrawer] = createReusableTemplate();

const { $trpc } = useNuxtApp();
const userStore = useUserStore();

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

const { mutate: vote, isPending: isVoting } = useMutation({
  mutationFn: $trpc.song.vote.mutate,
  onSuccess: () => {
    toast.success('点赞成功');
    queryClient.invalidateQueries({ queryKey: ['song.listMine'] });
    queryClient.invalidateQueries({ queryKey: ['song.listSafe'] });
    queryClient.invalidateQueries({ queryKey: ['arrangement.listSafe']});
  },
  onError: err => useErrorHandler(err),
})

const { mutate: disvote, isPending: isDisVoting } = useMutation({
  mutationFn: $trpc.song.disvote.mutate,
  onSuccess: () => {
    toast.success('取消点赞成功');
    queryClient.invalidateQueries({ queryKey: ['song.listMine'] });
    queryClient.invalidateQueries({ queryKey: ['song.listSafe'] });
    queryClient.invalidateQueries({ queryKey: ['arrangement.listSafe']});
  },
  onError: err => useErrorHandler(err),
})

const handleAvatarClick = (e: Event) => {
  e.stopPropagation();
  if (song.songId && song.source && song.songId.length > 0) {
    emit('songExport', song);
  }
}
</script>
