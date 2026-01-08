<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <span class="text-3xl">📒</span> Buku Besar (General Ledger)
        </h1>
        <p class="text-neutral-500 mt-1">Lihat riwayat transaksi dan saldo per akun</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary flex items-center gap-2" @click="printLedger">
          <span class="text-lg">🖨️</span> Cetak / PDF
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="glass-card p-6 mb-6 animate-slide-up">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <!-- Account Select -->
        <div class="col-span-1 md:col-span-2 space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Pilih Akun</label>
          <select v-model="selectedAccountId" class="input py-2" @change="fetchData">
            <option value="" disabled>-- Pilih Akun --</option>
            <optgroup v-for="group in accountOptions" :key="group.label" :label="group.label">
              <option v-for="acc in group.options" :key="acc.id" :value="acc.id">
                {{ acc.code }} - {{ acc.name }}
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Date Range -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Dari Tanggal</label>
          <input type="date" v-model="startDate" class="input py-2">
        </div>
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Sampai Tanggal</label>
          <input type="date" v-model="endDate" class="input py-2">
        </div>

        <!-- Filter Button (Optional since we react to change, but good for UX) -->
        <!-- <div class="space-y-1">
          <button class="btn btn-primary w-full py-2" @click="fetchData">Tampilkan</button>
        </div> -->
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="p-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="!ledgerData" class="p-12 text-center glass-card">
       <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">🔍</span>
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Pilih Akun</h3>
        <p class="text-neutral-500 max-w-sm mx-auto">
          Silakan pilih akun dari dropdown di atas untuk melihat detail pergerakan saldo dan riwayat transaksi.
        </p>
    </div>

    <div v-else class="space-y-6 animate-fade-in">
      <!-- Summary Card -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-xs text-neutral-500 uppercase font-semibold">Total Debit</p>
            <p class="text-lg font-bold text-neutral-800">{{ formatCurrency(ledgerData.summary.totalDebit) }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">D</div>
        </div>
        <div class="glass-card p-4 flex items-center justify-between">
          <div>
            <p class="text-xs text-neutral-500 uppercase font-semibold">Total Kredit</p>
            <p class="text-lg font-bold text-neutral-800">{{ formatCurrency(ledgerData.summary.totalCredit) }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">K</div>
        </div>
        <div class="glass-card p-4 flex items-center justify-between bg-primary-50 border-primary-100 sm:col-span-2 xl:col-span-1">
          <div>
            <p class="text-xs text-primary-600 uppercase font-semibold">Saldo Akhir</p>
            <p class="text-xl font-bold text-primary-800">{{ formatCurrency(ledgerData.summary.finalBalance) }}</p>
            <p class="text-xs font-medium" :class="ledgerData.summary.finalBalanceType === 'debit' ? 'text-green-600' : 'text-red-500'">
              Posisi: {{ ledgerData.summary.finalBalanceType.toUpperCase() }}
            </p>
          </div>
          <div class="text-3xl">💰</div>
        </div>
      </div>

      <!-- Empty Transactions State -->
      <div v-if="ledgerData.transactions.length === 0" class="glass-card p-12 text-center">
        <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">📝</span>
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Tidak ada transaksi</h3>
        <p class="text-neutral-500 mb-6 max-w-sm mx-auto">
          Belum ada transaksi yang tercatat untuk akun ini pada periode yang dipilih.
        </p>
        <NuxtLink :to="`/${slug}/journals/create`" class="btn btn-primary">
          + Buat Jurnal Baru
        </NuxtLink>
      </div>

      <!-- Transactions Table -->
      <div v-else class="glass-card max-w-full overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1000px]">
            <thead class="bg-neutral-50 text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">
              <tr>
                <th class="px-6 py-3">Tanggal</th>
                <th class="px-6 py-3">No. Jurnal</th>
                <th class="px-6 py-3">Deskripsi</th>
                <th class="px-6 py-3 text-right">Debit</th>
                <th class="px-6 py-3 text-right">Kredit</th>
                <th class="px-6 py-3 text-right bg-neutral-100/50">Saldo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr v-for="(tx, index) in ledgerData.transactions" :key="index" class="hover:bg-primary-50/30 transition-colors">
                <td class="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                  {{ formatDate(tx.date) }}
                </td>
                <td class="px-6 py-4">
                  <NuxtLink :to="`/${slug}/journals`" class="font-mono text-sm text-primary-600 hover:underline">
                    {{ tx.journalNumber }}
                  </NuxtLink>
                </td>
                <td class="px-6 py-4 text-sm text-neutral-800 max-w-[150px] md:max-w-xs truncate" :title="tx.lineDescription || tx.description">
                  {{ tx.lineDescription || tx.description }}
                </td>
                <td class="px-6 py-4 text-sm text-neutral-800 text-right font-mono">
                  {{ tx.debit > 0 ? formatCurrency(tx.debit) : '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-neutral-800 text-right font-mono">
                  {{ tx.credit > 0 ? formatCurrency(tx.credit) : '-' }}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-right font-mono bg-neutral-50/50" 
                    :class="tx.balanceType === 'debit' ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(tx.balance) }}
                  <span class="text-[10px] ml-1 opacity-60">{{ tx.balanceType === 'debit' ? 'Dr' : 'Kr' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAccountStore } from '~/stores/account';
import { useLedgerStore } from '~/stores/ledger';

const route = useRoute()
const slug = route.params.companySlug as string
const accountStore = useAccountStore()
const ledgerStore = useLedgerStore()

// State
const selectedAccountId = ref('')
const startDate = ref('')
const endDate = ref('')

// Computed
const loading = computed(() => ledgerStore.loading || accountStore.loading)
const ledgerData = computed(() => ledgerStore.ledgerData)

const accountOptions = computed(() => {
  const postingAccounts = accountStore.accountsFlat.filter(a => a.isPosting)
  const groups: Record<string, any[]> = {}
  postingAccounts.forEach(acc => {
    if (!groups[acc.type]) groups[acc.type] = [];
    groups[acc.type].push(acc)
  })
  return Object.keys(groups).map(type => ({
    label: type.replace(/_/g, ' '),
    options: groups[type]
  }))
})

// Initial Fetch
onMounted(async () => {
  if (slug) {
    // Always fetch all accounts to ensure dropdown is populated
    await accountStore.fetchAccounts(slug, { limit: 1000 })
  }
})

// Actions
const fetchData = async () => {
  if (!selectedAccountId.value) return
  
  await ledgerStore.fetchLedger(slug, selectedAccountId.value, {
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined
  })
}

const printLedger = () => {
  window.print()
}

// Watch filters
watch([startDate, endDate], () => {
  if (selectedAccountId.value) {
    fetchData()
  }
})

// Helpers
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
}

definePageMeta({
  middleware: 'auth'
})
</script>
