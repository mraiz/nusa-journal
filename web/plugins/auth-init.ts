export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  
  // Check auth on both server (SSR) and client
  // Nuxt waits for this plugin to finish before rendering
  if (import.meta.server) {
    console.log('[AuthPlugin] Starting SSR Auth Check...')
    const headers = useRequestHeaders(['cookie'])
    console.log('[AuthPlugin] Cookies present:', !!headers.cookie)
  }
  
  await authStore.checkAuth()
  
  if (import.meta.server) {
    console.log('[AuthPlugin] SSR Auth Result:', authStore.isAuthenticated)
  }
})
