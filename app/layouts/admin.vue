<template>
  <SidebarProvider class="w-[calc(100vw+16rem)] md:w-auto">
    <Sidebar>
      <SidebarHeader class="h-28 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <LogosSoelogo class="h-auto w-full cursor-pointer px-8" @click="navigateTo('/')" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>管理</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <NuxtLink to="/admin">
                <SidebarMenuButton>
                  <Icon name="lucide:chart-no-axes-column" />
                  <span>数据统计</span>
                </SidebarMenuButton>
              </NuxtLink>
            </SidebarMenuItem>
            <NuxtLink v-if="userStore.permissions.includes('review')" to="/admin/review">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon name="lucide:music-4" />
                  <span>歌曲审核</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </NuxtLink>
            <NuxtLink v-if="userStore.permissions.includes('review')" to="/admin/songs">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon name="lucide:list-music" />
                  <span>全部歌曲</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </NuxtLink>
            <NuxtLink v-if="userStore.permissions.includes('arrange')" to="/admin/arrange">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon name="lucide:arrow-down-wide-narrow" />
                  <span>排歌列表</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </NuxtLink>
            <NuxtLink v-if="userStore.permissions.includes('manageUser')" to="/admin/user">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon name="lucide:users" />
                  <span>用户管理</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </NuxtLink>
            <NuxtLink v-if="userStore.permissions.includes('blockWords')" to="/admin/words">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icon name="lucide:ban" />
                  <span>屏蔽词</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </NuxtLink>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup v-if="userStore.permissions.includes('time')" class="border-t">
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <SidebarMenuButton
                    size="lg"
                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar class="rounded-lg">
                      <Icon name="lucide:circle-user" size="20" />
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{ userStore.name }}</span>
                      <span class="truncate text-xs">{{ userStore.id }}</span>
                    </div>
                    <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom"
                  :side-offset="4"
                >
                  <DropdownMenuLabel class="p-0 font-normal">
                    <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar class="rounded-lg">
                        <Icon name="lucide:circle-user" size="20" />
                      </Avatar>
                      <div class="grid flex-1 text-left text-sm leading-tight">
                        <span class="truncate font-semibold">{{ userStore.name }}</span>
                        <span class="truncate text-xs">{{ userStore.id }}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DialogTrigger as-child>
                    <DropdownMenuItem>
                      <Icon name="lucide:lock" />
                      修改密码
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DropdownMenuItem @click="logout">
                    <Icon name="lucide:log-out" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ModifyPasswordDialog />
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <div class="flex w-full items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <template v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.title">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    :href="index === 0 ? undefined : breadcrumb.href"
                    :class="{ 'text-foreground': index === breadcrumbs.length - 1 }"
                  >
                    {{ breadcrumb.title }}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index !== breadcrumbs.length - 1" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
          <DarkModeToggle class="ml-auto" />
        </div>
      </header>
      <main>
        <slot />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { LogosSoelogo } from '#components';
import { breadCrumb } from '~~/constants';
import ModifyPasswordDialog from '~/components/admin/user/ModifyPasswordDialog.vue';

const userStore = useUserStore();

function logout() {
  userStore.logout();
  toast.success('登出成功');
  navigateTo('/auth/login');
}

interface Item {
  title: string;
  href: string;
}

const route = useRoute();

function generateBreadcrumb(url: string): Item[] {
  const breadcrumbItems: Item[] = [];
  const segments = url.split('/').filter(segment => segment !== ''); // Remove empty segments

  // Construct breadcrumb for each segment
  let href = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!.replace('.html', '');
    const segmentName = breadCrumb[segment] ?? '';
    href += `/${segment}`;
    breadcrumbItems.push({ title: segmentName, href });
  }
  return breadcrumbItems;
}

const breadcrumbs = computed(() => generateBreadcrumb(route.path));
</script>
