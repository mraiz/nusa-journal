<template>
  <div class="max-w-4xl mx-auto" v-if="bill">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button
          @click="router.back()"
          class="bg-white p-2 rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <span class="i-heroicons-arrow-left-20-solid w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Bill {{ bill.billNumber }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium border"
              :class="{
                'bg-gray-50 text-gray-700 border-gray-200': bill.status === 'DRAFT',
                'bg-blue-50 text-blue-700 border-blue-200': bill.status === 'POSTED',
                'bg-green-50 text-green-700 border-green-200': bill.status === 'PAID',
                'bg-red-50 text-red-700 border-red-200': bill.status === 'CANCELLED',
              }"
            >
              {{ bill.status }}
            </span>
            <span class="text-sm text-slate-500">{{
              new Date(bill.date).toLocaleDateString('id-ID', { dateStyle: 'long' })
            }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 print:hidden">
        <NuxtLink
          v-if="bill.status === 'DRAFT'"
          :to="`/${route.params.companySlug}/purchase/edit/${bill.id}`"
          class="btn btn-secondary flex items-center gap-2"
        >
          ✏️ Edit
        </NuxtLink>
        <button
          v-if="bill.status === 'DRAFT'"
          @click="handleApprove"
          :disabled="approving"
          class="btn btn-primary bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-green-200"
        >
          <span v-if="approving" class="animate-spin mr-2">...</span>
          <span v-else class="i-heroicons-check-circle-20-solid mr-1"></span>
          Approve & Post
        </button>
        <button @click="handlePrint" class="btn btn-ghost border border-slate-200 bg-white">
          🖨️ Print
        </button>
      </div>
    </div>

    <!-- Alert for Posted -->
    <div
      v-if="bill.status === 'POSTED' || bill.status === 'PAID'"
      class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start gap-3 print:hidden"
    >
      <span class="i-heroicons-information-circle-20-solid text-blue-500 mt-0.5"></span>
      <div>
        <h4 class="text-sm font-medium text-blue-900">Journal Posted</h4>
        <p class="text-sm text-blue-700 mt-1">
          This bill has been posted to the general ledger.
          <NuxtLink
            :to="`/${route.params.companySlug}/journals/${bill.journalId}`"
            class="underline hover:text-blue-900"
            v-if="bill.journalId"
          >
            View Journal Entry
          </NuxtLink>
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Vendor Info -->
      <div class="p-6 border-b border-slate-100 grid grid-cols-2 gap-8">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
            >Bill From</label
          >
          <div class="font-medium text-slate-900 text-lg">{{ bill.vendor?.name }}</div>
          <div class="text-slate-500 text-sm mt-1 whitespace-pre-line">
            {{ bill.vendor?.address || 'No address' }}
          </div>
          <div class="text-slate-500 text-sm mt-1">{{ bill.vendor?.email }}</div>
        </div>
        <div class="text-right">
          <div class="space-y-1">
            <div class="flex justify-end gap-4 text-sm">
              <span class="text-slate-500">Bill Date:</span>
              <span class="font-medium text-slate-900">{{
                new Date(bill.date).toLocaleDateString('id-ID')
              }}</span>
            </div>
            <div class="flex justify-end gap-4 text-sm">
              <span class="text-slate-500">Due Date:</span>
              <span class="font-medium text-slate-900">{{
                bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('id-ID') : '-'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-100">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/2"
            >
              Product / Description
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Qty
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Unit Cost
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="line in bill.lines" :key="line.id">
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900">{{ line.product?.name }}</div>
              <div class="text-sm text-slate-500">{{ line.description }}</div>
            </td>
            <td class="px-6 py-4 text-right text-sm text-slate-700">{{ line.quantity }}</td>
            <td class="px-6 py-4 text-right text-sm text-slate-700">
              {{ new Intl.NumberFormat('id-ID').format(line.unitPrice) }}
            </td>
            <td class="px-6 py-4 text-right text-sm font-medium text-slate-900">
              {{ new Intl.NumberFormat('id-ID').format(line.amount) }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-slate-50 border-t border-slate-100">
          <tr>
            <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-slate-500">
              Subtotal
            </td>
            <td class="px-6 py-4 text-right text-sm font-bold text-slate-900">
              {{ new Intl.NumberFormat('id-ID').format(bill.subtotal) }}
            </td>
          </tr>
          <tr>
            <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-slate-900 text-lg">
              Total
            </td>
            <td class="px-6 py-4 text-right text-lg font-bold text-primary-600">
              {{ new Intl.NumberFormat('id-ID').format(bill.total) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
  <div v-else class="text-center py-12">
    <div
      class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { PrinterIcon, CheckCircleIcon } from '@heroicons/vue/20/solid'

  definePageMeta({
    layout: 'dashboard',
  })
  const route = useRoute()
  const router = useRouter()
  const purchaseStore = usePurchaseStore()
  const bill = computed(() => purchaseStore.currentBill)
  const approving = ref(false)
  const toast = useToast()

  onMounted(() => {
    purchaseStore.fetchBill(route.params.id as string)
  })

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this bill? This will post journal entries.'))
      return

    approving.value = true
    try {
      await purchaseStore.approveBill(route.params.id as string)
      toast.success('Berhasil', 'Bill berhasil diapprove!')
    } catch (err: any) {
      toast.apiError(err, 'Gagal Approve Bill')
    } finally {
      approving.value = false
    }
  }

  const handlePrint = () => {
    window.print()
  }
</script>
