import { defineStore } from 'pinia'

// Types
export interface Account {
  id: string
  code: string
  name: string
  type: string // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  classification: string // CURRENT_ASSET, etc.
  parentId: string | null
  level: number
  isPosting: boolean
  isLocked: boolean
  balance?: number
  children?: Account[]
}

export const useAccountStore = defineStore('account', () => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const accounts = ref<Account[]>([])
  const accountTree = ref<Account[]>([])
  const accountsFlat = ref<Account[]>([]) // Paged flat list

  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1
  })

  // Fetch accounts (Paged Flat View)
  const fetchAccounts = async (slug: string, params: any = {}) => {
    loading.value = true
    try {
      // Default params
      const query = {
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.limit,
        search: params.search,
        type: params.type,
        ...params
      }
      
      const res = await $api(`/${slug}/accounts`, { params: query })
      
      if (res.meta) {
        accountsFlat.value = res.data
        pagination.value = res.meta
      } else {
         // Fallback for old API / simple array
        accounts.value = res
        accountsFlat.value = res 
      }
      return res
    } finally {
      loading.value = false
    }
  }

  // Fetch account tree
  const fetchAccountTree = async (slug: string) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/accounts/tree`)
      accountTree.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Create account
  const createAccount = async (slug: string, payload: any) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/accounts`, {
        method: 'POST',
        body: payload
      })
      await fetchAccountTree(slug) // Refresh tree
      return data
    } finally {
      loading.value = false
    }
  }

  // Update account
  const updateAccount = async (slug: string, id: string, payload: any) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/accounts/${id}`, {
        method: 'PATCH',
        body: payload
      })
      await fetchAccountTree(slug) // Refresh tree
      return data
    } finally {
      loading.value = false
    }
  }

  // Delete account
  const deleteAccount = async (slug: string, id: string) => {
    loading.value = true
    try {
      await $api(`/${slug}/accounts/${id}`, {
        method: 'DELETE'
      })
      await fetchAccountTree(slug) // Refresh tree
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    accounts,
    accountTree,
    accountsFlat,
    pagination,
    fetchAccounts,
    fetchAccountTree,
    createAccount,
    updateAccount,
    deleteAccount
  }
})
