<template>
  <NuxtLayout name="dashboard">
    <!-- Welcome Header -->
    <div class="relative mb-10 p-6 rounded-3xl overflow-hidden animate-slide-down">
      <div class="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 backdrop-blur-3xl"></div>
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl"></div>
      
      <div class="relative z-10">
        <h1 class="text-3xl font-bold text-neutral-800">
          Selamat Datang, <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">{{ user?.name?.split(' ')[0] }}</span>! 👋
        </h1>
        <p class="text-neutral-600 mt-2 text-lg">
          Berikut ringkasan performa bisnis <span class="font-bold text-neutral-800">{{ currentCompany?.name }}</span> 
          <span v-if="periodStore.currentPeriod"> untuk periode {{ periodStore.currentPeriod.name }}</span>.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="reportStore.loading && !summaryData" class="py-20 flex justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>

    <div v-else>
      <!-- aku t Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
        <NuxtLink v-for="(stat, index) in stats" :key="index" :to="stat.link"
            class="glass-card p-6 relative overflow-hidden group hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer block">
          
          <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125" :class="stat.bgClass"></div>
          
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="p-2 rounded-lg bg-neutral-50 border border-neutral-100 text-2xl group-hover:scale-110 transition-transform duration-300">{{ stat.icon }}</span>
                <span class="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                  :class="stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                   <!-- Mock Trend for now as we don't have previous period comp yet -->
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="stat.trendUp ? 'M13 7l5 5m0 0l-5 5m5-5H6' : 'M13 17l5-5m0 0l-5-5m5 5H6'" transform="rotate(-45)" />
                  </svg>
                  {{ stat.trend }}
                </span>
              </div>
              <p class="text-sm font-medium text-neutral-500 mb-1">{{ stat.title }}</p>
              <h3 class="text-2xl lg:text-3xl font-bold text-neutral-800 tracking-tight">{{ stat.value }}</h3>
            </div>
            
            <div class="mt-4 w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
               <div class="h-full rounded-full" :class="stat.bgClass" :style="{ width: '60%' }"></div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Main Content Grid -->
      <div class="grid lg:grid-cols-3 gap-8 mb-10 animate-slide-up" style="animation-delay: 0.1s">
        
        <!-- Financial Chart -->
        <div class="lg:col-span-2 glass-card p-8 flex flex-col h-[500px]">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-xl font-bold text-neutral-800">Arus Kas (Pendapatan vs Pengeluaran)</h3>
              <p class="text-sm text-neutral-500">Tren 6 bulan terakhir</p>
            </div>
          </div>
          
          <!-- Chart Visualization -->
          <div class="flex-1 flex items-end justify-between gap-4 px-2 pb-2 relative">
            <!-- Grid Lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="border-t border-neutral-100 w-full h-0"></div>
              <div class="border-t border-neutral-100 w-full h-0"></div>
              <div class="border-t border-neutral-100 w-full h-0"></div>
              <div class="border-t border-neutral-100 w-full h-0"></div>
              <div class="border-t border-neutral-200 w-full h-0"></div>
            </div>

            <div v-for="(item, i) in analyticsSeries" :key="i" 
                 class="relative z-10 flex-1 flex flex-col justify-end items-center group h-full">
              
              <div class="w-full max-w-[40px] flex flex-col justify-end h-[85%] gap-1 hover:scale-105 transition-transform cursor-pointer relative">
                <!-- Tooltip -->
                 <div class="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl pointer-events-none transition-opacity whitespace-nowrap z-50 backdrop-blur-sm border border-white/10">
                   <div class="font-bold mb-0.5">{{ item.month }}</div>
                   <div class="text-green-300">In: {{ formatShort(item.revenue) }}</div>
                   <div class="text-red-300">Out: {{ formatShort(item.expense) }}</div>
                 </div>

                <!-- Income Bar -->
                <div class="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-sm relative shadow-sm"
                     :style="{ height: `${calculateHeight(item.revenue)}%` }">
                </div>
                <!-- Expense Bar -->
                <div class="w-full bg-gradient-to-t from-red-400 to-red-300 rounded-b-sm opacity-90 shadow-sm"
                     :style="{ height: `${calculateHeight(item.expense)}%` }"></div>
              </div>
              
              <span class="text-xs text-neutral-500 mt-3 font-medium">{{ item.month }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity & Quick Actions -->
        <div class="space-y-8 flex flex-col">
          
          <!-- Recent Activity -->
          <div class="glass-card p-6 flex-1">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold text-neutral-800">Aktivitas Terbaru</h3>
              <NuxtLink :to="`/${slug}/journals`" class="text-primary-600 text-xs font-semibold hover:underline">Lihat Semua</NuxtLink>
            </div>
            
            <div v-if="journalStore.loading" class="flex justify-center py-4">
                 <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
            <div v-else-if="recentJournals.length === 0" class="text-center text-neutral-400 text-sm py-8">
                Belum ada aktivitas.
            </div>
            <div v-else class="space-y-4">
               <NuxtLink v-for="journal in recentJournals" :key="journal.id" :to="`/${slug}/journals/${journal.id}`"
                    class="flex items-center gap-4 group cursor-pointer hover:bg-neutral-50 p-3 rounded-2xl transition-colors -mx-3">
                 <!-- Icon -->
                 <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm bg-white border border-neutral-100 text-neutral-500 group-hover:scale-105 transition-transform">
                   📝
                 </div>
                 
                 <!-- Content -->
                 <div class="flex-1 min-w-0">
                   <p class="text-sm font-bold text-neutral-800 truncate mb-0.5">{{ journal.description }}</p>
                   <p class="text-xs text-neutral-500 truncate">{{ journal.journalNumber }} • {{ journal.createdBy?.name?.split(' ')[0] || 'User' }}</p>
                 </div>

                 <!-- Right Side Info -->
                 <div class="text-right whitespace-nowrap">
                   <p class="text-sm font-bold font-mono text-neutral-800">{{ formatCurrency(journal.totalDebit) }}</p>
                    <p class="text-[10px] font-medium text-neutral-400 mt-1">{{ timeAgo(journal.createdAt) }}</p>
                 </div>
               </NuxtLink>
            </div>
          </div>

       

        </div>
      </div>

         <!-- Quick Actions -->
          <div class="glass-card p-6">
            <h3 class="font-bold text-neutral-800 mb-4">Akses Cepat</h3>
            <div class="grid grid-cols-2 gap-3">
              <NuxtLink :to="`/${slug}/journals/create`" 
                class="p-4 rounded-2xl border border-neutral-100 bg-white hover:border-primary-200 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-2">
                <span class="text-2xl group-hover:scale-110 transition-transform duration-300 bg-neutral-50 p-2 rounded-full">✍️</span>
                <span class="font-semibold text-neutral-600 text-xs">Buat Jurnal</span>
              </NuxtLink>
              
              <NuxtLink :to="`/${slug}/accounts`" 
                class="p-4 rounded-2xl border border-neutral-100 bg-white hover:border-primary-200 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-2">
                <span class="text-2xl group-hover:scale-110 transition-transform duration-300 bg-neutral-50 p-2 rounded-full">🗂️</span>
                <span class="font-semibold text-neutral-600 text-xs">Chart of Accounts</span>
              </NuxtLink>

              <NuxtLink :to="`/${slug}/settings`" 
                class="p-4 rounded-2xl border border-neutral-100 bg-white hover:border-primary-200 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-2">
                <span class="text-2xl group-hover:scale-110 transition-transform duration-300 bg-neutral-50 p-2 rounded-full">👥</span>
                <span class="font-semibold text-neutral-600 text-xs">User & Akses</span>
              </NuxtLink>

              <NuxtLink :to="`/${slug}/reports`" 
                class="p-4 rounded-2xl border border-neutral-100 bg-white hover:border-primary-200 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group text-center flex flex-col items-center justify-center gap-2">
                <span class="text-2xl group-hover:scale-110 transition-transform duration-300 bg-neutral-50 p-2 rounded-full">📊</span>
                <span class="font-semibold text-neutral-600 text-xs">Laporan</span>
              </NuxtLink>
            </div>
          </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCompanyStore } from '~/stores/company'
import { usePeriodStore } from '~/stores/period'
import { useReportStore } from '~/stores/report'
import { useJournalStore } from '~/stores/journal'
import { useTimeAgo } from '@vueuse/core'

const authStore = useAuthStore()
const companyStore = useCompanyStore()
const periodStore = usePeriodStore()
const reportStore = useReportStore()
const journalStore = useJournalStore()
const route = useRoute()

const slug = route.params.companySlug as string

const user = computed(() => authStore.user)
const currentCompany = computed(() => companyStore.currentCompany)
const summaryData = ref<any>(null)
const analyticsSeries = ref<any[]>([])
const recentJournals = ref<any[]>([])

// Formatting Utils
const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
const formatShort = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'jt';
    return (val / 1000).toFixed(0) + 'k';
}
const timeAgo = (date: string) => useTimeAgo(date).value

// Chart scaling max value
const maxValue = computed(() => {
    let max = 1000;
    analyticsSeries.value.forEach(s => {
        max = Math.max(max, s.revenue, s.expense);
    });
    return max * 1.1; // buffer
})

const calculateHeight = (val: number) => {
    return Math.min((val / maxValue.value) * 100, 100);
}

// Data fetching
const initData = async () => {
    // 1. Fetch Periods
    await periodStore.fetchPeriods(slug)
    
    // 2. Fetch Journals (Recent)
    const jRes = await journalStore.fetchJournals(slug, { limit: 5 })
    recentJournals.value = Array.isArray(jRes) ? jRes : (jRes.data || [])

    // 3. Fetch Analytics
    analyticsSeries.value = await reportStore.fetchAnalytics(slug, 6)
    
    // 4. Fetch Summary if period exists
    if (periodStore.currentPeriod) {
        summaryData.value = await reportStore.fetchSummary(slug, periodStore.currentPeriod.id)
    }
}

onMounted(() => {
    if (slug) initData()
})

// Stats Computation
const stats = computed(() => {
    const s = summaryData.value?.summary
    const m = summaryData.value?.metrics
    
    return [
      { 
        title: 'Total Pendapatan', 
        value: s ? formatShort(s.totalRevenue) : '-', 
        trend: m?.profitMargin ? `Margin ${m.profitMargin}` : '-', 
        trendUp: true, 
        bgClass: 'bg-green-500', 
        icon: '💰',
        link: `/${slug}/reports` // Link to reports
      },
      { 
        title: 'Total Pengeluaran', 
        value: s ? formatShort(s.totalExpenses) : '-', 
        trend: 'Expenses', 
        trendUp: false, 
        bgClass: 'bg-red-500', 
        icon: '🧾',
        link: `/${slug}/reports`
      },
      { 
        title: 'Laba Bersih', 
        value: s ? formatShort(s.netIncome.amount) : '-', 
        trend: s?.netIncome.type === 'PROFIT' ? 'Profit' : 'Loss', 
        trendUp: s?.netIncome.type === 'PROFIT', 
        bgClass: 'bg-primary-500', 
        icon: '📈',
        link: `/${slug}/reports`
      },
      { 
        title: 'Saldo Kas', 
        value: m?.cashBalance !== undefined ? formatShort(m.cashBalance) : '-', 
        trend: 'Liquid', 
        trendUp: true, 
        bgClass: 'bg-primary-500', 
        icon: '🏦',
        link: `/${slug}/reports`
      },
    ]
})

definePageMeta({
  middleware: ['auth']
})
</script>
