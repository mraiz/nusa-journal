<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink :to="`/${slug}/journals`" class="text-neutral-500 hover:text-primary-600 transition-colors">
            ← Kembali
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2" v-if="journal">
          <span class="text-3xl">📄</span> {{ journal.journalNumber }}
          <span v-if="journal.isReversed" class="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">Reversed</span>
        </h1>
        <div v-if="journal" class="flex items-center gap-4 mt-2 text-sm text-neutral-600">
          <div class="flex items-center gap-1">
            <span>📅</span>
            <span>{{ formatDate(journal.date) }}</span>
          </div>
          <div class="flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded">
             <span>📥</span>
             <span>Periode: {{ journal.period.name }}</span>
          </div>
        </div>
      </div>
      
          <div class="flex gap-2" v-if="journal">
             <button 
                class="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50" 
                v-if="!journal.isReversed"
                @click="handleReverse"
             >
                Reverse Jurnal
             </button>
          </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>

    <div v-else-if="journal" class="space-y-6 animate-slide-up">
      
      <!-- Info Card -->
      <div class="glass-card p-6">
         <h3 class="text-xs font-bold text-neutral-500 uppercase mb-2">Deskripsi</h3>
         <p class="text-lg text-neutral-800">{{ journal.description }}</p>
         <p v-if="journal.reference" class="mt-2 text-sm text-neutral-500">Ref: {{ journal.reference }}</p>
      </div>

      <!-- Lines Table -->
      <div class="glass-card overflow-hidden">
        <div class="p-4 bg-neutral-50/50 border-b border-neutral-100">
           <h3 class="font-bold text-neutral-700">Rincian Transaksi</h3>
        </div>
        <table class="w-full">
            <thead class="bg-neutral-50 text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">
              <tr>
                <th class="px-6 py-3">Akun</th>
                <th class="px-6 py-3">Deskripsi Baris</th>
                <th class="px-6 py-3 text-right">Debit</th>
                <th class="px-6 py-3 text-right">Kredit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
               <tr v-for="line in journal.lines" :key="line.id" class="hover:bg-neutral-50/30">
                  <td class="px-6 py-4">
                     <div class="font-medium text-primary-700">{{ line.account.code }}</div>
                     <div class="text-sm text-neutral-600">{{ line.account.name }}</div>
                  </td>
                  <td class="px-6 py-4 text-sm text-neutral-600">
                     {{ line.description }}
                  </td>
                  <td class="px-6 py-4 text-right font-mono text-sm text-neutral-800">
                     <span v-if="line.debit > 0">{{ formatCurrency(line.debit) }}</span>
                     <span v-else class="text-neutral-300">-</span>
                  </td>
                  <td class="px-6 py-4 text-right font-mono text-sm text-neutral-800">
                     <span v-if="line.credit > 0">{{ formatCurrency(line.credit) }}</span>
                     <span v-else class="text-neutral-300">-</span>
                  </td>
               </tr>
            </tbody>
            <tfoot class="bg-neutral-50 font-bold text-neutral-700">
               <tr>
                  <td colspan="2" class="px-6 py-4 text-right uppercase text-xs tracking-wider">Total</td>
                  <td class="px-6 py-4 text-right font-mono text-sm">{{ formatCurrency(journal.totalDebit) }}</td>
                  <td class="px-6 py-4 text-right font-mono text-sm">{{ formatCurrency(journal.totalCredit) }}</td>
               </tr>
            </tfoot>
        </table>
      </div>

      <!-- Metadata -->
      <div class="text-right text-xs text-neutral-400">
         Dibuat pada: {{ new Date(journal.createdAt).toLocaleString('id-ID') }}
      </div>

    </div>

    <!-- Not Found -->
    <div v-else class="p-12 text-center">
       <p class="text-neutral-500">Jurnal tidak ditemukan</p>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import { useJournalStore } from '~/stores/journal';

const route = useRoute()
const journalStore = useJournalStore()
const slug = route.params.companySlug as string
const id = route.params.id as string

const loading = ref(true)
const journal = ref<any>(null)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
}

onMounted(async () => {
  if (slug && id) {
    try {
      journal.value = await journalStore.fetchJournal(slug, id)
    } catch (e) {
      console.error(e)
    } finally {
        loading.value = false
    }
  }
})

const handleReverse = async () => {
    if (!confirm('Yakin ingin me-reverse jurnal ini? \nJurnal pembalik akan dibuat otomatis.')) return

    try {
        await journalStore.reverseJournal(slug, id)
        alert('Jurnal berhasil di-reverse!')
        // Refresh data
        journal.value = await journalStore.fetchJournal(slug, id)
    } catch (e: any) {
        alert(e.message || 'Gagal reverse jurnal')
    }
}

definePageMeta({
  middleware: 'auth'
})
</script>
