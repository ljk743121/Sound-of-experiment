<template>
  <UseTemplate>
    <form class="mx-auto grid max-w-screen-md grid-cols-1 gap-6 p-4 md:p-6" @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>歌曲名: {{ form.values.name }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" type="hidden" disabled
              class="cursor-not-allowed" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="creator">
        <FormItem>
          <FormLabel>歌手：{{ form.values.creator }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" type="hidden" disabled
              class="cursor-not-allowed" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="songId">
        <FormItem>
          <FormLabel>歌曲ID：{{ form.values.songId }}</FormLabel>
          <FormControl>
            <Input v-bind="componentField" type="hidden" disabled
              class="cursor-not-allowed" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="source">
        <FormItem>
          <FormLabel>来源</FormLabel>
          <FormControl>
            <Select v-bind="componentField">
              <SelectTrigger>
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wy">
                  网易云
                </SelectItem>
                <SelectItem value="tx">
                  QQ音乐
                </SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex w-full items-center gap-1.5">
        <Input id="search" v-model="SearchInput" type="text" :placeholder="tabStatus === 'search' ? '歌曲名或歌手' : '歌曲ID'"
          :disabled="isPending || songFetching" />
        <Button :disabled="isPending || songFetching || submitDisabled" @click.prevent="onSearch()">
          搜索
        </Button>
      </div>

      <div v-if="SearchKey.trim()" class="mt-4">
        <div v-if="!songFetching">
          <div v-if="songsList && songsList.length" class="flex flex-col gap-3 p-4">
            <Card>
              <CardHeader>
                <CardTitle>搜索结果</CardTitle>
                <CardDescription>共 {{ songsList.length }} 首</CardDescription>
              </CardHeader>
              <CardContent>
                <div v-for="songInfo in songsList" :key="songInfo.id" class="w-full">
                  <div
                    class="mx-auto flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-colors sm:max-w-md sm:flex-row">
                    <div class="flex-shrink-0">
                      <Avatar class="size-12 rounded">
                        <NuxtImg :src="getImgUrl(songInfo.imgId,songInfo.source)" class="object-cover"
                          :alt="songInfo.name" loading="lazy" />
                        <Icon name="lucide:music" size="24" />
                      </Avatar>
                    </div>
                    <div class="min-w-0 flex-grow">
                      <div class="mb-3 text-start">
                        <CardTitle class="line-clamp-1 text-base font-medium">
                          {{ songInfo.name }}
                        </CardTitle>
                        <CardDescription class="line-clamp-1 text-sm">
                          {{ songInfo.artists }}
                        </CardDescription>
                      </div>

                      <div class="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" class="min-w-[120px] flex-1 sm:flex-none"
                          :disable="submitDisabled" @click.prevent="() => { songPlayingConfig = songInfo; }">
                          <Icon name="lucide:play" class="mr-1" size="16" />
                          播放
                        </Button>

                        <Button size="sm" class="min-w-[120px] flex-1 sm:flex-none" :disabled="submitDisabled"
                          @click.prevent="() => {
                            form.setFieldValue('name', songInfo.name);
                            form.setFieldValue('creator', songInfo.artists);
                            form.setFieldValue('songId', songInfo.id);
                            form.setFieldValue('imgId', songInfo.imgId);
                            form.setFieldValue('duration', songInfo.duration);
                            selectedSong = {
                              songId: songInfo.id,
                              name: songInfo.name,
                              creator: songInfo.artists,
                              source: songInfo.source,
                              imgId: songInfo.imgId,
                              duration: songInfo.duration,
                            }
                          }">
                          <Icon name="lucide:check" class="mr-1" size="16" />
                          选择
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div v-if="songPlayingConfig.id.length < 1" class="text-center text-sm">
              选择歌曲试听或确认歌曲信息
            </div>
            <SongPlayer v-if="songPlayingConfig.id.length > 0" :id="songPlayingConfig.id" :name="songPlayingConfig.name"
              :artists=" songPlayingConfig.artists" :album=" songPlayingConfig.album" :source="songPlayingConfig.source"
              :img-id="songPlayingConfig.imgId" />
          </div>
          <div v-else class="flex w-full flex-col items-center justify-center">
            无搜索结果。
          </div>
        </div>
        <div v-else class="flex h-[calc(100svh-10rem)] w-full flex-col items-center justify-center">
          <Icon name="lucide:loader-circle" class="animate-spin" size="35" />
          正在搜索中...
        </div>
      </div>
      <FormField v-slot="{ componentField }" type="radio" name="submitType">
        <FormItem class="space-y-3">
          <FormLabel>投稿时名称</FormLabel>
          <FormControl>
            <RadioGroup class="flex flex-col space-y-1" v-bind="componentField">
              <FormItem class="flex items-center gap-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="realName" />
                </FormControl>
                <FormLabel class="font-normal">
                  实名
                </FormLabel>
              </FormItem>
              <FormItem class="flex items-center gap-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="anonymous" />
                </FormControl>
                <FormLabel class="font-normal">
                  匿名
                </FormLabel>
              </FormItem>
              <FormItem class="flex items-center space-y-0 gap-x-3">
                <FormControl>
                  <RadioGroupItem value="alias" :disabled="!userStore.displayName" />
                </FormControl>
                <FormLabel class="font-normal">
                  昵称 <span v-if="userStore.displayName">({{ userStore.displayName }})</span>
                </FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="message">
        <FormItem>
          <FormLabel>私密留言（可选）</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="msgPublic">
        <FormItem>
          <FormLabel>公开留言（可选）</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button type="submit" :disabled="isPending || submitDisabled">
        <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
        提交
      </Button>
    </form>
  </UseTemplate>

  <Card
    class="mx-auto max-w-screen-md border backdrop-blur-sm">
    <CardHeader>
      <div class="flex justify-end">
        <Button variant="outline" size="icon" @click.prevent="navigateTo('/')">
          <Icon name="lucide:arrow-right" class="h-4 w-4" />
        </Button>
      </div>
      <CardTitle class="text-lg font-semibold">
        歌曲投稿
      </CardTitle>
      <CardDescription>
        投稿前请确认：
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>检查是否已有相同歌曲</li>
          <li>确保歌曲信息准确</li>
          <li>选择合适的投稿方式</li>
        </ul>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs default-value="search">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="search" @click="tabStatus = 'search'">
            搜索歌曲
          </TabsTrigger>
          <TabsTrigger value="id" @click="tabStatus = 'id'">
            歌曲ID
          </TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          <GridForm />
        </TabsContent>
        <TabsContent value="id">
          <GridForm />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import type { TMediaSource, RouterOutput, TSubmitType } from '~~/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SongPlayer from '~/components/song/SongPlayer.vue';
import * as z from 'zod';
import { getImgUrl } from '~~/constants';
// import { songFetching } from '~/composables/ClientSearch';

const { $trpc } = useNuxtApp();

definePageMeta({
  title: '歌曲投稿',
});
const submitDisabled = ref(true);

try {
  await $trpc.user.tokenValidity.query();
} catch {
  navigateTo('/auth/login');
}
try {
  const canSubmit = await $trpc.song.canSubmit.query();
  if (!canSubmit)
    navigateTo('/');
  submitDisabled.value = false;
} catch {
  navigateTo('/');
}

const userStore = useUserStore();

// Reuse `form` section
const [UseTemplate, GridForm] = createReusableTemplate();

const tabStatus = ref<'search' | 'id'>('search');


const formSchema = toTypedSchema(z.object({
  name: z.string({ required_error: '请输入歌名' })
    .trim()
    .min(1, '请输入歌名')
    .max(128, '歌名长度最大为128')
    .refine(
      val => !(val.trim().startsWith('《') || val.trim().endsWith('》')),
      '歌曲名不需带书名号',
    ),
  creator: z.string({ required_error: '请输入歌手名' })
    .trim()
    .min(1, '请输入歌手名')
    .max(128, '歌手长度最大为128'),
  songId: z.string({ required_error: '请输入歌曲ID' }).trim().min(1, '请输入歌曲ID'),
  imgId: z.string().trim(),
  source: z.custom<TMediaSource>(),
  duration: z.number().positive(),
  submitType: z.custom<TSubmitType>(),
  message: z.string().trim().optional(),
  msgPublic: z.string().trim().optional(),
}));

const form = useForm({
  validationSchema: formSchema,
});

const { mutate, isPending } = useMutation({
  mutationFn: $trpc.song.create.mutate,
  onSuccess: () => {
    toast.success('提交成功！');
    submitDisabled.value = true;
    navigateTo('/');
  },
  onError: err => useErrorHandler(err),
});

const songPlayingConfig = ref<RouterOutput['search']['mixSearch'][0]>({
  id: '',
  name: '',
  album: '',
  source: '',
  artists: '',
  imgId: '',
  duration: 0,
});
const SearchKey = ref('');
// const SearchCount = ref(0);
const SearchInput = ref('');
const selectedSong = ref({
  songId: '',
  name: '',
  creator: '',
  source: '',
  imgId: '',
  duration: 0,
});

const onSubmit = form.handleSubmit((values) => {
  const finalValues = {
    ...values,
    name: selectedSong.value.name || values.name,
    creator: selectedSong.value.creator || values.creator,
    songId: selectedSong.value.songId || values.songId,
    source: (selectedSong.value.source as TMediaSource) || values.source,
    imgId: selectedSong.value.imgId || values.imgId,
    duration: selectedSong.value.duration || values.duration,
  };
  mutate(finalValues);
});

function onSearch() {
  // if (!(form.values.name?.trim() || form.values.creator?.trim())) {
  //   toast.error('请输入歌曲名和歌手名！');
  // } else if (!form.values.source) {
  //   toast.error('请选择歌曲来源！');
  // } else {
  //   SearchKey.value = `${form.values.name?.trim() || ''} ${form.values.creator?.trim() || ''}`.trim();
  // }
  if (SearchInput.value.trim().length < 1) {
    if (tabStatus.value === 'search') {
      toast.error('请输入歌曲名或歌手名！');
    } else {
      toast.error('请输入歌曲名或歌手名！');
    }
  } else if (!form.values.source) {
    toast.error('请选择歌曲来源！');
  } else {
    SearchKey.value = SearchInput.value.trim();
  }
}

const searchExport = ref({
  songs: [] as RouterOutput['search']['mixSearch'],
  isFetching: false,
})

const queryClient = useQueryClient();
// const songsList = ref<RouterOutput['search']['mixSearch']>([]);
const { isFetching: songFetching, data: songsList } = useQuery({
  queryFn: () => $trpc.search.mixSearch.query({
    key: SearchKey.value,
    type: tabStatus.value as 'search' | 'id',
    source: form.values.source!,
  }),
  queryKey: ['search.mixSearch'],
  refetchOnWindowFocus: false,
  enabled: computed(() => SearchKey.value.trim().length > 0),
});

// new song selected
watch(
  [() => SearchKey.value, () => form.values.source],
  async () => {
    if (SearchKey.value.trim().length === 0 || !form.values.source || !tabStatus.value){
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['search.mixSearch'] });
    // songsList.value = await searchSongs(SearchKey.value, tabStatus.value as 'search' | 'id', form.values.source!);
  },
);

watch(() => tabStatus.value, () => {
  form.resetForm({
    values: {
      name: '',
      creator: '',
      songId: '',
      source: undefined,
      imgId: '',
      duration: 0,
    },
  });
  // songsList.value = []; //have been cached by queryClient
  SearchKey.value = '';
  SearchInput.value = '';
  selectedSong.value = {
    songId: '',
    name: '',
    creator: '',
    source: '',
    imgId: '',
    duration: 0,
  };
  songPlayingConfig.value = {
    id: '',
    name: '',
    album: '',
    source: '',
    artists: '',
    imgId: '',
    duration: 0,
  };
});
</script>
