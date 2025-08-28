<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import type { TPermission } from '~~/types';
import NavUser from './NavUser.vue';
import NavMain from './NavMain.vue';
import TimeSetting from './TimeSetting.vue';


const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

const userStore = useUserStore();

const data = {
  user: {
    id: userStore.id,
    name: userStore.name,
    displayName: userStore.displayName,
  },
  navMain: [
    {
      title: "通用界面",
      icon: "lucide:home",
      isActive: true,
      permissions: ['admin'] as TPermission[],
      items: [
        {
          title: "投稿统计",
          icon: "lucide:chart-no-axes-column",
          url: "/admin/general/songs",
        },
        {
          title: "通知",
          icon: "lucide:bell",
          url: "/admin/general/notifications",
        },
      ],
    },
    {
      title: "歌曲审核",
      url: "/admin/review",
      icon: "lucide:music-4",
      permissions: ['review'] as TPermission[],
    },
    {
      title: "全部歌曲",
      url: "/admin/songs",
      icon: "lucide:list-music",
      permissions: ['review'] as TPermission[],
    },
    {
      title: "排歌列表",
      url: "/admin/arrange",
      icon: "lucide:arrow-down-wide-narrow",
      permissions: ['arrange'] as TPermission[],
    },
    {
      title: "用户管理",
      icon: "lucide:users",
      permissions: ['manageUser'] as TPermission[],
      items: [
        {
          title: "查看投稿记录",
          url: "/admin/user/watchSongs",
          icon: "lucide:eye",
        },
        {
          title: "编辑权限",
          url: "/admin/user/editPermissions",
          icon: "lucide:edit",
          permissions: ['editPermissions'] as TPermission[],
        },
        {
          title: "删除用户",
          url: "/admin/user/deleteUser",
          icon: "lucide:trash",
          permissions: ['deleteUser'] as TPermission[],
        },
      ],
    },
    {
      title: "屏蔽词",
      url: "/admin/words",
      icon: "lucide:ban",
      permissions: ['blockWords'] as TPermission[],
    },
    {
      title: "编辑公告",
      url: "/admin/announcement",
      icon: "lucide:bell",
      permissions: ['announcement'] as TPermission[],
    },
  ],
  settings: [
    {
      name: "设置开放时间",
      url: "/admin/time",
      icon: "lucide:clock",
      permissions: ['time'] as TPermission[],
    },
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader class="border-b">
      <SidebarMenu>
        <SidebarMenuItem>
          <LogosSoelogo class="h-auto w-full cursor-pointer px-8" @click="navigateTo('/')" />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
      <TimeSetting />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
