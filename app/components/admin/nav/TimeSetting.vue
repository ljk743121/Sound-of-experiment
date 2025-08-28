<template>
  <SidebarGroup class="border-t">
    <SidebarGroupLabel>开放时间</SidebarGroupLabel>
    <SidebarMenu>
      <TimeAvailability />
      <SidebarMenuItem>
        <SidebarMenuButton @click="navigateTo('/admin/time')">
          <Icon name="lucide:clock" />
          <span>设置开放时间</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
