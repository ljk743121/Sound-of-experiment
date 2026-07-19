<template>
  <div class="bg-gray-100 dark:bg-gray-900 h-screen flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
      <LogosSchoolFm class="mx-auto w-1/2" />
      <h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-8">
        页面好像走丢了呢
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        到主页查看其他人的投稿吧
      </p>
      <Button class="mr-2 text-gray-600 dark:text-gray-300" variant="link" @click="goHome">
        返回主页面
      </Button>
      <Button variant="link" class="text-gray-600 dark:text-gray-300" @click="goBack">
        返回上一页
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: `页面未找到`,
  description: "您访问的页面不存在，请返回首页或上一页。",
  robots: "noindex, nofollow",
});

useHead({
  title: "页面未找到",
  meta: [
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
});

definePageMeta({
  layout: false,
});

function goHome() {
  navigateTo("/", { replace: true });
}

function goBack() {
  useRouter().back();
}
</script>
