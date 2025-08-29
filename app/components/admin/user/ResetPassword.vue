<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="destructive" size="xs">
        <Icon name="lucide:refresh-cw" />
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>重置密码</DialogTitle>
        <DialogDescription>
          <div>
            该用户的密码将被重置为<span class="font-semibold">{{ resetPassword }}</span>
          </div>
          确定要重置
          <span class="font-semibold">{{ name }}</span>
          的密码吗？
        </DialogDescription>
      </DialogHeader>
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="pwd">输入你的密码</Label>
        <Input id="pwd" v-model="pwd" type="password" placeholder="密码"/>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary">
            取消
          </Button>
        </DialogClose>
        <Button variant="destructive" :disable="isPending" @click="mutate({ id, pwd })">
          <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { resetPassword } from '~~/constants';

const { id,name } = defineProps<{
  id: string;
  name: string;
}>();

const { $trpc } = useNuxtApp();

const isOpen = ref(false);
const pwd = ref('');

const queryClient = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: $trpc.user.resetPassword.mutate,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['user.listUser'] });
    toast.success('重置成功');
    isOpen.value = false;
  },
  onError: err => useErrorHandler(err),
});
</script>
