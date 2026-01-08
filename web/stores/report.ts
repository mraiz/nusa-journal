import { defineStore } from 'pinia'

export const useReportStore = defineStore('report', () => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  
  // State to hold report data can vary, usually reports are fetched on demand
  const trialBalance = ref<any>(null)
  const balanceSheet = ref<any>(null)
  const profitLoss = ref<any>(null)

  // Fetch Trial Balance
  const fetchTrialBalance = async (slug: string, params?: any) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/reports/trial-balance`, { params })
      trialBalance.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Fetch Balance Sheet
  const fetchBalanceSheet = async (slug: string, periodId: string) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/reports/balance-sheet/${periodId}`)
      balanceSheet.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Fetch Profit Loss
  const fetchProfitLoss = async (slug: string, periodId: string) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/reports/profit-loss/${periodId}`)
      profitLoss.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Fetch Financial Summary
  const fetchSummary = async (slug: string, periodId: string) => {
    loading.value = true
    try {
      return await $api(`/${slug}/reports/summary/${periodId}`)
    } finally {
      loading.value = false
    }
  }

  // Fetch Analytics
  const fetchAnalytics = async (slug: string, limit: number = 6) => {
    loading.value = true
    try {
      return await $api(`/${slug}/reports/analytics`, { params: { limit } })
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    trialBalance,
    balanceSheet,
    profitLoss,
    fetchTrialBalance,
    fetchBalanceSheet,
    fetchProfitLoss,
    fetchSummary,
    fetchAnalytics
  }
})
