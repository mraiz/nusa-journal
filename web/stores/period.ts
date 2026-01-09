import { defineStore } from 'pinia'

export interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'OPEN' | 'CLOSED'
  journalCount?: number
}

export const usePeriodStore = defineStore('period', () => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const periods = ref<Period[]>([])

  const currentPeriod = computed(() => {
    // Find open period that covers today, or just the latest open one
    const now = new Date()
    return periods.value.find(p => p.status === 'OPEN' && new Date(p.startDate) <= now && new Date(p.endDate) >= now) 
        || periods.value.find(p => p.status === 'OPEN') // Fallback
        || periods.value[0] // Fallback to any
  })

  // Fetch periods
  const fetchPeriods = async (slug: string, params?: { year?: number }) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/periods`, { params })
      periods.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Create period
  const createPeriod = async (slug: string, payload: any) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/periods`, {
        method: 'POST',
        body: payload
      })
      await fetchPeriods(slug)
      return data
    } finally {
      loading.value = false
    }
  }

  // Close period
  const closePeriod = async (slug: string, id: string) => {
    loading.value = true
    try {
      await $api(`/${slug}/periods/${id}/close`, { method: 'PATCH' })
      await fetchPeriods(slug)
    } finally {
      loading.value = false
    }
  }

  // Reopen period
  const reopenPeriod = async (slug: string, id: string) => {
    loading.value = true
    try {
      await $api(`/${slug}/periods/${id}/reopen`, { method: 'PATCH' })
      await fetchPeriods(slug)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    periods,
    currentPeriod,
    fetchPeriods,
    createPeriod,
    closePeriod,
    reopenPeriod
  }
})
