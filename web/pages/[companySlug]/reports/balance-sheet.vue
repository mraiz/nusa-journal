<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <NuxtLink :to="`/${slug}/reports`" class="text-neutral-400 hover:text-neutral-600">🏛️</NuxtLink>
          Neraca (Balance Sheet)
        </h1>
        <p class="text-neutral-500 mt-1">Laporan Posisi Keuangan</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Period Selector -->
        <div class="relative min-w-[200px]">
          <select v-model="selectedPeriodId" @change="fetchData" class="input py-2 pr-8 text-sm bg-white" :disabled="periodStore.loading">
            <option value="" disabled>-- Pilih Periode --</option>
            <option v-for="period in periodStore.periods" :key="period.id" :value="period.id">
              {{ period.name }} ({{ formatDate(period.endDate) }})
            </option>
          </select>
        </div>
        
        <button class="btn btn-secondary flex items-center gap-2" @click="printReport">
          🖨️ Cetak
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <!-- Report Paper -->
    <div v-else-if="reportData" class="bg-white shadow-soft-lg p-8 md:p-12 rounded-none md:rounded-xl max-w-4xl mx-auto print:shadow-none print:p-0 print:w-full">
      
      <!-- Report Header -->
      <div class="text-center mb-8 border-b border-neutral-200 pb-6">
        <h2 class="text-2xl font-bold text-neutral-900 uppercase tracking-wide">{{ companyStore.currentCompany?.name }}</h2>
        <h3 class="text-xl font-medium text-neutral-700 mt-1">NERACA (BALANCE SHEET)</h3>
        <p class="text-neutral-500 mt-1">Per Tanggal {{ formatDate(currentPeriod?.endDate) }}</p>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        
        <!-- Assets Column -->
        <div>
          <h4 class="text-lg font-bold text-primary-700 border-b-2 border-primary-100 pb-2 mb-4">ASET (ASSETS)</h4>
          
          <div v-if="reportData.assets && reportData.assets.accounts.length > 0" class="space-y-2">
              <div v-for="acc in reportData.assets.accounts" :key="acc.code" class="flex justify-between text-sm py-1 border-b border-dotted border-neutral-200 last:border-0 hover:bg-neutral-50">
                <span class="text-neutral-600 pl-2">{{ acc.name }}</span>
                <span class="font-mono">{{ formatCurrency(acc.amount) }}</span>
              </div>
          </div>
          <div v-else class="text-sm text-neutral-400 italic">Tidak ada data aset</div>

          <div class="mt-8 pt-4 border-t-2 border-neutral-800 flex justify-between items-center bg-primary-50/50 p-2 rounded">
            <span class="font-bold text-lg text-neutral-900">TOTAL ASET</span>
            <span class="font-bold text-lg font-mono text-primary-700">{{ formatCurrency(reportData.assets.total) }}</span>
          </div>
        </div>

        <!-- Liabilities & Equity Column -->
        <div>
          <!-- Liabilities -->
          <div class="mb-8">
            <h4 class="text-lg font-bold text-red-700 border-b-2 border-red-100 pb-2 mb-4">KEWAJIBAN (LIABILITIES)</h4>
            
            <div v-if="reportData.liabilities && reportData.liabilities.accounts.length > 0" class="space-y-2">
                <div v-for="acc in reportData.liabilities.accounts" :key="acc.code" class="flex justify-between text-sm py-1 border-b border-dotted border-neutral-200 last:border-0 hover:bg-neutral-50">
                  <span class="text-neutral-600 pl-2">{{ acc.name }}</span>
                  <span class="font-mono">{{ formatCurrency(acc.amount) }}</span>
                </div>
            </div>
            <div v-else class="text-sm text-neutral-400 italic mb-4">Tidak ada data kewajiban</div>

            <div class="flex justify-between text-sm font-bold pt-2 border-t border-neutral-300 mb-6">
              <span>TOTAL KEWAJIBAN</span>
              <span class="font-mono">{{ formatCurrency(reportData.liabilities.total) }}</span>
            </div>
          </div>

          <!-- Equity -->
          <div>
            <h4 class="text-lg font-bold text-purple-700 border-b-2 border-purple-100 pb-2 mb-4">EKUITAS (EQUITY)</h4>
            
             <div v-if="reportData.equity && reportData.equity.accounts.length > 0" class="space-y-2">
                <div v-for="acc in reportData.equity.accounts" :key="acc.code" class="flex justify-between text-sm py-1 border-b border-dotted border-neutral-200 last:border-0 hover:bg-neutral-50">
                  <span class="text-neutral-600 pl-2">{{ acc.name }}</span>
                  <span class="font-mono">{{ formatCurrency(acc.amount) }}</span>
                </div>
             </div>
             
             <!-- Net Income Line -->
             <div class="flex justify-between text-sm py-1 border-b border-dotted border-neutral-200 hover:bg-neutral-50 font-medium text-purple-900">
                <span class="pl-2">Net Income (Current Period)</span>
                <span class="font-mono">{{ formatCurrency(reportData.equity.netIncome?.amount) }}</span>
             </div>

             <div class="flex justify-between text-sm font-bold pt-2 border-t border-neutral-300 mt-4">
               <span>TOTAL EKUITAS</span>
               <span class="font-mono">{{ formatCurrency(reportData.equity.total) }}</span>
             </div>
          </div>

          <!-- Total Liab + Equity -->
           <div class="mt-8 pt-4 border-t-2 border-neutral-800 flex justify-between items-center bg-purple-50/50 p-2 rounded">
            <span class="font-bold text-lg text-neutral-900">TOTAL KEWAJIBAN & EKUITAS</span>
            <span class="font-bold text-lg font-mono text-purple-700">{{ formatCurrency(reportData.totals.liabilitiesAndEquity) }}</span>
          </div>

        </div>
      </div>

    </div>
    
    <div v-else class="p-12 text-center text-neutral-500 glass-card">
      <p>Silakan pilih periode akuntansi untuk menampilkan Neraca.</p>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import { useReportStore } from '~/stores/report';
import { usePeriodStore } from '~/stores/period';
import { useCompanyStore } from '~/stores/company';

const route = useRoute()
const slug = route.params.companySlug as string
const reportStore = useReportStore()
const periodStore = usePeriodStore()
const companyStore = useCompanyStore()

const selectedPeriodId = ref('')

const loading = computed(() => reportStore.loading || periodStore.loading)
const reportData = computed(() => reportStore.balanceSheet)

const currentPeriod = computed(() => {
  return periodStore.periods.find(p => p.id === selectedPeriodId.value)
})

onMounted(async () => {
  if (slug) {
    await periodStore.fetchPeriods(slug)
    // Auto select latest open period or just latest period
    if (periodStore.periods.length > 0) {
      selectedPeriodId.value = periodStore.periods[0].id
      fetchData()
    }
  }
})

const fetchData = async () => {
  if (selectedPeriodId.value) {
    await reportStore.fetchBalanceSheet(slug, selectedPeriodId.value)
  }
}

const printReport = () => {
  window.print()
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatCurrency = (val?: number) => {
  if (val === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
}

definePageMeta({
  middleware: 'auth'
})
</script>
