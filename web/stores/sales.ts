import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SalesInvoice, CreateSalesInvoiceDto } from '@/types/transaction'
import { useAuthStore } from './auth'

export const useSalesStore = defineStore('sales', () => {
    const authStore = useAuthStore()
    const route = useRoute()
    const invoices = ref<SalesInvoice[]>([])
    const currentInvoice = ref<SalesInvoice | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchInvoices(params: any = {}) {
        loading.value = true
        error.value = null
        try {
            const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/sales/invoices`, { query: params })
            invoices.value = response.data
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchInvoice(id: string) {
        loading.value = true
        error.value = null
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/sales/invoices/${id}`)
            currentInvoice.value = data
            return data
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function createInvoice(payload: CreateSalesInvoiceDto) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/sales/invoices`, {
                method: 'POST',
                body: payload
            })
            // Add to simplified list if needed or refresh
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function approveInvoice(id: string) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/sales/invoices/${id}/approve`, {
                method: 'POST'
            })
            if (currentInvoice.value && currentInvoice.value.id === id) {
                currentInvoice.value = data
            }
            // Update in list
            const index = invoices.value.findIndex(i => i.id === id)
            if (index !== -1) invoices.value[index] = data
            
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateInvoice(id: string, payload: Partial<CreateSalesInvoiceDto>) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/sales/invoices/${id}`, {
                method: 'PATCH',
                body: payload
            })
            if (currentInvoice.value && currentInvoice.value.id === id) {
                currentInvoice.value = data
            }
            const index = invoices.value.findIndex(i => i.id === id)
            if (index !== -1) invoices.value[index] = data
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchUnpaidInvoices() {
        // Fetch POSTED and PARTIAL invoices
        return fetchInvoices({ status: 'PAID', limit: 100 })
    }

    return {
        invoices,
        currentInvoice,
        loading,
        error,
        fetchInvoices,
        fetchInvoice,
        createInvoice,
        updateInvoice,
        approveInvoice,
        fetchUnpaidInvoices
    }
})
