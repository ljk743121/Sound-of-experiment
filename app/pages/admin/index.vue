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
          <<HomeAnnouncement :announcement-list="announcementList!"/>
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

const { data } = useQuery({
  queryFn: () => $trpc.stats.dashboard.query(),
  queryKey: ['stats.dashboard'],
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
});

const { data: announcementList, isPending } = useQuery({
  queryFn: () => $trpc.announcement.listAdmin.query(),
  queryKey: ['announcement.listAdmin'],
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
})
</script>
