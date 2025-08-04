<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>修改昵称</DialogTitle>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <FormField v-slot="{ componentField }" name="alias">
          <FormItem v-auto-animate>
            <FormLabel>新昵称</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <DialogFooter>
          <Button type="submit" class="mt-3" :disabled="isPending">
            <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
            修改
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { vAutoAnimate } from '@formkit/auto-animate/vue';
import { useForm } from 'vee-validate';
import z from 'zod';

const userStore = useUserStore();

const { $trpc } = useNuxtApp();

const formSchema = toTypedSchema(z.object({
  alias: z.string({ required_error: '请输入昵称' }).trim().min(1, '用户昵称长度应至少为1').max(32, '用户密码长度应至多为32'),
}));

const { handleSubmit } = useForm({
  validationSchema: formSchema,
});

const alias = ref('');

const { mutate: modifyAlias, isPending } = useMutation({
  mutationFn: $trpc.user.modifyAlias.mutate,
  onSuccess: () => {
    toast.success('修改成功');
    userStore.displayName = alias.value;
  },
  onError: err => useErrorHandler(err),
});

const onSubmit = handleSubmit(async (values) => {
  modifyAlias(values);
  alias.value = values.alias;
});
</script>
