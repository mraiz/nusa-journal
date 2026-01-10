<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <span class="text-3xl">🗂️</span> Chart of Accounts
        </h1>
        <p class="text-neutral-500 mt-1">Kelola akun dan struktur laporan keuangan Anda</p>
      </div>
      <div class="flex gap-2">
        <button
          class="btn btn-secondary flex items-center gap-2"
          @click="handleExport"
          :disabled="exportLoading"
        >
          <span class="text-lg">📊</span> {{ exportLoading ? 'Exporting...' : 'Export Excel' }}
        </button>
        <button class="btn btn-primary flex items-center gap-2" @click="openCreateModal">
          <span class="text-lg">➕</span> Akun Baru
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="glass-card overflow-hidden">
      <!-- Toolbar -->
      <div
        class="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50"
      >
        <div class="relative w-64">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari akun..."
            class="input pl-10 py-2 text-sm"
          />
          <span class="absolute left-3 top-2.5 text-neutral-400">🔍</span>
        </div>
      </div>

      <!-- Table Header -->
      <div
        class="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50/80 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider"
      >
        <div class="col-span-4">Nama Akun</div>
        <div class="col-span-2">Kode</div>
        <div class="col-span-2">Kategori</div>
        <div class="col-span-2 text-center">Tipe</div>
        <div class="col-span-2 text-right">Aksi</div>
      </div>

      <!-- Loading State -->
      <div v-if="accountStore.loading" class="p-12 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="accountsList.length === 0" class="p-12 text-center">
        <div
          class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-3xl">🗂️</span>
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Belum ada akun</h3>
        <p class="text-neutral-500 mb-6 max-w-sm mx-auto">
          {{
            searchQuery
              ? 'Tidak ditemukan akun dengan kata kunci tersebut.'
              : 'Mulai atur struktur keuangan perusahaan Anda dengan membuat akun pertama.'
          }}
        </p>
        <button v-if="!searchQuery" @click="openCreateModal" class="btn btn-primary">
          + Buat Akun Baru
        </button>
      </div>

      <!-- Account Rows -->
      <div v-else class="divide-y divide-neutral-100">
        <div
          v-for="account in accountsList"
          :key="account.id"
          class="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-neutral-50 transition-colors group cursor-default"
        >
          <!-- Name -->
          <div class="col-span-4 flex items-center">
            <span class="mr-2 text-neutral-400">📄</span>
            <span class="font-medium text-neutral-800">
              {{ account.name }}
            </span>
            <span
              v-if="account.parentId"
              class="ml-2 text-xs text-neutral-400 bg-neutral-100 px-1 rounded"
            >
              Sub
            </span>
          </div>

          <!-- Code -->
          <div
            class="col-span-2 font-mono text-sm text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded w-fit"
          >
            {{ account.code }}
          </div>

          <!-- Classification -->
          <div class="col-span-2 text-sm text-neutral-600 capitalize truncate">
            {{ formatEnum(account.type) }}
          </div>

          <!-- Type (Header/Posting) -->
          <div class="col-span-2 text-center">
            <span
              v-if="account.isPosting"
              class="badge bg-green-100 text-green-700 border-green-200"
              >Posting</span
            >
            <span v-else class="badge bg-neutral-100 text-neutral-600 border-neutral-200"
              >Header</span
            >
          </div>

          <!-- Actions -->
          <div class="col-span-2 flex justify-end gap-2 opacity-100 transition-opacity">
            <button
              class="p-1.5 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
              title="Tambah Sub-akun"
              @click="addChild(account)"
            >
              ➕
            </button>
            <button
              class="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg transition-colors"
              title="Edit"
              @click="editAccount(account)"
            >
              ✏️
            </button>
            <button
              class="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
              title="Hapus"
              @click="deleteAccount(account)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="!accountStore.loading && accountsList.length > 0"
        :current-page="accountStore.pagination.page"
        :last-page="accountStore.pagination.lastPage"
        :total="accountStore.pagination.total"
        :limit="accountStore.pagination.limit"
        @change-page="changePage"
        @change-limit="changeLimit"
      />
    </div>

    <!-- Modal Form -->
    <AccountFormModal
      :is-open="modalOpen"
      :is-edit="isEdit"
      :parent-account="activeParent"
      :initial-data="activeAccount"
      :loading="accountStore.loading"
      @close="closeModal"
      @save="handleSave"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { useAccountStore, type Account } from '~/stores/account'
  // Use dynamic import for component if needed, or rely on Nuxt auto-import components/
  import AccountFormModal from '~/components/coa/AccountFormModal.vue'
  import Pagination from '~/components/common/Pagination.vue'
  import { useDebounceFn } from '@vueuse/core'

  import * as XLSX from 'xlsx'

  const route = useRoute()
  const accountStore = useAccountStore()
  const slug = route.params.companySlug as string

  // Local State
  const modalOpen = ref(false)
  const isEdit = ref(false)
  const activeParent = ref<Account | null>(null)
  const activeAccount = ref<Account | null>(null)
  const searchQuery = ref('')
  const exportLoading = ref(false)

  const accountsList = computed(() => accountStore.accountsFlat)

  const toast = useToast()

  // Export Actions
  const handleExport = async () => {
    exportLoading.value = true
    try {
      // 1. Fetch ALL accounts
      const res = await accountStore.fetchAccounts(slug, { limit: 5000 })
      const allAccounts = res.data || res

      if (!allAccounts || allAccounts.length === 0) {
        toast.warning('Tidak Ada Data', 'Tidak ada data untuk diexport.')
        return
      }

      // 2. Map Data
      const data = allAccounts.map((acc: Account) => ({
        Nama: acc.name,
        Kode: acc.code,
        'Tipe Akun': acc.type ? formatEnum(acc.type) : '-',
        Klasifikasi: acc.classification ? formatEnum(acc.classification) : '-',
        Deskripsi: acc.description || '-',
        Status: acc.isPosting ? 'Diposting' : 'Header',
      }))

      // 3. Create Workbook
      const ws = XLSX.utils.json_to_sheet(data)

      // Auto-width columns
      const colWidths = [
        { wch: 40 }, // Nama
        { wch: 15 }, // Kode
        { wch: 20 }, // Tipe
        { wch: 25 }, // Klasifikasi
        { wch: 40 }, // Deskripsi
        { wch: 15 }, // Status
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Akun')

      // 4. Download
      XLSX.writeFile(wb, `CoA_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e) {
      console.error(e)
      toast.error('Gagal Export', 'Terjadi kesalahan saat export data.')
    } finally {
      exportLoading.value = false
    }
  }

  const fetchAccounts = (page = 1, limit = 10) => {
    accountStore.fetchAccounts(slug, {
      page,
      limit,
      search: searchQuery.value,
    })
  }

  watch(
    searchQuery,
    useDebounceFn(() => {
      fetchAccounts(1, accountStore.pagination.limit)
    }, 500)
  )

  const changePage = (page: number) => {
    fetchAccounts(page, accountStore.pagination.limit)
  }

  const changeLimit = (limit: number) => {
    fetchAccounts(1, limit)
  }

  const formatEnum = (str: string) => {
    if (!str) return ''
    return str.replace(/_/g, ' ').toLowerCase()
  }

  onMounted(() => {
    if (slug) {
      fetchAccounts()
    }
  })

  // Actions
  const openCreateModal = () => {
    isEdit.value = false
    activeParent.value = null
    activeAccount.value = null
    modalOpen.value = true
  }

  const addChild = (parent: Account) => {
    isEdit.value = false
    activeParent.value = parent
    activeAccount.value = null
    modalOpen.value = true
  }

  const editAccount = (account: Account) => {
    isEdit.value = true
    activeParent.value = null
    activeAccount.value = account
    modalOpen.value = true
  }

  const closeModal = () => {
    modalOpen.value = false
    activeParent.value = null
    activeAccount.value = null
  }

  const handleSave = async (payload: any) => {
    try {
      if (activeParent.value) {
        payload.parentId = activeParent.value.id
      }

      if (isEdit.value && activeAccount.value) {
        await accountStore.updateAccount(slug, activeAccount.value.id, payload)
      } else {
        await accountStore.createAccount(slug, payload)
      }
      // Refresh list
      fetchAccounts(accountStore.pagination.page, accountStore.pagination.limit)
      closeModal()
      toast.success('Berhasil', isEdit.value ? 'Akun berhasil diperbarui' : 'Akun berhasil dibuat')
    } catch (error: any) {
      toast.apiError(error, 'Gagal Menyimpan Akun')
    }
  }

  const deleteAccount = async (account: Account) => {
    if (confirm(`Hapus akun ${account.name} dan semua sub-akun-nya?`)) {
      try {
        await accountStore.deleteAccount(slug, account.id)
        fetchAccounts(accountStore.pagination.page, accountStore.pagination.limit)
        toast.success('Berhasil', 'Akun berhasil dihapus')
      } catch (error: any) {
        toast.apiError(error, 'Gagal Menghapus Akun')
      }
    }
  }

  definePageMeta({
    middleware: 'auth',
  })
</script>
