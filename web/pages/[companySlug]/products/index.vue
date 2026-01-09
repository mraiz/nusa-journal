<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Products & Services</h1>
      <button 
        @click="openCreateModal"
        class="btn btn-primary flex items-center gap-2"
      >
        <PlusIcon class="h-5 w-5" />
        New Product
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="w-full sm:w-72">
            <SearchInput
                v-model="search"
                placeholder="Search products..."
                @search="handleSearch"
            />
        </div>
    </div>

    <div v-if="loading" class="text-center py-12">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
    </div>
    
    <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div class="overflow-x-auto">
             <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (IDR)</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Accounts</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>

                <tbody v-if="products?.length > 0" class="divide-y divide-slate-100">
                    <tr v-for="item in products" :key="item.id" class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 text-sm font-medium text-slate-900">{{ item.code }}</td>
                        <td class="px-6 py-4 text-sm text-slate-700">{{ item.name }}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded-full text-xs font-medium"
                            :class="item.type === 'GOODS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                                {{ item.type }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-right font-mono text-slate-700">
                            {{ new Intl.NumberFormat('id-ID').format(item.price) }}
                        </td>
                        <td class="px-6 py-4 text-xs text-slate-500 space-y-1">
                            <div v-if="item.salesAccount" class="flex gap-2">
                                <span class="text-green-600 font-medium">Sales:</span> {{ item.salesAccount.name }}
                            </div>
                             <div v-if="item.purchaseAccount" class="flex gap-2">
                                <span class="text-amber-600 font-medium">Exp:</span> {{ item.purchaseAccount.name }}
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right flex justify-end gap-2">
                             <button @click="handleEdit(item)" class="text-slate-400 hover:text-primary-600 transition-colors" title="Edit">
                                <PencilSquareIcon class="w-5 h-5" />
                             </button>
                             <button @click="handleDelete(item.id)" class="text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                <TrashIcon class="w-5 h-5" />
                             </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="products?.length === 0 && !loading">
            <EmptyState
                title="No Products Yet"
                description="Add products or services to speed up your invoicing."
                icon="📦"
                action-label="New Product"
                @action="openCreateModal"
            />
        </div>

        <PaginationControl
            v-if="products?.length > 0"
            :current-page="page"
            v-model:limit="limit"
            :total="total"
            @page-change="changePage"
        />

    </div>

    <CreateProductModal
        :show="showCreateModal"
        :initial-data="selectedProduct"
        @close="closeModal"
        @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import PaginationControl from '@/components/common/PaginationControl.vue'
import CreateProductModal from '@/components/products/CreateProductModal.vue'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/20/solid'
import { useProductStore } from '@/stores'

definePageMeta({
  layout: 'dashboard'
})
const productStore = useProductStore()
const products = computed(() => productStore.products)
const loading = computed(() => productStore.loading)

// Pagination & Search State
const page = ref(1)
const limit = ref(10)
const search = ref('')
const total = ref(0) 

const fetchData = async () => {
    const data = await productStore.fetchProducts({
        limit: limit.value,
        offset: (page.value - 1) * limit.value,
        search: search.value
    })
    if (data) {
        total.value = data.total
    }
}

const handleSearch = (val: string) => {
    search.value = val
    page.value = 1
    fetchData()
}

const changePage = (newPage: number) => {
    page.value = newPage
    fetchData()
}

watch(limit, () => {
    page.value = 1
    fetchData()
})

onMounted(() => {
    fetchData()
})

// Modal State
const showCreateModal = ref(false)
const selectedProduct = ref<any>(null)

const openCreateModal = () => {
    selectedProduct.value = null
    showCreateModal.value = true
}

const handleEdit = (item: any) => {
    selectedProduct.value = item
    showCreateModal.value = true
}

const closeModal = () => {
    showCreateModal.value = false
    selectedProduct.value = null
}

const handleCreateSuccess = () => {
    fetchData()
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
        await productStore.deleteProduct(id)
        fetchData()
    } catch (err: any) {
        alert(err.message || 'Failed to delete product')
    }
}
</script>
