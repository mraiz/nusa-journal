<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <NuxtLink :to="`/${slug}/reports`" class="text-neutral-400 hover:text-neutral-600">🏛️</NuxtLink>
          Laba Rugi (Profit & Loss)
        </h1>
        <p class="text-neutral-500 mt-1">Laporan Kinerja Keuangan (Pendapatan vs Beban)</p>
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
        <h3 class="text-xl font-medium text-neutral-700 mt-1">LAPORAN LABA RUGI</h3>
        <p class="text-neutral-500 mt-1">Periode: {{ formatDate(reportData.period.startDate) }} s/d {{ formatDate(reportData.period.endDate) }}</p>
      </div>

      <!-- Content -->
      <div class="space-y-8">
        
        <!-- Revenue Section -->
        <div>
          <h4 class="text-lg font-bold text-green-700 border-b-2 border-green-100 pb-2 mb-4 uppercase">Pendapatan (Revenue)</h4>
          
          <div v-if="reportData.revenue.accounts.length > 0" class="space-y-2">
             <div v-for="acc in reportData.revenue.accounts" :key="acc.code" class="flex justify-between text-sm py-1 border-b border-dotted border-neutral-200 last:border-0 hover:bg-neutral-50">
               <span class="text-neutral-600 pl-2">{{ acc.name }}</span>
               <span class="font-mono">{{ formatCurrency(acc.amount) }}</span>
             </div>
          </div>
          <div v-else class="text-sm text-neutral-400 italic">Tidak ada pendapatan</div>

          <div class="flex justify-between text-base font-bold pt-4 mt-2 border-t border-neutral-300">
            <span>TOTAL PENDAPATAN</span>
            <span class="font-mono text-green-700">{{ formatCurrency(reportData.revenue.total) }}</span>
          </div>
        </div>

        <!-- Expenses Section -->
        <div>
          <h4 class="text-lg font-bold text-red-700 border-b-2 border-red-100 pb-2 mb-4 uppercase">Beban (Expenses)</h4>
          
          <div v-if="reportData.expenses.accounts.length > 0" class="space-y-2">
             <div v-for="acc in reportData.expenses.accounts" :key="acc.code" class="flex justify-between text-sm py-1 border-b border-dotted border-neutral-200 last:border-0 hover:bg-neutral-50">
               <span class="text-neutral-600 pl-2">{{ acc.name }}</span>
               <span class="font-mono">{{ formatCurrency(acc.amount) }}</span>
             </div>
          </div>
          <div v-else class="text-sm text-neutral-400 italic">Tidak ada beban</div>

          <div class="flex justify-between text-base font-bold pt-4 mt-2 border-t border-neutral-300">
            <span>TOTAL BEBAN</span>
            <span class="font-mono text-red-700">{{ formatCurrency(reportData.expenses.total) }}</span>
          </div>
        </div>

        <!-- Net Income -->
        <div class="mt-12 pt-6 border-t-4 border-double border-neutral-300">
          <div class="flex justify-between items-center bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div>
              <span class="font-bold text-xl text-neutral-900 uppercase">LABA BERSIH (NET INCOME)</span>
              <p class="text-sm font-medium mt-1" :class="reportData.netIncome.type === 'PROFIT' ? 'text-green-600' : 'text-red-500'">
                Status: {{ reportData.netIncome.type === 'PROFIT' ? 'Laba (Profit)' : 'Rugi (Loss)' }}
              </p>
            </div>
            <span class="font-bold text-2xl font-mono" :class="reportData.netIncome.type === 'PROFIT' ? 'text-green-700' : 'text-red-600'">
              {{ reportData.netIncome.type === 'PROFIT' ? '' : '(' }}{{ formatCurrency(reportData.netIncome.amount) }}{{ reportData.netIncome.type === 'PROFIT' ? '' : ')' }}
            </span>
          </div>
        </div>

      </div>

    </div>
    
    <div v-else class="p-12 text-center text-neutral-500 glass-card">
      <p>Silakan pilih periode akuntansi untuk menampilkan Laporan Laba Rugi.</p>
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
const reportData = computed(() => reportStore.profitLoss)

const currentPeriod = computed(() => {
  return periodStore.periods.find(p => p.id === selectedPeriodId.value)
})

onMounted(async () => {
  if (slug) {
    await periodStore.fetchPeriods(slug)
    if (periodStore.periods.length > 0) {
      selectedPeriodId.value = periodStore.periods[0].id
      fetchData()
    }
  }
})

const fetchData = async () => {
  if (selectedPeriodId.value) {
    await reportStore.fetchProfitLoss(slug, selectedPeriodId.value)
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
