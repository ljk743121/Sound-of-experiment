<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next"
import type { TPermission } from "~~/types"

defineProps<{
  items: {
    title: string
    url?: string
    icon?: string
    isActive?: boolean
    permissions?: TPermission[]
    items?: {
      title: string
      icon?: string
      url: string
      permissions?: TPermission[]
    }[]
  }[]
}>()

const userPermissions = useUserStore().permissions;
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>管理</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible v-for="item in items" :key="item.title" as-child :default-open="item.isActive"
        class="group/collapsible">
        <SidebarMenuItem v-if="item.items">
          <CollapsibleTrigger as-child>
            <SidebarMenuButton :tooltip="item.title" v-if="(!item.permissions) || userPermissions.some(permission => item.permissions?.includes(permission))">
              <Icon v-if="item.icon" :name="item.icon" />
              <span>{{ item.title }}</span>
              <ChevronRight
                class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                <NuxtLink v-if="(!subItem.permissions) || userPermissions.some(permission => subItem.permissions?.includes(permission))" class="flex items-center gap-2 text-sm" :to="subItem.url">
                  <SidebarMenuSubButton as-child>
                    <Icon v-if="subItem.icon" :name="subItem.icon" />
                    <span>{{ subItem.title }}</span>
                  </SidebarMenuSubButton>
                </NuxtLink>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
        <SidebarMenuItem v-else> 
          <NuxtLink v-if="(!item.permissions) || userPermissions.some(permission => item.permissions?.includes(permission))" :to="item.url">
            <SidebarMenuButton :tooltip="item.title">
              <Icon v-if="item.icon" :name="item.icon" />
              <span>{{ item.title }}</span>
            </SidebarMenuButton>
          </NuxtLink>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
