<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <span class="text-3xl">📓</span> Jurnal Umum
        </h1>
        <p class="text-neutral-500 mt-1">Daftar semua transaksi jurnal yang tercatat</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          id="btn-new-journal"
          :to="`/${slug}/journals/create`"
          class="btn btn-primary flex items-center gap-2"
        >
          <span class="text-lg">✍️</span> Buat Jurnal
        </NuxtLink>
      </div>
    </div>

    <!-- Main Content -->
    <div class="glass-card overflow-hidden">
      <!-- Toolbar -->
      <div
        class="p-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50"
      >
        <!-- Search -->
        <div class="relative w-full sm:w-64">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari no. jurnal atau deskripsi..."
            class="input pl-10 py-2 text-sm"
          />
          <span class="absolute left-3 top-2.5 text-neutral-400">🔍</span>
        </div>

        <!-- Date Filters -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input type="date" v-model="startDate" class="input py-2 text-sm" placeholder="Dari" />
          <span class="text-neutral-400">-</span>
          <input type="date" v-model="endDate" class="input py-2 text-sm" placeholder="Sampai" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="journalStore.loading" class="p-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="journalStore.journals.length === 0" class="p-12 text-center">
        <div
          class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-3xl">📓</span>
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Belum ada jurnal</h3>
        <p class="text-neutral-500 mb-6 max-w-sm mx-auto">
          Catat transaksi keuangan pertama Anda untuk mulai pembukuan.
        </p>
        <NuxtLink :to="`/${slug}/journals/create`" class="btn btn-primary">
          + Buat Jurnal Baru
        </NuxtLink>
      </div>

      <!-- Table -->
      <table v-else class="w-full">
        <thead
          class="bg-neutral-50 text-xs font-bold text-neutral-500 uppercase tracking-wider text-left"
        >
          <tr>
            <th class="px-6 py-3">No. Jurnal</th>
            <th class="px-6 py-3">Tanggal</th>
            <th class="px-6 py-3">Deskripsi</th>
            <th class="px-6 py-3 text-right">Total</th>
            <th class="px-6 py-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100">
          <tr
            v-for="journal in journalStore.journals"
            :key="journal.id"
            class="hover:bg-primary-50/30 transition-colors"
          >
            <td class="px-6 py-4 font-mono text-sm text-primary-700 font-medium">
              {{ journal.journalNumber }}
            </td>
            <td class="px-6 py-4 text-sm text-neutral-600">
              {{ formatDate(journal.date) }}
            </td>
            <td class="px-6 py-4 text-sm text-neutral-800">
              {{ journal.description }}
            </td>
            <td class="px-6 py-4 text-sm text-neutral-800 text-right font-mono">
              {{ formatCurrency(journal.totalDebit) }}
            </td>
            <NuxtLink
              :to="`/${slug}/journals/${journal.id}`"
              class="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block flex justify-center items-center"
              title="Lihat Detail"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </NuxtLink>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <Pagination
        v-if="!journalStore.loading && journalStore.journals.length > 0"
        :current-page="journalStore.pagination.page"
        :last-page="journalStore.pagination.lastPage"
        :total="journalStore.pagination.total"
        :limit="journalStore.pagination.limit"
        @change-page="changePage"
        @change-limit="changeLimit"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { useJournalStore } from '~/stores/journal'
  import { useDebounceFn } from '@vueuse/core'
  import Pagination from '~/components/common/Pagination.vue'

  const route = useRoute()
  const journalStore = useJournalStore()
  const slug = route.params.companySlug as string

  const searchQuery = ref('')
  const startDate = ref('')
  const endDate = ref('')

  const fetchJournals = (page = 1, limit = journalStore.pagination.limit) => {
    journalStore.fetchJournals(slug, {
      page,
      limit,
      search: searchQuery.value,
      startDate: startDate.value,
      endDate: endDate.value,
    })
  }

  // Watchers
  const debouncedFetch = useDebounceFn(() => {
    fetchJournals(1, journalStore.pagination.limit)
  }, 500)

  watch(searchQuery, debouncedFetch)
  watch(startDate, debouncedFetch)
  watch(endDate, debouncedFetch)

  const changePage = (page: number) => {
    fetchJournals(page, journalStore.pagination.limit)
  }

  const changeLimit = (limit: number) => {
    fetchJournals(1, limit)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
  }

  onMounted(() => {
    if (slug) {
      fetchJournals()
    }
  })

  definePageMeta({
    middleware: 'auth',
  })
</script>
