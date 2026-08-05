// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { SCHOOL_NAME } from "./constants";

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: "zh-CN",
      },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, maximum-scale=5",
      templateParams: {
        separator: " | ",
      },
      meta: [
        { name: "robots", content: "index, follow" },
        { name: "author", content: "Ljk743121" },
        { name: "theme-color", content: "#3b82f6" },
        { property: "og:site_name", content: `SchoolFm 点歌系统 | ${SCHOOL_NAME}` },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "zh_CN" },
        { property: "og:url", content: "https://voszsy.penacony.cn/" },
        { property: "og:image", content: "https://voszsy.penacony.cn/images/syzs.jpg" },
        { name: "format-detection", content: "telephone=no" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: `SchoolFm | ${SCHOOL_NAME}` },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        // 预加载首屏 LCP 图片（Logo），加快首次内容绘制
        { rel: "preload", as: "image", href: "/syzsgbz.webp", fetchpriority: "high" },
        // 音乐封面/音频常来自这些外部域名，提前建立连接以加速加载
        { rel: "preconnect", href: "https://music.163.com" },
        { rel: "preconnect", href: "https://y.qq.com" },
        { rel: "preconnect", href: "https://api.bilibili.com" },
      ],
    },
  },

  devtools: { enabled: false },

  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },

  modules: [
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@vueuse/nuxt",
    "@nuxt/image",
    "@nuxt/icon",
    "shadcn-nuxt",
    "@vee-validate/nuxt",
    "@nuxtjs/color-mode",
    "nuxt-musicfyplayer",
    "@vercel/speed-insights",
  ],

  piniaPluginPersistedstate: {
    storage: "cookies",
    cookieOptions: {
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.DB_ENV === "production",
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  colorMode: {
    classSuffix: "",
    disableTransition: true,
    fallback: "light",
    storage: "localStorage",
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  imports: {
    dirs: ["types", "constants"],
    presets: [
      {
        from: "@tanstack/vue-query",
        imports: ["useMutation", "useQuery", "useQueryClient", "skipToken"],
      },
      {
        from: "vue-sonner",
        imports: ["toast"],
      },
    ],
  },

  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },

  build: {
    transpile: ["trpc-nuxt"],
  },

  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
  },

  image: {
    quality: 80,
    format: ["webp", "jpg", "png"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  routeRules: {
    "/admin": { redirect: "/admin/general/notifications" },
    "/admin/general": { redirect: "/admin/general/notifications" },
    "/admin/user": { redirect: "/admin/user/watchSongs" },
    // ...proxy,
  },

  runtimeConfig: {
    // private
    public: {
      // public
    },
  },

  compatibilityDate: "2024-10-03",

  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
  },

  features: {
    inlineStyles: true,
  },
});
