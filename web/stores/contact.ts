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
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/customers`, { query: params })
      customers.value = response.data
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
      const { data } = await authStore.fetchWithAuth(`/${route.params.companySlug}/customers`, {
        method: 'POST',
        body: payload
      })
      customers.value.push(data)
      return data
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: string, payload: Partial<CreateCustomerDto>) {
      loading.value = true;
      try {
          const { data } = await authStore.fetchWithAuth(`/${route.params.companySlug}/customers/${id}`, {
              method: 'PATCH',
              body: payload
          })
          const index = customers.value.findIndex(c => c.id === id)
          if (index !== -1) customers.value[index] = data
          return data
      } catch(err: any) {
          throw err
      } finally {
          loading.value = false
      }
  }

  async function deleteCustomer(id: string) {
      loading.value = true
      try {
          await authStore.fetchWithAuth(`/${route.params.companySlug}/customers/${id}`, { method: 'DELETE' })
          customers.value = customers.value.filter(c => c.id !== id)
      } catch(err: any) {
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
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors`, { query: params })
      vendors.value = response.data
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
        const { data } = await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors`, {
          method: 'POST',
          body: payload
        })
        vendors.value.push(data)
        return data
      } catch (err: any) {
        throw err
      } finally {
        loading.value = false
      }
  }

  async function updateVendor(id: string, payload: Partial<CreateVendorDto>) {
      loading.value = true
      try {
          const { data } = await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors/${id}`, {
              method: 'PATCH',
              body: payload
          })
          const index = vendors.value.findIndex(v => v.id === id)
          if (index !== -1) vendors.value[index] = data
          return data
      } catch(err: any) {
          throw err
      } finally {
          loading.value = false
      }
  }

  async function deleteVendor(id: string) {
      loading.value = true
      try {
          await authStore.fetchWithAuth(`/${route.params.companySlug}/vendors/${id}`, { method: 'DELETE' })
          vendors.value = vendors.value.filter(v => v.id !== id)
      } catch(err: any) {
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
    deleteVendor
  }
})
