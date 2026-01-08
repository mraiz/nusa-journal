<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <span class="text-3xl">📅</span> Periode Akuntansi
        </h1>
        <p class="text-neutral-500 mt-1">Kelola periode buku (Bulan/Tahun) dan statusnya</p>
      </div>
      <div class="flex gap-2 items-center">
        <!-- Year Filter -->
        <div class="w-32">
            <BaseSelect 
                v-model="selectedYear"
                :options="yearOptions"
                placeholder="Pilih Tahun"
            />
        </div>

        <button class="btn btn-primary flex items-center gap-2" @click="openCreateModal">
          <span class="text-lg">+</span> Buat Periode Baru
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="periodStore.loading && periodStore.periods.length === 0" class="p-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="periodStore.periods.length === 0" class="p-12 text-center text-neutral-500 glass-card">
      <p class="text-lg mb-2">Belum ada periode akuntansi.</p>
      <button class="text-primary-600 hover:underline" @click="openCreateModal">Buat periode pertama</button>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div v-for="period in periodStore.periods" :key="period.id" 
           class="glass-card p-6 flex flex-col md:flex-row items-center justify-between group hover:shadow-soft-lg transition-all border-l-4"
           :class="period.status === 'OPEN' ? 'border-green-500' : 'border-neutral-400 bg-neutral-50'">
        
        <!-- Info -->
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h3 class="text-lg font-bold text-neutral-800">{{ period.name }}</h3>
            <span class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide"
                  :class="period.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'">
              {{ period.status === 'OPEN' ? 'Sedang Berjalan' : 'Tutup Buku' }}
            </span>
          </div>
          <p class="text-sm text-neutral-500 flex items-center gap-2">
            <span>🗓️ {{ formatDate(period.startDate) }} — {{ formatDate(period.endDate) }}</span>
            <span class="w-1 h-1 rounded-full bg-neutral-300"></span>
            <span>📝 {{ period.journalCount || 0 }} Jurnal</span>
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-4 md:mt-0">
           <button v-if="period.status === 'OPEN'" 
                   class="btn btn-sm btn-secondary text-red-600 hover:bg-red-50 border-red-100"
                   @click="confirmClose(period)">
             🔒 Tutup Buku
           </button>
           <button v-else 
                   class="btn btn-sm btn-secondary"
                   @click="confirmReopen(period)">
             🔓 Buka Kembali
           </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <h3 class="text-xl font-bold text-neutral-800 mb-4">Buat Periode Baru</h3>
        
        <form @submit.prevent="submitCreate" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Nama Periode</label>
            <input type="text" v-model="form.name" class="input py-2" placeholder="Contoh: Januari 2026" required>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-neutral-500 uppercase">Mulai</label>
              <input type="date" v-model="form.startDate" class="input py-2" required>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-neutral-500 uppercase">Selesai</label>
              <input type="date" v-model="form.endDate" class="input py-2" required>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="periodStore.loading">
              {{ periodStore.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import { usePeriodStore, type Period } from '~/stores/period';
import BaseSelect from '~/components/common/BaseSelect.vue';

const route = useRoute()
const slug = route.params.companySlug as string
const periodStore = usePeriodStore()

const showModal = ref(false)
const selectedYear = ref<number | null>(new Date().getFullYear())

const form = reactive({
  name: '',
  startDate: '',
  endDate: ''
})

// Generate Year Options (Current Year +/- 2)
const yearOptions = computed(() => {
    const current = new Date().getFullYear()
    return [
        { value: null, label: 'Semua Tahun' },
        { value: current + 1, label: String(current + 1) },
        { value: current, label: String(current) },
        { value: current - 1, label: String(current - 1) },
        { value: current - 2, label: String(current - 2) },
        { value: current - 3, label: String(current - 3) },
    ]
})

// Fetch on mount and when year changes
const fetchData = () => {
   const params = selectedYear.value ? { year: selectedYear.value } : {}
   periodStore.fetchPeriods(slug, params)
}

watch(selectedYear, () => {
    fetchData()
})

onMounted(() => {
  if (slug) {
    fetchData()
  }
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const openCreateModal = () => {
  // Auto suggest next month if exists, otherwise current month
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed
  
  // Set default to 1st to last day of current month
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  
  // Basic prefill
  form.name = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  form.startDate = start.toISOString().split('T')[0]
  form.endDate = end.toISOString().split('T')[0]
  
  showModal.value = true
}

const submitCreate = async () => {
  try {
    await periodStore.createPeriod(slug, {
      name: form.name,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString()
    })
    showModal.value = false
  } catch (e) {
    alert('Gagal membuat periode: ' + e)
  }
}

const confirmClose = async (period: Period) => {
  if (confirm(`Yakin ingin menutup buku periode "${period.name}"? \nJurnal tidak bisa ditambah/diedit lagi di periode ini.`)) {
    try {
      await periodStore.closePeriod(slug, period.id)
    } catch (e) {
      alert('Gagal menutup periode: ' + e)
    }
  }
}

const confirmReopen = async (period: Period) => {
   if (confirm(`Yakin ingin membuka kembali periode "${period.name}"?`)) {
    try {
      await periodStore.reopenPeriod(slug, period.id)
    } catch (e) {
      alert('Gagal membuka periode: ' + e)
    }
  }
}

definePageMeta({
  middleware: 'auth'
})
</script>
