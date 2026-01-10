<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">New Invoice</h1>
      <button @click="router.back()" class="text-slate-500 hover:text-slate-700">Cancel</button>
    </div>

    <div class="glass-card p-6">
      <form @submit.prevent="submit" class="space-y-6">
        <!-- Header Info -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label class="text-xs font-semibold text-neutral-500 uppercase mb-1">Customer</label>
            <select v-model="form.customerId" required class="input py-2">
              <option value="" disabled>Select Customer</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-neutral-500 uppercase mb-1"
              >Invoice Number</label
            >
            <input
              v-model="form.invoiceNumber"
              type="text"
              required
              class="input py-2"
              placeholder="INV-2026-001"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-neutral-500 uppercase mb-1">Date</label>
            <input v-model="form.date" type="date" required class="input py-2" />
          </div>
          <div>
            <label class="text-xs font-semibold text-neutral-500 uppercase mb-1">Due Date</label>
            <input v-model="form.dueDate" type="date" class="input py-2" />
          </div>
        </div>

        <!-- Line Items -->
        <div class="glass-card overflow-hidden border border-neutral-100">
          <div
            class="p-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between"
          >
            <h3 class="font-bold text-neutral-700">Items</h3>
            <button
              type="button"
              @click="addLine"
              class="text-sm text-primary-600 font-medium hover:underline"
            >
              + Add Item
            </button>
          </div>

          <div class="p-4 space-y-4">
            <div v-for="(line, index) in form.lines" :key="index" class="flex gap-4 items-start">
              <div class="flex-1">
                <label class="block text-xs font-medium text-slate-500 mb-1">Product</label>
                <select
                  v-model="line.productId"
                  @change="onProductChange(line)"
                  required
                  class="input py-1.5 text-sm"
                >
                  <option value="" disabled>Select Product</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="flex-[2]">
                <label class="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input
                  v-model="line.description"
                  type="text"
                  class="input py-1.5 text-sm"
                  placeholder="Description"
                />
              </div>
              <div class="w-24">
                <label class="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                <input
                  v-model.number="line.quantity"
                  type="number"
                  min="1"
                  required
                  class="input py-1.5 text-sm text-right"
                />
              </div>
              <div class="w-32">
                <label class="block text-xs font-medium text-slate-500 mb-1">Price</label>
                <input
                  v-model.number="line.unitPrice"
                  type="number"
                  min="0"
                  required
                  class="input py-1.5 text-sm text-right"
                />
              </div>
              <div class="w-32 pt-6 text-right font-medium text-slate-900 font-mono">
                {{ new Intl.NumberFormat('id-ID').format(line.quantity * line.unitPrice) }}
              </div>
              <div class="pt-6">
                <button
                  type="button"
                  @click="removeLine(index)"
                  class="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <span class="i-heroicons-trash-20-solid w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="flex justify-end pt-4">
          <div class="w-72 bg-neutral-50 p-4 rounded-xl space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-neutral-500">Subtotal</span>
              <span class="font-medium text-neutral-900">{{
                new Intl.NumberFormat('id-ID').format(subtotal)
              }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold">
              <span class="text-neutral-800">Total</span>
              <span class="text-primary-600">{{
                new Intl.NumberFormat('id-ID').format(total)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <button type="button" @click="router.back()" class="btn btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading" class="btn btn-primary min-w-[120px]">
            <span v-if="loading" class="animate-spin mr-2">...</span>
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useContactStore, useProductStore, useSalesStore } from '@/stores' // Assuming barrel export or individual imports

  definePageMeta({
    layout: 'dashboard',
  })

  const contactStore = useContactStore()
  const productStore = useProductStore()
  const salesStore = useSalesStore()
  const router = useRouter()
  const route = useRoute()

  const customers = computed(() => contactStore.customers)
  const products = computed(() => productStore.products)
  const loading = computed(() => salesStore.loading)
  const toast = useToast()

  const form = reactive({
    customerId: '',
    invoiceNumber: '', // Ideally auto-generated or fetched
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    lines: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }],
  })

  const subtotal = computed(() => {
    return form.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  })

  const total = computed(() => subtotal.value) // Add tax logic later

  onMounted(() => {
    contactStore.fetchCustomers()
    productStore.fetchProducts()
  })

  const addLine = () => {
    form.lines.push({ productId: '', description: '', quantity: 1, unitPrice: 0 })
  }

  const removeLine = (index: number) => {
    if (form.lines.length > 1) {
      form.lines.splice(index, 1)
    }
  }

  const onProductChange = (line: any) => {
    const product = products.value.find((p) => p.id === line.productId)
    if (product) {
      line.description = product.name
      line.unitPrice = product.price
    }
  }

  const submit = async () => {
    try {
      await salesStore.createInvoice({
        ...form,
        date: new Date(form.date), // Ensure date object
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      })
      toast.success('Berhasil', 'Invoice berhasil dibuat')
      router.push(`/${route.params.companySlug}/sales`)
    } catch (err: any) {
      toast.apiError(err, 'Gagal Membuat Invoice')
    }
  }
</script>
