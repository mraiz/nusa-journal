import { ref } from 'vue'

export interface Toast {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

// Global state - defined OUTSIDE the composable function
const toasts = ref<Toast[]>([])
let nextId = 0

export const useToast = () => {
  const show = (options: Omit<Toast, 'id'>) => {
    const id = nextId++
    const toast: Toast = {
      id,
      duration: 5000,
      ...options,
    }

    toasts.value.push(toast)

    // Auto remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration)
    }

    return id
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (title: string, message: string = '') => {
    return show({ type: 'success', title, message })
  }

  const error = (title: string, message: string = '') => {
    return show({ type: 'error', title, message, duration: 8000 }) // Longer for errors
  }

  const warning = (title: string, message: string = '') => {
    return show({ type: 'warning', title, message })
  }

  const info = (title: string, message: string = '') => {
    return show({ type: 'info', title, message })
  }

  // Helper to extract error message from API errors
  const apiError = (err: any, fallbackTitle: string = 'Terjadi Kesalahan') => {
    let message = 'Terjadi kesalahan yang tidak diketahui'
    let title = fallbackTitle

    // FetchError format (Nuxt $fetch)
    if (err?.data?.message) {
      // NestJS error format
      if (typeof err.data.message === 'string') {
        message = err.data.message
      } else if (err.data.message?.message) {
        message = err.data.message.message
      }
    } else if (err?.message) {
      message = err.message
    }

    // Also check _data for FetchError
    if (err?._data?.message) {
      if (typeof err._data.message === 'string') {
        message = err._data.message
      } else if (err._data.message?.message) {
        message = err._data.message.message
      }
    }

    // Extract status for title
    const statusCode = err?.statusCode || err?.data?.statusCode || err?._data?.statusCode
    if (statusCode === 400) {
      title = 'Validasi Gagal'
    } else if (statusCode === 401) {
      title = 'Tidak Terautentikasi'
    } else if (statusCode === 403) {
      title = 'Akses Ditolak'
    } else if (statusCode === 404) {
      title = 'Tidak Ditemukan'
    }

    return error(title, message)
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info,
    apiError,
  }
}
