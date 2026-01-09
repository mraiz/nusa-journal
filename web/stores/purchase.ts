import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PurchaseBill, CreatePurchaseBillDto } from '@/types/transaction'
import { useAuthStore } from './auth'

export const usePurchaseStore = defineStore('purchase', () => {
    const authStore = useAuthStore()
    const route = useRoute()
    const bills = ref<PurchaseBill[]>([])
    const currentBill = ref<PurchaseBill | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchBills(params: any = {}) {
        loading.value = true
        error.value = null
        try {
            const { data } = await authStore.fetchWithAuth(`/${route.params.companySlug}/purchase/bills`, { query: params })
            bills.value = data
            return data
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchBill(id: string) {
        loading.value = true
        error.value = null
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/purchase/bills/${id}`)
            currentBill.value = data
            return data
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function createBill(payload: CreatePurchaseBillDto) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/purchase/bills`, {
                method: 'POST',
                body: payload
            })
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function approveBill(id: string) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/purchase/bills/${id}/approve`, {
                method: 'POST'
            })
            if (currentBill.value && currentBill.value.id === id) {
                currentBill.value = data
            }
            const index = bills.value.findIndex(b => b.id === id)
            if (index !== -1) bills.value[index] = data
            
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateBill(id: string, payload: Partial<CreatePurchaseBillDto>) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/purchase/bills/${id}`, {
                method: 'PATCH',
                body: payload
            })
            if (currentBill.value && currentBill.value.id === id) {
                currentBill.value = data
            }
            const index = bills.value.findIndex(b => b.id === id)
            if (index !== -1) bills.value[index] = data
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchUnpaidBills() {
        return fetchBills({ status: 'POSTED', limit: 100 })
    }

    return {
        bills,
        currentBill,
        loading,
        error,
        fetchBills,
        fetchBill,
        createBill,
        updateBill,
        approveBill,
        fetchUnpaidBills
    }
})
