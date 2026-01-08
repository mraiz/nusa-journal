import { defineStore } from 'pinia'

export interface JournalLine {
  id?: string
  accountId: string
  description?: string
  debit: number
  credit: number
}

export interface Journal {
  id: string
  journalNumber: string
  date: string
  description: string
  status: string
  totalAmount: number
  lines: JournalLine[]
}

export const useJournalStore = defineStore('journal', () => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const journals = ref<Journal[]>([])
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  })

  // Fetch journals
  const fetchJournals = async (slug: string, params: any = {}) => {
    loading.value = true
    try {
      // Default params
      const query = {
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.limit,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
        ...params
      }

      const res = await $api(`/${slug}/journals`, { params: query })
      
      if (res && res.meta) {
        journals.value = res.data || []
        pagination.value = res.meta
      } else {
        // Fallback for array response
        journals.value = Array.isArray(res) ? res : []
      }
      return res
    } finally {
      loading.value = false
    }
  }

  // Fetch single journal
  const fetchJournal = async (slug: string, id: string) => {
    loading.value = true
    try {
      return await $api(`/${slug}/journals/${id}`)
    } finally {
      loading.value = false
    }
  }

  // Create journal
  const createJournal = async (slug: string, payload: any) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/journals`, {
        method: 'POST',
        body: payload
      })
      await fetchJournals(slug) // Refresh list
      return data
    } finally {
      loading.value = false
    }
  }

  // Reverse journal
  const reverseJournal = async (slug: string, id: string) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/journals/${id}/reverse`, {
        method: 'POST'
      })
      await fetchJournal(slug, id) // Refresh current journal
      return data
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    journals,
    pagination,
    fetchJournals,
    fetchJournal,
    createJournal,
    reverseJournal
  }
})
