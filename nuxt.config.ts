// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app:{
    head:{
      htmlAttrs:{
        lang: 'zh-CN',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'description', content: 'Voice of SZSY 点歌系统,Made by Ljk743121。开源校园广播站管理系统,支持歌曲在线试听、在线投稿、智能审核、一键排歌和歌单导出' },
        { name: 'keywords', content: '深圳实验,校园点歌系统,广播站,管理系统,点歌平台,开源广播系统,教育科技,Nuxt3,Vue3,Voice of SZSY,voszsy,Github项目,开源项目' },
        { name: 'theme-color', content: '#007bff' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Voice of SZSY' },
        { name: 'author', content: 'Ljk743121 and contributors' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      ],
      link: [
        { rel:'icon', type:'image/x-icon', href:'/favicon.ico'},
        { rel: 'canonical', href: 'https://voszsy.ddns.net/' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.ico' },
      ]
    }
  },

  devtools: { enabled: true },

  modules: [
    'nuxt-auth-utils',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@vee-validate/nuxt',
    '@nuxtjs/color-mode',
    'radix-vue/nuxt',
    'nuxt-musicfyplayer',
  ],

  piniaPluginPersistedstate: {
    storage: 'cookies',
    cookieOptions: {
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.DB_ENV === 'production',
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  colorMode: {
    classSuffix: '',
    disableTransition: true,
    fallback: 'light',
    storage: 'cookie',
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },

  imports: {
    dirs: ['types', 'constants'],
    presets: [
      {
        from: '@tanstack/vue-query',
        imports: ['useMutation', 'useQuery', 'useQueryClient', 'skipToken'],
      },
      {
        from: 'vue-sonner',
        imports: ['toast'],
      },
    ],
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  build: {
    transpile: ['trpc-nuxt'],
  },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  runtimeConfig: {
    //private
    public: {
      //public
    }
  },

  compatibilityDate: '2024-10-03',
});