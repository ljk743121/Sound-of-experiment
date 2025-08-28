<template>
  <SidebarProvider>
    <AdminNavAppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
import { breadCrumb } from '~~/constants';

const userStore = useUserStore();

if (!userStore.loggedIn) {
  navigateTo('/auth/login');
}
if (!userStore.permissions.includes('admin')){
  navigateTo('/');
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
