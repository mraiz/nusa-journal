import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Payment, CreatePaymentDto } from '@/types/transaction'
import { useAuthStore } from './auth'

export const usePaymentStore = defineStore('payment', () => {
    const authStore = useAuthStore()
    const route = useRoute()
    const payments = ref<Payment[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchPayments(params: any = {}) {
        loading.value = true
        error.value = null
        try {
            const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/payments`, { query: params })
            payments.value = response.data
            return response
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function createPayment(payload: CreatePaymentDto) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/payments`, {
                method: 'POST',
                body: payload
            })
            payments.value.unshift(data)
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }


    async function updatePayment(id: string, payload: Partial<CreatePaymentDto>) {
        loading.value = true
        try {
            const data = await authStore.fetchWithAuth(`/${route.params.companySlug}/payments/${id}`, {
                method: 'PATCH',
                body: payload
            })
            // Refresh list or update item
            // Since ID might change (if we deleted and re-created), safer to refresh.
            // But for now let's hope it returns the new record.
            // Actually PaymentService.update returns the NEW payment.
            // We should remove the old one (by id) and add the new one?
            // Or just refresh the list.
            await fetchPayments({ limit: 50 }) 
            return data
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deletePayment(id: string) {
        loading.value = true
        try {
            await authStore.fetchWithAuth(`/${route.params.companySlug}/payments/${id}`, {
                method: 'DELETE'
            })
            payments.value = payments.value.filter(p => p.id !== id)
        } catch (err: any) {
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        payments,
        loading,
        error,
        fetchPayments,
        createPayment,
        updatePayment,
        deletePayment
    }
})
