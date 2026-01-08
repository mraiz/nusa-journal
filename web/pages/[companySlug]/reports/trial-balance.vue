<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <NuxtLink :to="`/${slug}/reports`" class="text-neutral-400 hover:text-neutral-600">🏛️</NuxtLink>
          Neraca Saldo (Trial Balance)
        </h1>
        <p class="text-neutral-500 mt-1">Daftar saldo akhir semua akun</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Date Selector (Trial Balance uses asOfDate usually, or Period End Date) -->
        <!-- Logic: Can select Period OR specific Date -->
        <!-- Simplified: Select Period (using end date) or "Today" -->
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
    <div v-else-if="reportData" class="bg-white shadow-soft-lg p-8 md:p-12 rounded-none md:rounded-xl max-w-5xl mx-auto print:shadow-none print:p-0 print:w-full">
      
      <!-- Report Header -->
      <div class="text-center mb-8 border-b border-neutral-200 pb-6 print:mb-4">
        <h2 class="text-2xl font-bold text-neutral-900 uppercase tracking-wide">{{ companyStore.currentCompany?.name }}</h2>
        <h3 class="text-xl font-medium text-neutral-700 mt-1">NERACA SALDO (TRIAL BALANCE)</h3>
        <p class="text-neutral-500 mt-1">Per Tanggal {{ formatDate(reportData.asOfDate) }}</p>
      </div>

       <!-- Table -->
       <div class="overflow-x-auto">
         <table class="w-full text-sm">
           <thead class="bg-neutral-100 text-xs font-bold text-neutral-600 uppercase tracking-wider text-left border-y border-neutral-200">
             <tr>
               <th class="px-4 py-3">Kode</th>
               <th class="px-4 py-3">Nama Akun</th>
               <th class="px-4 py-3">Tipe</th>
               <th class="px-4 py-3 text-right">Debit</th>
               <th class="px-4 py-3 text-right">Kredit</th>
             </tr>
           </thead>
           <tbody class="divide-y divide-neutral-100">
             <!-- Iterate through types in specific order -->
             <template v-for="type in ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']" :key="type">
               <!-- Section Header (Optional) -->
               <!-- <tr class="bg-neutral-50/50">
                 <td colspan="5" class="px-4 py-2 font-bold text-xs text-neutral-500 uppercase">{{ type }}</td>
               </tr> -->
               
               <tr v-for="acc in (reportData.accounts[type] || [])" :key="acc.account.id" class="hover:bg-neutral-50">
                 <td class="px-4 py-2.5 font-mono text-neutral-500">{{ acc.account.code }}</td>
                 <td class="px-4 py-2.5 font-medium text-neutral-800">{{ acc.account.name }}</td>
                 <td class="px-4 py-2.5 text-xs text-neutral-400">{{ type }}</td>
                 
                 <!-- Debit Column -->
                 <td class="px-4 py-2.5 text-right font-mono" :class="acc.balanceType === 'debit' ? 'text-neutral-800' : 'text-neutral-300'">
                   {{ acc.balanceType === 'debit' ? formatCurrency(acc.balance) : '-' }}
                 </td>

                 <!-- Credit Column -->
                 <td class="px-4 py-2.5 text-right font-mono" :class="acc.balanceType === 'credit' ? 'text-neutral-800' : 'text-neutral-300'">
                   {{ acc.balanceType === 'credit' ? formatCurrency(acc.balance) : '-' }}
                 </td>
               </tr>
             </template>
           </tbody>
           <tfoot class="bg-neutral-100 font-bold border-y-2 border-neutral-300">
             <tr>
               <td colspan="3" class="px-4 py-3 text-right uppercase">Total</td>
               <td class="px-4 py-3 text-right font-mono text-neutral-900">{{ formatCurrency(reportData.grandTotal.totalDebit) }}</td>
               <td class="px-4 py-3 text-right font-mono text-neutral-900">{{ formatCurrency(reportData.grandTotal.totalCredit) }}</td>
             </tr>
             <tr v-if="!reportData.grandTotal.isBalanced" class="bg-red-50 text-red-600">
                <td colspan="3" class="px-4 py-2 text-right text-xs">SELISIH (UNBALANCED)</td>
                <td colspan="2" class="px-4 py-2 text-center font-mono">{{ formatCurrency(reportData.grandTotal.difference) }}</td>
             </tr>
           </tfoot>
         </table>
       </div>

    </div>

    <div v-else class="p-12 text-center text-neutral-500 glass-card">
      <p>Silakan pilih periode untuk menampilkan Trial Balance.</p>
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
const reportData = computed(() => reportStore.trialBalance)

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
    // API supports periodId param
    await reportStore.fetchTrialBalance(slug, { periodId: selectedPeriodId.value })
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
  if (val === undefined) return '0'
  return new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
}

definePageMeta({
  middleware: 'auth'
})
</script>
