<template>
  <UseTemplate>
    <form class="grid grid-cols-1 gap-4" @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>歌曲名</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormDescription class="text-xs">
            不需带书名号
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="creator">
        <FormItem>
          <FormLabel>歌手</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FetchSongs :song="searchKey" />

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
              <!-- <FormItem class="flex items-center space-y-0 gap-x-3">
                <FormControl>
                  <RadioGroupItem value="none" />
                </FormControl>
                <FormLabel class="font-normal">
                  自定义
                </FormLabel>
              </FormItem> -->
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="message">
        <FormItem>
          <FormLabel>投稿留言（可选）</FormLabel>
          <FormControl>
            <Textarea v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button type="submit" :disabled="isPending">
        <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
        提交
      </Button>
    </form>
  </UseTemplate>

  <Dialog v-if="isDesktop" v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>歌曲投稿</DialogTitle>
        <DialogDescription>
          投稿之前请在首页搜索查看是否有其他人投了这首歌哦！
        </DialogDescription>
      </DialogHeader>
      <GridForm />
    </DialogContent>
  </Dialog>

  <Drawer v-else v-model:open="isOpen">
    <DrawerTrigger as-child>
      <slot />
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader class="text-left">
        <DrawerTitle>歌曲投稿</DrawerTitle>
        <DrawerDescription>
          投稿之前请在首页搜索查看是否有其他人投了这首歌哦！
        </DrawerDescription>
      </DrawerHeader>
      <GridForm class="px-4" />
      <DrawerFooter class="pt-2">
        <DrawerClose as-child>
          <Button variant="outline">
            取消
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

<script lang="ts" setup>
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import * as z from 'zod';

const { $trpc } = useNuxtApp();

// Reuse `form` section
const [UseTemplate, GridForm] = createReusableTemplate();
const isDesktop = useMediaQuery('(min-width: 768px)');

const isOpen = ref(false);
const title = ref('');
const creator = ref('');
const searchKey = computed(() => `${title.value} ${creator.value}`);

const formSchema = toTypedSchema(z.object({
  name: z.string({ required_error: '请输入歌名' })
    .min(1, '请输入歌名')
    .max(50, '歌名长度最大为50')
    .refine(
      val => (!(val.trim().startsWith('《') || val.trim().endsWith('》')) || (title.value = val.trim())),
      '歌曲名不需带书名号',
    ),
  creator: z.string({ required_error: '请输入歌手名' })
    .min(1, '请输入歌手名')
    .max(20, '歌手长度最大为20')
    .refine(
      val => (creator.value = val.trim()),
    ),
  submitType: z.enum(['realName', 'anonymous']).refine(
    val => (val === 'anonymous' || val === 'realName'),
    '请选择提交方式',
  ),
  message: z.string().optional(),
}));

const form = useForm({
  validationSchema: formSchema,
});

const queryClient = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: $trpc.song.create.mutate,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['song.canSubmit'] });
    queryClient.invalidateQueries({ queryKey: ['song.listSafe'] });
    queryClient.invalidateQueries({ queryKey: ['song.listMine'] });
    isOpen.value = false;
  },
  onError: err => useErrorHandler(err),
});

const onSubmit = form.handleSubmit((values) => {
  mutate(values);
});
</script>
