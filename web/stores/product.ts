import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product, CreateProductDto } from '@/types/transaction'
import { useAuthStore } from './auth'

export const useProductStore = defineStore('product', () => {
  const authStore = useAuthStore()
  const route = useRoute()
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts(params: any = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/products`, {
        query: params,
      })
      products.value = Array.isArray(response) ? response : response.data || []
      return response
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createProduct(payload: CreateProductDto) {
    loading.value = true
    try {
      const response = await authStore.fetchWithAuth(`/${route.params.companySlug}/products`, {
        method: 'POST',
        body: payload,
      })
      const newItem = response.data || response
      if (newItem && products.value) {
        products.value.push(newItem)
      }
      return newItem
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id: string, payload: Partial<CreateProductDto>) {
    loading.value = true
    try {
      const response = await authStore.fetchWithAuth(
        `/${route.params.companySlug}/products/${id}`,
        {
          method: 'PATCH',
          body: payload,
        }
      )
      const updatedItem = response.data || response
      if (products.value) {
        const index = products.value.findIndex((p) => p.id === id)
        if (index !== -1) products.value[index] = updatedItem
      }
      return updatedItem
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id: string) {
    loading.value = true
    try {
      await authStore.fetchWithAuth(`/${route.params.companySlug}/products/${id}`, {
        method: 'DELETE',
      })
      products.value = products.value.filter((p) => p.id !== id)
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
})
