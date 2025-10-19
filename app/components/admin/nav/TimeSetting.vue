<template>
  <SidebarGroup class="border-t">
    <SidebarGroupLabel>系统设置</SidebarGroupLabel>
    <SidebarMenu>
      <TimeAvailability />
      <SidebarMenuItem>
        <SidebarMenuButton @click="navigateTo('/admin/time')">
          <Icon name="lucide:clock" />
          <span>设置开放时间</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem v-if="userStore.permissions.includes('config')">
        <SidebarMenuButton @click="navigateTo('/admin/config')">
          <Icon name="lucide:settings" />
          <span>管理系统配置</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>

<script setup lang="ts">
const userStore = useUserStore();
</script>
