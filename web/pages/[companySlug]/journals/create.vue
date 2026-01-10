<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
          <span class="text-3xl">✍️</span> Buat Jurnal Umum
        </h1>
        <p class="text-neutral-500 mt-1">Catat transaksi keuangan manual (General Journal)</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" @click="router.back()">Batal</button>
        <button
          class="btn btn-primary min-w-[120px]"
          @click="saveJournal"
          :disabled="!isValid || journalStore.loading"
        >
          <span v-if="journalStore.loading" class="animate-spin mr-2">⏳</span>
          Simpan
        </button>
      </div>
    </div>

    <!-- Main Form -->
    <div class="space-y-6 animate-slide-up">
      <!-- Top Section -->
      <div class="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Date -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Tanggal Transaksi</label>
          <input type="date" v-model="form.date" class="input py-2" />
        </div>

        <!-- Desc -->
        <div class="col-span-2 space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Deskripsi / Memo</label>
          <input
            type="text"
            v-model="form.description"
            class="input py-2"
            placeholder="Contoh: Penyesuaian stok opname bulan Januari"
          />
        </div>
      </div>

      <!-- Journal Lines -->
      <div class="glass-card overflow-hidden">
        <div
          class="p-4 bg-neutral-50/50 border-b border-neutral-100 flex justify-between items-center"
        >
          <h3 class="font-bold text-neutral-700">Rincian Jurnal</h3>
          <button class="text-sm text-primary-600 hover:underline font-medium" @click="addLine">
            + Tambah Baris
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead
              class="bg-neutral-50 text-xs font-bold text-neutral-500 uppercase tracking-wider text-left"
            >
              <tr>
                <th class="px-4 py-3 w-[35%]">Akun</th>
                <th class="px-4 py-3 w-[25%]">Deskripsi Baris</th>
                <th class="px-4 py-3 w-[15%] text-right">Debit</th>
                <th class="px-4 py-3 w-[15%] text-right">Kredit</th>
                <th class="px-4 py-3 w-[10%] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                v-for="(line, index) in form.lines"
                :key="index"
                class="group hover:bg-neutral-50/50 transition-colors"
              >
                <!-- Account Selector -->
                <td class="px-4 py-2">
                  <select
                    v-model="line.accountId"
                    class="input py-1.5 text-sm"
                    :class="{ 'border-red-300': !line.accountId && attemptedSave }"
                  >
                    <option value="" disabled>Pilih Akun...</option>
                    <optgroup
                      v-for="group in accountOptions"
                      :key="group.label"
                      :label="group.label"
                    >
                      <option v-for="acc in group.options" :key="acc.id" :value="acc.id">
                        {{ acc.code }} - {{ acc.name }}
                      </option>
                    </optgroup>
                  </select>
                </td>

                <!-- Description -->
                <td class="px-4 py-2">
                  <input
                    type="text"
                    v-model="line.description"
                    class="input py-1.5 text-sm"
                    placeholder="Opsional"
                  />
                </td>

                <!-- Debit -->
                <td class="px-4 py-2">
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-neutral-400 text-xs">Rp</span>
                    <input
                      type="number"
                      v-model.number="line.debit"
                      class="input py-1.5 pl-8 text-right text-sm font-mono"
                      @input="line.credit = 0"
                      min="0"
                    />
                  </div>
                </td>

                <!-- Credit -->
                <td class="px-4 py-2">
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-neutral-400 text-xs">Rp</span>
                    <input
                      type="number"
                      v-model.number="line.credit"
                      class="input py-1.5 pl-8 text-right text-sm font-mono"
                      @input="line.debit = 0"
                      min="0"
                    />
                  </div>
                </td>

                <!-- Action -->
                <td class="px-4 py-2 text-center">
                  <button
                    class="text-neutral-400 hover:text-red-500 transition-colors p-1"
                    @click="removeLine(index)"
                    v-if="form.lines.length > 2"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
            <!-- Footer Totals -->
            <tfoot class="bg-neutral-50/80 font-bold text-neutral-700">
              <tr>
                <td colspan="2" class="px-4 py-3 text-right uppercase text-xs tracking-wider">
                  Total
                </td>
                <td
                  class="px-4 py-3 text-right font-mono text-sm"
                  :class="isBalanced ? 'text-green-600' : 'text-neutral-800'"
                >
                  {{ formatCurrency(totalDebit) }}
                </td>
                <td
                  class="px-4 py-3 text-right font-mono text-sm"
                  :class="isBalanced ? 'text-green-600' : 'text-neutral-800'"
                >
                  {{ formatCurrency(totalCredit) }}
                </td>
                <td></td>
              </tr>
              <tr v-if="!isBalanced">
                <td colspan="2" class="px-4 py-2 text-right text-xs text-red-500 font-medium">
                  Selisih (Tidak Balance)
                </td>
                <td
                  colspan="2"
                  class="px-4 py-2 text-center text-red-600 font-mono text-sm bg-red-50"
                >
                  {{ formatCurrency(Math.abs(totalDebit - totalCredit)) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { useAccountStore } from '~/stores/account'
  import { useJournalStore } from '~/stores/journal'

  const router = useRouter()
  const route = useRoute()
  const slug = route.params.companySlug as string

  const accountStore = useAccountStore()
  const journalStore = useJournalStore()

  const toast = useToast()
  const attemptedSave = ref(false)

  const form = reactive({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { accountId: '', description: '', debit: 0, credit: 0 },
      { accountId: '', description: '', debit: 0, credit: 0 },
    ],
  })

  // Validation Computed
  const totalDebit = computed(() => form.lines.reduce((sum, line) => sum + (line.debit || 0), 0))
  const totalCredit = computed(() => form.lines.reduce((sum, line) => sum + (line.credit || 0), 0))
  const isBalanced = computed(() => totalDebit.value === totalCredit.value && totalDebit.value > 0)

  const isValid = computed(() => {
    return (
      isBalanced.value &&
      form.description &&
      form.lines.every((l) => l.accountId && (l.debit > 0 || l.credit > 0))
    )
  })

  // Helpers
  const addLine = () => {
    form.lines.push({ accountId: '', description: '', debit: 0, credit: 0 })
  }

  const removeLine = (index: number) => {
    form.lines.splice(index, 1)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val)
  }

  // Prepare Account Options (Flattened for Select)
  // We need to fetch accounts first
  onMounted(async () => {
    if (slug) {
      // Always fetch fresh accounts to ensure we have latest COA
      // Fetch ALL accounts (high limit) for the dropdown
      await accountStore.fetchAccounts(slug, { limit: 1000 })
    }
  })

  // Group Accounts by Type for easier selection
  const accountOptions = computed(() => {
    // Use accountStore.accountsFlat (flat list from pagination)
    // Ensure we filter only posting accounts (isPosting = true)
    const postingAccounts = accountStore.accountsFlat.filter((a) => a.isPosting)

    const groups: Record<string, any[]> = {}

    postingAccounts.forEach((acc) => {
      if (!groups[acc.type]) {
        groups[acc.type] = []
      }
      groups[acc.type].push(acc)
    })

    // Map to array
    return Object.keys(groups).map((type) => ({
      label: type.replace(/_/g, ' '),
      options: groups[type],
    }))
  })

  // Save Action
  const saveJournal = async () => {
    attemptedSave.value = true
    if (!isValid.value) return

    try {
      const payload = {
        date: new Date(form.date).toISOString(),
        description: form.description,
        lines: form.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description || form.description, // Fallback desc
          debit: l.debit || 0,
          credit: l.credit || 0,
        })),
      }

      await journalStore.createJournal(slug, payload)
      toast.success('Berhasil', 'Jurnal berhasil disimpan')

      // Redirect to list
      router.push(`/${slug}/journals`)
    } catch (error: any) {
      toast.apiError(error, 'Gagal Menyimpan Jurnal')
    }
  }

  definePageMeta({
    middleware: 'auth',
  })
</script>
