type Hmt = Array<Array<string | number>>;

declare global {
  interface Window {
    _hmt?: Hmt;
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const baiduAnalyticsId = useRuntimeConfig().public.baiduAnalyticsId;
  if (!baiduAnalyticsId) {
    return;
  }

  const _hmt = (window._hmt = window._hmt || []);

  // 异步加载百度统计脚本
  const hm = document.createElement("script");
  hm.async = true;
  hm.src = `https://hm.baidu.com/hm.js?${baiduAnalyticsId}`;
  document.head.appendChild(hm);

  // SPA 路由切换时上报页面浏览
  nuxtApp.hook("page:finish", () => {
    _hmt.push(["_trackPageview", useRoute().path]);
  });
});
