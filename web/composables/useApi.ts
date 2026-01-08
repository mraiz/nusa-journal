import type { ApiError } from '~/types'

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  const handleError = (error: any) => {
    const apiError = error.data as ApiError
    const message = Array.isArray(apiError?.message) 
      ? apiError.message.join(', ') 
      : apiError?.message || 'An error occurred'
    
    throw new Error(message)
  }

  return {
    get: async <T>(url: string) => {
      try {
        return await $fetch<T>(`${baseURL}${url}`, {
          method: 'GET',
          credentials: 'include',
        })
      } catch (error) {
        handleError(error)
      }
    },
    
    post: async <T>(url: string, body?: any) => {
      try {
        return await $fetch<T>(`${baseURL}${url}`, {
          method: 'POST',
          body,
          credentials: 'include',
        })
      } catch (error) {
        handleError(error)
      }
    },
    
    patch: async <T>(url: string, body?: any) => {
      try {
        return await $fetch<T>(`${baseURL}${url}`, {
          method: 'PATCH',
          body,
          credentials: 'include',
        })
      } catch (error) {
        handleError(error)
      }
    },
    
    delete: async <T>(url: string) => {
      try {
        return await $fetch<T>(`${baseURL}${url}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      } catch (error) {
        handleError(error)
      }
    },
  }
}
