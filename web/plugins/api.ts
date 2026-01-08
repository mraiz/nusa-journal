export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  // on server, we need to pass cookies
  const headers = useRequestHeaders(['cookie'])

  // Create a base fetcher with defaults
  const apiFetcher = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...headers
    }
  })

  // Wrapper function to handle 401 and retry
  const api = async (url: string, options: any = {}) => {
    try {
      return await apiFetcher(url, options)
    } catch (error: any) {
      // If 401 and not already retrying
      if (error.response?.status === 401 && !options._retry) {
        options._retry = true
        
        try {
          // Try to refresh token
          // meaningful only if we have http-only cookies for refresh token
          await apiFetcher('/auth/refresh', { method: 'POST' })
          
          // Retry original request (recursively calling api, but with _retry flag)
          return await api(url, options)
        } catch (refreshError) {
          // Refresh failed, so we really are unauthorized
          const authStore = useAuthStore()
          authStore.logout() // This redirects to login
          throw refreshError
        }
      }
      
      throw error
    }
  }

  // Expose to useNuxtApp().$api
  return {
    provide: {
      api
    }
  }
})
