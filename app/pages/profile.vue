<template>
  <div
    class="flex h-screen w-full items-center justify-center lg:grid lg:min-h-[600px] xl:min-h-[800px]"
  >
    <Card class="mx-auto grid w-[350px] gap-6">
      <CardHeader>
        <div class="flex justify-end">
          <Button variant="outline" size="icon" @click.prevent="navigateTo('/')">
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
          </Button>
        </div>
        <CardTitle class="text-2xl">
          个人资料
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          <div class="grid gap-2">
            你的ID：
            <span class="text-muted-foreground">{{ userStore.id }}</span>
          </div>
          <div class="grid gap-2">
            你的姓名：
            <span class="text-muted-foreground">{{ userStore.name }}</span>
          </div>
          <div class="grid gap-2">
            你的昵称：
            <span class="text-muted-foreground">{{
              userStore.displayName ? userStore.displayName : "你还没有设置自己的昵称呢"
            }}</span>
          </div>
          <div class="grid gap-2">
            你的权限：
            <div>
              <Badge
                v-for="(permission, index) in permissionNames.filter(pm =>
                  userStore.permissions.includes(pm.value),
                )"
                :key="index"
                class="mr-2"
                variant="outline"
              >
                <Icon :name="permission.icon" class="mr-1" />
                {{ permission.label }}
              </Badge>
            </div>
          </div>
          <div class="mt-4 grid gap-2">
            可用操作：
            <LazyProfileModifyPasswordDialog>
              <Button>
                <Icon name="lucide:lock" />
                修改密码
              </Button>
            </LazyProfileModifyPasswordDialog>
            <LazyProfileModifyAliasDialog>
              <Button>
                <Icon name="lucide:user" />
                修改昵称
              </Button>
            </LazyProfileModifyAliasDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { permissionNames } from "~~/constants";

useHead({
  title: "个人资料",
});

const { $trpc } = useNuxtApp();
const userStore = useUserStore();

if (!userStore.loggedIn) {
  navigateTo("/auth/login");
}
try {
  await $trpc.user.tokenValidity.query();
} catch {
  navigateTo("/auth/login");
}
</script>
