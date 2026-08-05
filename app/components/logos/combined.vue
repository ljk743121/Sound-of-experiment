<template>
  <div class="flex items-center justify-center flex-nowrap max-w-full min-w-0 overflow-hidden box-border gap-5 py-5 px-3 lg:gap-7 lg:py-7 lg:px-4 [@media(max-width:480px)]:gap-3 [@media(max-width:480px)]:py-3.5 [@media(max-width:480px)]:px-2">
    <div class="flex items-center justify-center shrink min-w-0 overflow-hidden w-[260px] h-[130px] lg:w-[320px] lg:h-[160px] [@media(max-width:480px)]:w-[180px] [@media(max-width:480px)]:h-[90px]">
      <LogosSchoolFm class="block size-full min-w-0" />
    </div>

    <div class="flex items-center justify-center shrink-0 size-[44px] lg:size-[52px] [@media(max-width:480px)]:size-[34px]">
      <svg
        class="block size-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 6L18 18M18 6L6 18"
          :stroke="isDark ? '#ffffff' : '#000000'"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <div class="relative shrink min-w-0 overflow-hidden [contain:paint] w-[220px] h-[120px] lg:w-[260px] lg:h-[140px] [@media(max-width:480px)]:w-[150px] [@media(max-width:480px)]:h-[90px]">
      <img
        src="/syzsgbz.webp"
        alt="SZSY logo"
        class="absolute inset-0 size-full object-contain"
        loading="eager"
        fetchpriority="high"
      >
    </div>
  </div>
</template>

<script setup>
const isDark = computed(() => useColorMode().preference === "dark");
</script>
