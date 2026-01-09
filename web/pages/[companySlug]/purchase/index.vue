<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Purchase Bills</h1>
      <NuxtLink 
        :to="`/${route.params.companySlug}/purchase/create`"
        class="btn btn-primary flex items-center gap-2"
      >
        <PlusIcon class="h-5 w-5" />
        New Bill
      </NuxtLink>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="w-full sm:w-72">
            <SearchInput
                v-model="search"
                placeholder="Search bill number..."
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
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>

                <tbody v-if="bills?.length > 0" class="divide-y divide-slate-100">
                    <tr v-for="item in bills" :key="item.id" class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 text-sm text-slate-500">
                            {{ new Date(item.date).toLocaleDateString('id-ID') }}
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-slate-900">
                            <NuxtLink :to="`/${route.params.companySlug}/purchase/${item.id}`" class="hover:underline text-primary-600">
                                {{ item.billNumber }}
                            </NuxtLink>
                        </td>
                         <td class="px-6 py-4 text-sm text-slate-700">
                            {{ item.vendor?.name || '-' }}
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded-full text-xs font-medium"
                            :class="{
                                'bg-gray-100 text-gray-700': item.status === 'DRAFT',
                                'bg-blue-100 text-blue-700': item.status === 'POSTED',
                                'bg-green-100 text-green-700': item.status === 'PAID',
                                'bg-red-100 text-red-700': item.status === 'CANCELLED',
                            }">
                                {{ item.status }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-right font-mono font-medium text-slate-900">
                            {{ new Intl.NumberFormat('id-ID').format(item.total) }}
                        </td>
                        <td class="px-6 py-4 text-right">
                             <NuxtLink :to="`/${route.params.companySlug}/purchase/${item.id}`" class="text-slate-400 hover:text-primary-600 transition-colors">
                                <EyeIcon class="h-5 w-5" />
                             </NuxtLink>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div v-if="bills?.length === 0 && !loading">
            <EmptyState
                title="No Bills Yet"
                description="Record your purchase bills to track expenses and payables."
                icon="🛍️"
                action-label="Create Bill"
                @action="router.push(`/${route.params.companySlug}/purchase/create`)"
            />
        </div>

        <PaginationControl
            v-if="bills?.length > 0"
            :current-page="page"
            :limit="limit"
            :total="total"
            @page-change="changePage"
        />

    </div>
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import PaginationControl from '@/components/common/PaginationControl.vue'
import { PlusIcon, EyeIcon } from '@heroicons/vue/20/solid'

definePageMeta({
  layout: 'dashboard'
})
const route = useRoute()
const purchaseStore = usePurchaseStore()
const bills = computed(() => purchaseStore.bills)
const loading = computed(() => purchaseStore.loading)

// Pagination & Search State
const page = ref(1)
const limit = ref(50)
const search = ref('')
const total = ref(0) 

const fetchData = async () => {
    const data = await purchaseStore.fetchBills({
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

onMounted(() => {
    fetchData()
})
</script>
