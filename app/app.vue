<template>
  <GlobalLoader />
  <NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />
  <Toaster
    position="top-right"
    class="pointer-events-auto"
    close-button
    rich-colors
    :duration="7000"
    expand
    :visible-toasts="5"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Analytics />
</template>

<script setup lang="ts">
import { Analytics } from "@vercel/analytics/nuxt";
import { SCHOOL_NAME } from "~~/constants";
import "@ztl-uwu/v-calendar/style.css";

useHead({
  titleTemplate: (title?: string) =>
    !title ? `${SCHOOL_NAME} 点歌系统 | SchoolFm` : `${title} | ${SCHOOL_NAME} 点歌系统 | SchoolFm`,
  meta: [
    {
      name: "description",
      content:
        `${SCHOOL_NAME} 点歌系统 | SchoolFm - 开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出。Made by Ljk743121`,
    },
    {
      name: "keywords",
      content:
        "深圳实验,校园点歌系统,广播站,排歌歌单,歌曲列表,歌曲投稿,智能排歌,自动化,SchoolFm,nuxt",
    },
    {
      property: "og:title",
      content: `${SCHOOL_NAME} 点歌系统 | SchoolFm`,
    },
    {
      property: "og:description",
      content: "开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
    },
    {
      property: "og:image",
      content: "https://voszsy.penacony.cn/images/syzs.jpg",
    },
    {
      property: "og:url",
      content: "https://voszsy.penacony.cn",
    },
    {
      name: "twitter:title",
      content: `${SCHOOL_NAME} 点歌系统 | SchoolFm`,
    },
    {
      name: "twitter:description",
      content: "开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:image",
      content: "https://voszsy.penacony.cn/images/syzs.jpg",
    },
  ],
  link: [
    {
      rel: "canonical",
      href: "https://voszsy.penacony.cn",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": `${SCHOOL_NAME} 点歌系统 | SchoolFm`,
        "description": "开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
        "url": "https://voszsy.penacony.cn",
        "applicationCategory": "EducationApplication",
        "operatingSystem": "Any",
        "author": {
          "@type": "Person",
          "name": "Ljk743121",
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "CNY",
        },
      }),
    },
  ],
});

// useSeoMeta({
//   title: `${SCHOOL_NAME} 点歌系统 | SchoolFm`,
//   description: "开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
//   ogTitle: `${SCHOOL_NAME} 点歌系统 | SchoolFm`,
//   ogDescription: "开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
//   ogImage: "https://voszsy.penacony.cn/images/syzs.jpg",
//   ogUrl: "https://voszsy.penacony.cn",
//   twitterTitle: `${SCHOOL_NAME} 点歌系统 | SchoolFm`,
//   twitterDescription: "开源校园广播站管理系统，支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出",
//   twitterImage: "https://voszsy.penacony.cn/images/syzs.jpg",
//   twitterCard: "summary_large_image",
// });
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
