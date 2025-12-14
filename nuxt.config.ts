// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      exclude: [
        '/',
        '/admin/login',
        '/inquilino/login',
        '/agente/login'
      ]
    }
  },
})

