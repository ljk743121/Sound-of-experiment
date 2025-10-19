<template>
  <div class="bg-gray-100 h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
      <LogosSoe class="mx-auto w-1/2" />
      <h1 class="text-4xl font-bold text-gray-800 mb-8">
        页面好像走丢了呢
      </h1>
      <p class="text-gray-600 mb-6">
        到主页查看其他人的投稿吧
      </p>
      <Button class="mr-2" variant="link" @click="goHome">
        返回主页面
      </Button>
      <Button variant="link" @click="goBack">
        返回上一页
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "页面未找到",
});

function goHome() {
  navigateTo("/");
}

function goBack() {
  useRouter().back();
}
</script>
