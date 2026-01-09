<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Payments</h1>
      <button 
        @click="showCreateModal = true"
        class="btn btn-primary flex items-center gap-2"
      >
        <PlusIcon class="h-5 w-5" />
        New Transfer
      </button>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="w-full sm:w-72">
            <SearchInput
                v-model="search"
                placeholder="Search payment number..."
                @search="handleSearch"
            />
        </div>
    </div>

    <!-- Payment List -->
    <div v-if="loading" class="text-center py-12">
        <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
    </div>
    
    <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>

                <tbody v-if="payments?.length > 0" class="divide-y divide-slate-100">
                    <tr v-for="item in payments" :key="item.id" class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 text-sm text-slate-500">
                            {{ new Date(item.date).toLocaleDateString('id-ID') }}
                        </td>
                        <td class="px-6 py-4 text-sm font-medium text-slate-900">{{ item.paymentNumber }}</td>
                        <td class="px-6 py-4 text-sm">
                             <span class="px-2 py-1 rounded-full text-xs font-medium"
                            :class="{
                                'bg-green-100 text-green-700': item.type === 'RECEIPT',
                                'bg-amber-100 text-amber-700': item.type === 'PAYMENT',
                                'bg-purple-100 text-purple-700': item.type === 'TRANSFER',
                            }">
                                {{ item.type }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-500">
                            {{ item.reference || '-' }}
                        </td>
                        <td class="px-6 py-4 text-sm text-right font-mono font-medium" 
                            :class="item.type === 'RECEIPT' ? 'text-green-600' : 'text-slate-900'">
                            {{ item.type !== 'RECEIPT' ? '-' : '+' }} {{ new Intl.NumberFormat('id-ID').format(item.amount) }}
                        </td>
                        <td class="px-6 py-4 text-sm text-right space-x-2">
                             <button @click="handleEdit(item)" class="text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                                 <PencilSquareIcon class="w-4 h-4" />
                            </button>
                            <button @click="handleDelete(item.id)" class="text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                <TrashIcon class="h-4 w-4" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="payments?.length === 0 && !loading">
            <EmptyState
                title="No Transactions"
                description="Record payments or receipts to track your cash flow."
                icon="💳"
                action-label="New Transfer"
                @action="showCreateModal = true"
            />
        </div>

        <PaginationControl
            v-if="payments?.length > 0"
            :current-page="page"
            :limit="limit"
            :total="total"
            @page-change="changePage"
        />

    </div>

    <!-- Create Modal (Simplified) -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeModal()"></div>
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 p-6">
            <h3 class="text-lg font-bold text-slate-900 mb-4">{{ editingId ? 'Edit Payment' : 'Record Payment' }}</h3>
            <form @submit.prevent="submit" class="space-y-4">
                <div>
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Type</label>
                     <select v-model="form.type" class="input py-2">
                         <option value="RECEIPT">Receipt (Money In)</option>
                         <option value="PAYMENT">Payment (Money Out)</option>
                     </select>
                </div>
                
                 <div>
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Date</label>
                     <input v-model="form.date" type="date" required class="input py-2">
                </div>



                 <div>
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Payment Number</label>
                     <input v-model="form.paymentNumber" type="text" required class="input py-2">
                </div>

                <!-- Allocation Mode -->
                <div>
                    <label class="block text-xs font-semibold text-neutral-500 uppercase mb-2">Allocation Mode</label>
                    <div class="flex flex-wrap gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="form.allocationMode" value="DIRECT" class="text-primary-600 focus:ring-primary-500">
                            <span class="text-sm text-slate-700">Direct Allocation</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="form.allocationMode" value="INVOICE" class="text-primary-600 focus:ring-primary-500">
                            <span class="text-sm text-slate-700">Link to Invoice</span>
                        </label>
                         <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="form.allocationMode" value="BILL" class="text-primary-600 focus:ring-primary-500">
                            <span class="text-sm text-slate-700">Link to Bill</span>
                        </label>
                    </div>
                </div>

                <!-- DIRECT: Contra Account -->
                <div v-if="form.allocationMode === 'DIRECT'">
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">
                        {{ form.type === 'RECEIPT' ? 'Revenue/Income Account' : 'Expense/Cost Account' }}
                     </label>
                     <select v-model="form.contraAccountId" required class="input py-2">
                          <option value="" disabled>Select Contra Account</option>
                          <option v-for="acc in contraAccounts" :key="acc.id" :value="acc.id">{{ acc.code }} - {{ acc.name }}</option>
                     </select>
                </div>

                <!-- LINKED: Reference ID (Invoice) -->
                <div v-if="form.allocationMode === 'INVOICE'">
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Select Invoice</label>
                     <select v-model="form.referenceId" required class="input py-2">
                          <option :value="undefined" disabled>Select Invoice</option>
                          <option v-for="inv in unpaidInvoices" :key="inv.id" :value="inv.id">
                              {{ inv.invoiceNumber }} - {{ inv.customer?.name }} ({{ new Intl.NumberFormat('id-ID').format(inv.total) }})
                          </option>
                     </select>
                </div>

                <!-- LINKED: Reference ID (Bill) -->
                <div v-if="form.allocationMode === 'BILL'">
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Select Bill</label>
                     <select v-model="form.referenceId" required class="input py-2">
                          <option :value="undefined" disabled>Select Bill</option>
                          <option v-for="bill in unpaidBills" :key="bill.id" :value="bill.id">
                              {{ bill.billNumber }} - {{ bill.vendor?.name }} ({{ new Intl.NumberFormat('id-ID').format(bill.total) }})
                          </option>
                     </select>
                </div>

                 <div>
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Cash/Bank Account</label>
                     <select v-model="form.paymentAccountId" required class="input py-2">
                         <option value="" disabled>Select Account</option>
                         <option v-for="acc in cashBankAccounts" :key="acc.id" :value="acc.id">{{ acc.code }} - {{ acc.name }}</option>
                     </select>
                </div>

                 <div>
                     <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Amount</label>
                     <input v-model.number="form.amount" type="number" min="0" required class="input py-2 text-right font-mono">
                </div>

                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
                    <button type="submit" :disabled="submitting" class="btn btn-primary">
                        <span v-if="submitting" class="animate-spin mr-2">...</span>
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePaymentStore, useAccountStore, useSalesStore, usePurchaseStore } from '@/stores'
import EmptyState from '@/components/common/EmptyState.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import PaginationControl from '@/components/common/PaginationControl.vue'
import { PlusIcon, PencilIcon, TrashIcon, PencilSquareIcon } from '@heroicons/vue/20/solid'

definePageMeta({
  layout: 'dashboard'
})

const paymentStore = usePaymentStore()
const accountStore = useAccountStore()
const purchaseStore = usePurchaseStore()
const salesStore = useSalesStore()
const route = useRoute()
const payments = computed(() => paymentStore.payments)
const loading = computed(() => paymentStore.loading)
const showCreateModal = ref(false)

const closeModal = () => {
    showCreateModal.value = false
    resetForm()
}


const submitting = ref(false)
const editingId = ref<string | null>(null)

const extraInvoices = ref<any[]>([])
const extraBills = ref<any[]>([])

const unpaidInvoices = computed(() => {
    // Merge store invoices with extra (paid) invoices needed for edit
    // unique by ID
    const all = [...salesStore.invoices, ...extraInvoices.value]
    return Array.from(new Map(all.map(item => [item.id, item])).values())
})

const unpaidBills = computed(() => {
    const all = [...purchaseStore.bills, ...extraBills.value]
    return Array.from(new Map(all.map(item => [item.id, item])).values())
})

const form = reactive({
    type: 'RECEIPT',
    date: new Date().toISOString().split('T')[0],
    paymentNumber: '',
    paymentAccountId: '',
    amount: 0,
    referenceId: undefined as string | undefined, // This will be the selected Invoice/Bill ID
    contraAccountId: '',
    allocationMode: 'DIRECT' as 'DIRECT' | 'INVOICE' | 'BILL'
})

// Auto-fill amount when Invoice/Bill is selected
watch(() => form.referenceId, (newId) => {
    if (!newId) return

    if (form.allocationMode === 'INVOICE') {
        const inv = unpaidInvoices.value.find(i => i.id === newId)
        if (inv) form.amount = Number(inv.total)
    } else if (form.allocationMode === 'BILL') {
        const bill = unpaidBills.value.find(b => b.id === newId)
        if (bill) form.amount = Number(bill.total)
    }
})

// Clear reference/contra when mode changes
watch(() => form.allocationMode, () => {
    form.referenceId = undefined
    form.contraAccountId = ''
    form.amount = 0 
})

// Filter accounts to show only ASSET type (Cash/Bank accounts)
const cashBankAccounts = computed(() => {
    return accountStore.accountsFlat.filter(a => a.type === 'ASSET')
})

// Filter accounts for Contra Account (Revenue/Expense/Liability/Equity)
const contraAccounts = computed(() => {
    return accountStore.accountsFlat.filter(a => 
        ['REVENUE', 'EXPENSE', 'LIABILITY', 'EQUITY', 'ASSET'].includes(a.type)
    )
})

// Pagination & Search State
const page = ref(1)
const limit = ref(50)
const search = ref('')
const total = ref(0) 

const fetchData = async () => {
    const data = await paymentStore.fetchPayments({
        limit: limit.value,
        offset: (page.value - 1) * limit.value,
        search: search.value
    })
    if (data) {
        total.value = data.total
    }
}

const handleSearch = (val: string) => {
    search.value = val
    page.value = 1
    fetchData()
}

const changePage = (newPage: number) => {
    page.value = newPage
    fetchData()
}

onMounted(() => {
    fetchData()
    accountStore.fetchAccounts(route.params.companySlug as string, { limit: 100 }) // Fetch all accounts for dropdown
    salesStore.fetchUnpaidInvoices()
    purchaseStore.fetchUnpaidBills()
})

const resetForm = () => {
    form.paymentNumber = ''
    form.paymentAccountId = ''
    form.amount = 0
    form.referenceId = undefined
    form.contraAccountId = ''
    form.allocationMode = 'DIRECT'
    editingId.value = null
}

const handleEdit = async (item: any) => {
    editingId.value = item.id
    form.type = item.type
    form.date = new Date(item.date).toISOString().split('T')[0]
    form.paymentNumber = item.paymentNumber
    
    // Extract Payment Account from Journal Lines
    // For Receipt: Debit = Bank (Account ID)
    // For Payment: Credit = Bank (Account ID)
    if (item.journal?.lines) {
        const bankLine = item.journal.lines.find((l: any) => 
            (item.type === 'RECEIPT' && Number(l.debit) > 0 && Number(l.credit) === 0) ||
            (item.type === 'PAYMENT' && Number(l.credit) > 0 && Number(l.debit) === 0)
        );
         // Note: This logic assumes simple 2-line journal for now. 
         // If Cross-Linking (Receipt -> AP), the Bank is Debit. Correct.
         // If Payment -> AR, Bank is Credit. Correct.
        if (bankLine) {
            form.paymentAccountId = bankLine.accountId
        }
    } else {
         form.paymentAccountId = ''
    }

    form.amount = Number(item.amount)
    form.notes = item.notes
    
    // Determine mode & Inject Missing Data
    if (item.salesInvoiceId) {
        form.allocationMode = 'INVOICE'
        if (item.salesInvoice) {
             extraInvoices.value.push(item.salesInvoice)
        }
    } else if (item.purchaseBillId) {
        form.allocationMode = 'BILL'
        if (item.purchaseBill) {
             extraBills.value.push(item.purchaseBill)
        }
    } else {
        form.allocationMode = 'DIRECT'
        // Extract Contra Account
         if (item.journal?.lines) {
            const contraLine = item.journal.lines.find((l: any) => l.accountId !== form.paymentAccountId);
            if (contraLine) form.contraAccountId = contraLine.accountId;
        }
    }

    // Set Reference / Amount AFTER mode is set, using nextTick to avoid watcher clear
    await nextTick()
    
    if (item.salesInvoiceId) {
        form.referenceId = item.salesInvoiceId
        // Force amount again in case watcher cleared it
        form.amount = Number(item.amount) 
    } else if (item.purchaseBillId) {
        form.referenceId = item.purchaseBillId
        form.amount = Number(item.amount)
    } else {
        // Direct
         if (item.journal?.lines) {
            const contraLine = item.journal.lines.find((l: any) => l.accountId !== form.paymentAccountId);
            if (contraLine) form.contraAccountId = contraLine.accountId;
        }
        form.amount = Number(item.amount)
    }
    
    showCreateModal.value = true
}

const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment? This will reverse the journal entry.')) return
    try {
        await paymentStore.deletePayment(id)
        alert('Payment deleted successfully')
    } catch (err: any) {
        alert(err.message || 'Failed to delete payment')
    }
}

const submit = async () => {
    if(submitting.value) return 
    submitting.value = true
    try {
        const payload: any = {
            type: form.type,
            date: new Date(form.date),
            paymentNumber: form.paymentNumber,
            paymentAccountId: form.paymentAccountId,
            amount: form.amount
        }
        
        if (form.allocationMode === 'INVOICE' && form.referenceId) {
            payload.salesInvoiceId = form.referenceId
        } else if (form.allocationMode === 'BILL' && form.referenceId) {
            payload.purchaseBillId = form.referenceId
        } else if (form.allocationMode === 'DIRECT' && form.contraAccountId) {
            payload.contraAccountId = form.contraAccountId
        }

        if (editingId.value) {
             await paymentStore.updatePayment(editingId.value, payload)
        } else {
             await paymentStore.createPayment(payload)
        }
        
        showCreateModal.value = false
        resetForm()
        fetchData()
    } catch (err: any) {
        alert(err.message || 'Failed to save payment')
    } finally {
        submitting.value = false
    }
}
</script>
