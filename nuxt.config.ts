// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: "zh-CN",
      },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
    },
  },

  devtools: { enabled: true },

  css: ["@ljk743121/vue-music-flow/dist/vue-music-flow.css", "~/assets/css/tailwind.css"],
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
    storage: "cookie",
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
      {
        from: "@ljk743121/vue-music-flow",
        imports: ["useMusicFlow"],
      },
    ],
  },

  shadcn: {
    prefix: "",
    componentDir: "./app/components/ui",
  },

  build: {
    transpile: ["trpc-nuxt", "@ljk743121/vue-music-flow"],
  },

  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },

  runtimeConfig: {
    // private
    public: {
      // public
    },
  },

  compatibilityDate: "2024-10-03",
});
