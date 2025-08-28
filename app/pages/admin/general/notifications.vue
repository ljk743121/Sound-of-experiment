<template>
  <div class="p-8">
    <Card>
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

const { data: announcementList, isPending } = useQuery({
  queryFn: () => $trpc.announcement.listAdmin.query(),
  queryKey: ['announcement.listAdmin'],
  refetchOnWindowFocus: false,
  refetchIntervalInBackground: false,
})
</script>