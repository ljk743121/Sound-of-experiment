<template>
  <NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />
  <Toaster position="top-right" class="pointer-events-auto" closeButton richColors :duration="7000" expand :visibleToasts="5" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import '@ztl-uwu/v-calendar/style.css';

useHead({
  titleTemplate: (title?: string) => !title ? 'Voice of SZSY 点歌系统' : `${title} | Voice of SZSY 点歌系统`,
  meta: [
    { name: 'description', content: 'Voice of SZSY 点歌系统,Made by Ljk743121。开源校园广播站管理系统,支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出' },
    { name: 'keywords', content: '深圳实验,校园点歌系统,广播站,管理系统,点歌平台,开源广播系统,教育科技,Nuxt3,Vue3,Voice of SZSY,voszsy,Github项目,开源项目' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'edu:target_audience', content: 'middle_school, high_school, university' },
    { name: 'edu:subject', content: 'music,technology' },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "实验之声广播站点歌系统",
      "description": "开源校园广播站管理平台",
      "applicationCategory": "Education",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CNY"
      },
      "featureList": [
        "歌曲在线投稿", 
        "在线审核系统",
        "智能排歌算法",
        "歌单导出功能",
        "实时音乐播放"
      ],
      "screenshot": [
        "https://voszsy.ddns.net/images/0.png",
        "https://voszsy.ddns.net/images/1.png",
        "https://voszsy.ddns.net/images/2.png"
      ]
    })
  }],
  link: [
    { rel: 'canonical', href: 'https://voszsy.ddns.net/' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
});
</script>

<style>
/* List animation */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
  width: 100%;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
