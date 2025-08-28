<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar'

const props = defineProps<{
  user: {
    id: string
    name: string
    displayName?: string
  }
}>()

const { isMobile } = useSidebar()

function logout() {
  useUserStore().logout();
  toast.success('登出成功');
  navigateTo('/auth/login');
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar class="h-8 w-8 rounded-lg">
              <!-- <AvatarImage :src="user.avatar" :alt="user.name" />
              <AvatarFallback class="rounded-lg">
                CN
              </AvatarFallback> -->
              {{ user.name.slice(0, 1) }}
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ user.name }}</span>
              <span class="truncate text-xs" v-if="user.displayName"><span class="text-muted-foreground"></span>{{ user.displayName }}</span>
              <span class="truncate text-xs">{{ user.id }}</span>
            </div>
            <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'" align="end" :side-offset="4">
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                {{ user.name.slice(0, 1) }}
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ user.name }}</span>
                <span class="truncate text-xs" v-if="user.displayName">昵称：{{ user.displayName }}</span>
                <span class="truncate text-xs">{{ user.id }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="navigateTo('/profile')">
              <Icon name="lucide:user-check" />
              个人资料
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
            <DropdownMenuItem @click="logout()">
              <Icon name="lucide:log-out" />
              登出
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
