import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Customer, CreateCustomerDto, Vendor, CreateVendorDto } from '@/types/transaction'
import { useAuthStore } from './auth'

export const useContactStore = defineStore('contact', () => {
  const authStore = useAuthStore()
  const route = useRoute()
  const customers = ref<Customer[]>([])
  const vendors = ref<Vendor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // -- Customers --
  async function fetchCustomers(params: any = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/customers`, {
        query: params,
      })
      // Handle { data: [], meta: ... } or []
      customers.value = Array.isArray(response) ? response : response.data || []
      return response
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(payload: CreateCustomerDto) {
    loading.value = true
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/customers`, {
        method: 'POST',
        body: payload,
      })
      const newItem = response.data || response
      if (newItem && customers.value) {
        customers.value.push(newItem)
      }
      return newItem
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: string, payload: Partial<CreateCustomerDto>) {
    loading.value = true
    try {
      const response = await authStore.fetchWithAuth(
        `/${route.params.companySlug}/customers/${id}`,
        {
          method: 'PATCH',
          body: payload,
        }
      )
      const updatedItem = response.data || response

      if (customers.value) {
        const index = customers.value.findIndex((c) => c.id === id)
        if (index !== -1) customers.value[index] = updatedItem
      }
      return updatedItem
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id: string) {
    loading.value = true
    try {
      await authStore.fetchWithAuth(`/${route.params.companySlug}/customers/${id}`, {
        method: 'DELETE',
      })
      if (customers.value) {
        customers.value = customers.value.filter((c) => c.id !== id)
      }
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  // -- Vendors --
  async function fetchVendors(params: any = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors`, {
        query: params,
      })
      vendors.value = Array.isArray(response) ? response : response.data || []
      return response
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createVendor(payload: CreateVendorDto) {
    loading.value = true
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors`, {
        method: 'POST',
        body: payload,
      })
      const newItem = response.data || response
      if (newItem && vendors.value) {
        vendors.value.push(newItem)
      }
      return newItem
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateVendor(id: string, payload: Partial<CreateVendorDto>) {
    loading.value = true
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      const updatedItem = response.data || response
      if (vendors.value) {
        const index = vendors.value.findIndex((v) => v.id === id)
        if (index !== -1) vendors.value[index] = updatedItem
      }
      return updatedItem
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteVendor(id: string) {
    loading.value = true
    try {
      await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors/${id}`, {
        method: 'DELETE',
      })
      if (vendors.value) {
        vendors.value = vendors.value.filter((v) => v.id !== id)
      }
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    vendors,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  }
})
