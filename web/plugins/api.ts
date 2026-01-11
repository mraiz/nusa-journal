export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // on server, we need to pass cookies
  const headers = useRequestHeaders(['cookie'])

  // Create a base fetcher with defaults
  const apiFetcher = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  })

  // Wrapper function to handle 401 and retry
  const api = async (url: string, options: any = {}) => {
    try {
      return await apiFetcher(url, options)
    } catch (error: any) {
      // Don't retry auth endpoints to prevent infinite loops
      const isAuthEndpoint = url.includes('/auth/')

      // If 401 and not an auth endpoint and not already retrying
      if (error.response?.status === 401 && !isAuthEndpoint && !options._retry) {
        options._retry = true

        try {
          // Try to refresh token
          await apiFetcher('/auth/refresh', { method: 'POST' })

          // Retry original request
          return await api(url, options)
        } catch (refreshError) {
          // Refresh failed, clear local state and redirect
          const authStore = useAuthStore()
          authStore.user = null
          authStore.isAuthenticated = false
          navigateTo('/auth/login')
          throw refreshError
        }
      }

      throw error
    }
  }

  // Expose to useNuxtApp().$api
  return {
    provide: {
      api,
    },
  }
})
