import { defineStore } from 'pinia'

export interface LedgerTransaction {
  date: string
  journalId: string
  journalNumber: string
  description: string
  reference?: string
  lineDescription?: string
  debit: number
  credit: number
  balance: number
  balanceType: 'debit' | 'credit'
  isReversed: boolean
}

export interface AccountLedger {
  account: {
    id: string
    code: string
    name: string
    type: string
  }
  dateRange: {
    from?: string
    to?: string
  }
  transactions: LedgerTransaction[]
  summary: {
    totalDebit: number
    totalCredit: number
    finalBalance: number
    finalBalanceType: 'debit' | 'credit'
    transactionCount: number
  }
}

export const useLedgerStore = defineStore('ledger', () => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const ledgerData = ref<AccountLedger | null>(null)

  // Fetch account transactions with running balance
  const fetchLedger = async (slug: string, accountId: string, params?: { startDate?: string, endDate?: string }) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/ledger/accounts/${accountId}/transactions`, { params })
      ledgerData.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Clear state
  const clearLedger = () => {
    ledgerData.value = null
  }

  return {
    loading,
    ledgerData,
    fetchLedger,
    clearLedger
  }
})
