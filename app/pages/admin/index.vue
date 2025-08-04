<template>
  <div class="p-8">
    <div class="grid gap-4 md:gap-8 lg:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            历史投稿数
          </CardTitle>
          <Icon name="lucide:chart-no-axes-column" class="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ data?.songCount }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            用户数
          </CardTitle>
          <Icon name="lucide:users" class="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ data?.userCount }}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            投稿状态
          </CardTitle>
          <Icon name="lucide:clock" class="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            <TimeAvailability class="px-0" />
          </div>
        </CardContent>
      </Card>
    </div>
    <Card class="mt-8 h-max">
      <CardHeader>
        <CardTitle>
          投稿统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          v-if="data?.chart"
          index="date"
          :data="data.chart"
          :categories="['approved', 'dropped', 'pending', 'rejected', 'used']"
          :rounded-corners="4"
        />
      </CardContent>
    </Card>
    <Card class="flex-1">
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>公告（管理员）</span>
          <Icon name="lucide:megaphone" size="20" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isPending">
          <div class="flex h-[calc(100svh-10rem)] w-full flex-col items-center justify-center">
            <Icon name="lucide:loader-2" size="20" class="animate-spin" />
          </div>
        </div>
        <div v-else-if="announcementList && announcementList.length" v-for="item in announcementList">
          <Card class="p-4">
            <CardTitle>
              {{ formatDate(item.createdAt) }}
            </CardTitle>
            <CardDescription>
              <p>发布人：{{ item.creatorName }}</p>
            </CardDescription>
            <CardContent>
            <div class="prose-xl prose-blue prose-pre:bg-zinc-300 prose-pre:text-gray-800 text-sm m-1 p-3" v-html="$mdRenderer.render(item.markdown)" ></div>
            </CardContent>
          </Card>
        </div>
        <div v-else> 
          无公告
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});
const userStore = useUserStore();

const { $trpc } = useNuxtApp();

try{
  await $trpc.user.adminValidity.query();
}catch{
  navigateTo('/')
}

const { $mdRenderer } = useNuxtApp();
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const { data, suspense } = useQuery({
  queryFn: () => $trpc.stats.dashboard.query(),
  queryKey: ['stats.dashboard'],
});

const { data: announcementList, suspense: listSuspense, isPending } = useQuery({
  queryFn: () => $trpc.announcement.listAdmin.query(),
  queryKey: ['announcement.listAdmin'],
})


await suspense();
await listSuspense();
</script>
