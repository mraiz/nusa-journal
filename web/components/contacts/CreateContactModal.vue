<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeModal"></div>
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-slate-900">
          {{ initialData ? 'Edit' : 'New' }} {{ type === 'CUSTOMER' ? 'Customer' : 'Vendor' }}
        </h3>
        <button @click="closeModal" class="text-slate-400 hover:text-slate-500 transition-colors">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1"
              >Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="input py-2"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Code</label>
            <input v-model="form.code" type="text" class="input py-2" placeholder="e.g. V-001" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="input py-2"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Phone</label>
            <input v-model="form.phone" type="tel" class="input py-2" placeholder="+62..." />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-500 uppercase mb-1">Address</label>
          <textarea
            v-model="form.address"
            rows="3"
            class="input py-2"
            placeholder="Full address..."
          ></textarea>
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
    type: 'CUSTOMER' | 'VENDOR'
    initialData?: any
  }>()

  const emit = defineEmits(['close', 'success'])

  const contactStore = useContactStore()
  const submitting = ref(false)

  const form = reactive({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
  })

  const resetForm = () => {
    form.name = ''
    form.code = ''
    form.email = ''
    form.phone = ''
    form.address = ''
  }

  // Watch for initialData changes to populate form
  watch(
    () => props.initialData,
    (val) => {
      if (val) {
        form.name = val.name || ''
        form.code = val.code || ''
        form.email = val.email || ''
        form.phone = val.phone || ''
        form.address = val.address || ''
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  // Also watch the show prop - reset form when modal opens without initialData
  watch(
    () => props.show,
    (isOpen) => {
      if (isOpen && !props.initialData) {
        resetForm()
      }
    }
  )

  const generateCode = (name: string, type: 'CUSTOMER' | 'VENDOR') => {
    const prefix = type === 'CUSTOMER' ? 'C' : 'V'
    const cleanName = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 3)
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}-${cleanName}-${random}`
  }

  const toast = useToast()

  const submit = async () => {
    submitting.value = true
    try {
      const payload = {
        ...form,
        code: form.code || generateCode(form.name, props.type),
      }

      const isEdit = !!props.initialData?.id
      const entityName = props.type === 'CUSTOMER' ? 'Customer' : 'Vendor'

      if (props.type === 'CUSTOMER') {
        if (isEdit) {
          await contactStore.updateCustomer(props.initialData.id, payload)
        } else {
          await contactStore.createCustomer(payload)
        }
      } else {
        if (isEdit) {
          await contactStore.updateVendor(props.initialData.id, payload)
        } else {
          await contactStore.createVendor(payload)
        }
      }

      toast.success('Berhasil', `${entityName} berhasil ${isEdit ? 'diupdate' : 'dibuat'}`)
      emit('success')
      emit('close')
      // Reset form done in close/watch
    } catch (err: any) {
      toast.apiError(err, 'Gagal Menyimpan Kontak')
    } finally {
      submitting.value = false
    }
  }

  const closeModal = () => {
    emit('close')
    resetForm()
  }
</script>
