<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeModal"></div>
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-slate-900">{{ initialData ? 'Edit' : 'New' }} Product</h3>
        <button @click="closeModal" class="text-slate-400 hover:text-slate-500 transition-colors">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1"
            >Name <span class="text-red-500">*</span></label
          >
          <input
            v-model="form.name"
            type="text"
            required
            class="input py-2"
            placeholder="e.g. Consulting Service"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Code</label>
            <input v-model="form.code" type="text" class="input py-2" placeholder="e.g. SRV-001" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Type</label>
            <select v-model="form.type" class="input py-2">
              <option value="GOODS">Goods</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1"
            >Price (IDR)</label
          >
          <input
            v-model.number="form.price"
            type="number"
            min="0"
            class="input py-2 text-right font-mono"
            placeholder="0"
          />
        </div>

        <div class="pt-4 border-t border-slate-100">
          <h4 class="text-sm font-semibold text-slate-900 mb-3">Account Mapping</h4>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1"
                >Sales Account (Revenue)</label
              >
              <select v-model="form.salesAccountId" class="input py-1.5 text-sm">
                <option value="">Select Account...</option>
                <option v-for="acc in revenueAccounts" :key="acc.id" :value="acc.id">
                  {{ acc.code }} - {{ acc.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1"
                >Purchase Account (Expense)</label
              >
              <select v-model="form.purchaseAccountId" class="input py-1.5 text-sm">
                <option value="">Select Account...</option>
                <option v-for="acc in expenseAccounts" :key="acc.id" :value="acc.id">
                  {{ acc.code }} - {{ acc.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button type="submit" :disabled="submitting" class="btn btn-primary min-w-[100px]">
            <span v-if="submitting" class="animate-spin mr-2">...</span>
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { XMarkIcon } from '@heroicons/vue/20/solid'

  const props = defineProps<{
    show: boolean
    initialData?: any
  }>()

  const emit = defineEmits(['close', 'success'])

  const productStore = useProductStore()
  const accountStore = useAccountStore()
  const route = useRoute()

  const submitting = ref(false)
  const accounts = ref<any[]>([])

  const revenueAccounts = computed(() => accounts.value.filter((a) => a.type === 'REVENUE'))
  const expenseAccounts = computed(() => accounts.value.filter((a) => a.type === 'EXPENSE'))

  const form = reactive({
    name: '',
    code: '',
    type: 'SERVICE',
    price: 0,
    salesAccountId: '',
    purchaseAccountId: '',
  })

  const resetForm = () => {
    form.name = ''
    form.code = ''
    form.type = 'SERVICE'
    form.price = 0
    form.salesAccountId = ''
    form.purchaseAccountId = ''
  }

  // Watch for initialData changes to populate form
  watch(
    () => props.initialData,
    (val) => {
      if (val) {
        form.name = val.name || ''
        form.code = val.code || ''
        form.type = val.type || 'SERVICE'
        form.price = Number(val.price) || 0
        form.salesAccountId = val.salesAccountId || ''
        form.purchaseAccountId = val.purchaseAccountId || ''
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  onMounted(async () => {
    // Fetch accounts for dropdowns
    const res = await accountStore.fetchAccounts(route.params.companySlug as string, { limit: 100 })
    if (res.data) {
      accounts.value = res.data
    } else if (Array.isArray(res)) {
      accounts.value = res
    }
  })

  const toast = useToast()

  const submit = async () => {
    submitting.value = true
    try {
      const payload = {
        ...form,
        // Clean up empty strings
        salesAccountId: form.salesAccountId || undefined,
        purchaseAccountId: form.purchaseAccountId || undefined,
      }

      if (props.initialData?.id) {
        await productStore.updateProduct(props.initialData.id, payload)
        toast.success('Berhasil', 'Produk berhasil diupdate')
      } else {
        await productStore.createProduct(payload)
        toast.success('Berhasil', 'Produk berhasil dibuat')
      }

      emit('success')
      emit('close')
    } catch (err: any) {
      toast.apiError(err, 'Gagal Menyimpan Produk')
    } finally {
      submitting.value = false
    }
  }

  const closeModal = () => {
    emit('close')
    resetForm()
  }
</script>
