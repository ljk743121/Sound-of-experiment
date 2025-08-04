<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>修改密码</DialogTitle>
        <DialogDescription>
          至少一个数字一个字母
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit">
        <FormField v-slot="{ componentField }" name="oldPassword">
          <FormItem v-auto-animate>
            <FormLabel>旧密码</FormLabel>
            <FormControl>
              <Input type="password" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="newPassword">
          <FormItem v-auto-animate>
            <FormLabel>新密码</FormLabel>
            <FormControl>
              <Input type="password" v-bind="componentField" />
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
import { pwRegex } from '~~/constants';

const userStore = useUserStore();

const { $trpc } = useNuxtApp();

const formSchema = toTypedSchema(z.object({
  oldPassword: z.string({ required_error: '请输入密码' }).min(6, '用户密码长度应至少为6').max(16, '用户密码长度应至多为16'),
  newPassword: z
    .string({ required_error: '请输入密码' })
    .min(6, '用户密码长度应至少为6')
    .max(16, '用户密码长度应至多为16')
    .regex(pwRegex, '密码必须包含字母、数字'),
}));

const { handleSubmit } = useForm({
  validationSchema: formSchema,
});

const { mutate: modifyPassword, isPending } = useMutation({
  mutationFn: $trpc.user.modifyPassword.mutate,
  onSuccess: () => {
    toast.success('修改成功');
    userStore.logout();
    navigateTo('/auth/login');
  },
  onError: err => useErrorHandler(err),
});

const onSubmit = handleSubmit(async (values) => {
  modifyPassword(values);
});
</script>
