// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
      maxAge: 60 * 60 * 24 * 14,
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

  compatibilityDate: '2024-10-03',
});
