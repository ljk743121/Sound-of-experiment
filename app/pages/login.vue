<template>
  <div class="flex h-svh w-full justify-center lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
    <div class="flex items-center justify-center py-12">
      <div class="mx-auto grid w-[350px] gap-6">
        <div class="grid gap-2 text-center">
          <h1 class="text-3xl font-bold">
            登录
          </h1>
          <p class="text-balance text-muted-foreground">
            使用<span class="mx-1 font-mono font-light tracking-tighter text-blue-700">Sound of Experiment</span>账号登录
          </p>
        </div>
        <div class="grid gap-4">
          <form @submit.prevent="onSubmit">
            <FormField v-slot="{ componentField }" name="id">
              <FormItem v-auto-animate>
                <FormLabel>学号</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="StudentId" v-bind="componentField" />
                </FormControl>
                <FormDescription> 你的7位学号 </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem v-auto-animate>
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Password" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <br>
            <Button type="submit" class="w-full" :disable="isPending">
              <Icon v-if="isPending" name="lucide:loader-circle" class="mr-2 animate-spin" />
              登录
            </Button>
          </form>
        </div>
        <div class="mt-4 text-center text-sm">
          <p class="text-muted-foreground">
            没有<span class="mx-1 font-mono font-light tracking-tighter text-blue-700">Sound of Experiment</span>账号？
            <NuxtLink to="/register" class="text-primary">
              注册
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
    <div class="hidden items-center justify-center bg-muted lg:flex">
      <LogosSoe />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LogosSoe } from '#components';
import { vAutoAnimate } from '@formkit/auto-animate/vue';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';

const { $trpc } = useNuxtApp();

const formSchema = toTypedSchema(
  z.object({
    id: z.string().length(7, '校园卡号为7位数字').regex(/\d+/, '输入必须为数字').trim(),
    password: z.string().min(6, '最少为6个字符').max(16, '最多为16个字符').trim(),
  }),
);

const { handleSubmit } = useForm({
  validationSchema: formSchema,
});

const { mutate: login, isPending } = useMutation({
  mutationFn: $trpc.user.login.mutate,
  onSuccess: (res) => {
    useUserStore().login(res);
    toast.success('登录成功');
    navigateTo('/');
  },
  onError: err => useErrorHandler(err),
});

const onSubmit = handleSubmit(async (values) => {
  login(values);
});
</script>
