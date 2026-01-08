<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm transition-opacity" @click="close"></div>

    <!-- Modal Panel -->
    <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-black/5 transform transition-all animate-slide-up">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-neutral-800">
          {{ isEdit ? 'Edit Akun' : 'Tambah Akun Baru' }}
        </h3>
        <button @click="close" class="text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        
        <!-- Parent Info (If adding child) -->
        <div v-if="parentAccount && !isEdit" class="p-3 bg-primary-50 rounded-xl border border-primary-100 text-sm flex items-center gap-2">
          <span class="text-xl">📂</span>
          <div>
            <p class="text-primary-800 font-medium">Sub-akun dari: {{ parentAccount.name }}</p>
            <p class="text-primary-600 text-xs">{{ parentAccount.code }}</p>
          </div>
        </div>

        <!-- Account Code & Name -->
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-1 space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Kode</label>
            <input v-model="form.code" type="text" class="input py-2" placeholder="1001" required>
          </div>
          <div class="col-span-2 space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Nama Akun</label>
            <input v-model="form.name" type="text" class="input py-2" placeholder="Kas Kecil" required>
          </div>
        </div>

        <!-- Type Selection -->
        <div>
          <BaseSelect
            v-model="form.type"
            label="Tipe Akun"
            :options="typeOptions"
            :disabled="!!parentAccount"
            placeholder="Pilih Tipe Akun"
          />
          <p v-if="parentAccount" class="text-xs text-neutral-400 mt-1">Mengikuti tipe akun induk</p>
        </div>

        <!-- Classification -->
        <div>
          <BaseSelect
            v-model="form.classification"
            label="Klasifikasi"
            :options="classificationOptions"
            :disabled="!!parentAccount"
            placeholder="Pilih Klasifikasi"
          />
        </div>

        <!-- Descriptions -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Deskripsi (Opsional)</label>
          <textarea v-model="form.description" rows="2" class="input py-2 resize-none"></textarea>
        </div>

        <!-- Options -->
        <div class="flex items-center gap-3 pt-2">
          <label class="flex items-center gap-2 cursor-pointer group">
            <div class="w-5 h-5 rounded border border-neutral-300 flex items-center justify-center transition-colors"
                 :class="form.isPosting ? 'bg-primary-500 border-primary-500' : 'bg-white'">
              <input type="checkbox" v-model="form.isPosting" class="hidden">
              <svg v-if="form.isPosting" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-sm text-neutral-700 font-medium">Akun Posting (Dapat dijurnal)</span>
          </label>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50/50 rounded-b-2xl">
        <button @click="close" class="btn btn-secondary text-sm">Batal</button>
        <button @click="save" class="btn btn-primary text-sm min-w-[100px]" :disabled="loading">
          <span v-if="loading" class="animate-spin mr-2">⏳</span>
          {{ isEdit ? 'Simpan' : 'Buat Akun' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseSelect from '~/components/common/BaseSelect.vue';
import type { Account } from '~/stores/account';

const props = defineProps<{
  isOpen: boolean
  isEdit?: boolean
  parentAccount?: Account | null
  initialData?: Account | null
  loading?: boolean
}>()

const emit = defineEmits(['close', 'save'])

const form = reactive({
  code: '',
  name: '',
  type: 'ASSET',
  classification: 'CURRENT_ASSET',
  description: '',
  isPosting: true
})

// Options for BaseSelect
const typeOptions = [
  { value: 'ASSET', label: 'Harta (Asset)' },
  { value: 'LIABILITY', label: 'Kewajiban (Liability)' },
  { value: 'EQUITY', label: 'Modal (Equity)' },
  { value: 'REVENUE', label: 'Pendapatan (Revenue)' },
  { value: 'EXPENSE', label: 'Beban (Expense)' },
]

// Classifications Grouped by Type
const classifications = {
  ASSET: [
    { value: 'CURRENT_ASSET', label: 'Aset Lancar' },
    { value: 'NON_CURRENT_ASSET', label: 'Aset Tidak Lancar' }
  ],
  LIABILITY: [
    { value: 'CURRENT_LIABILITY', label: 'Kewajiban Lancar' },
    { value: 'LONG_TERM_LIABILITY', label: 'Kewajiban Jangka Panjang' }
  ],
  EQUITY: [
    { value: 'EQUITY', label: 'Ekuitas / Modal' }
  ],
  REVENUE: [
    { value: 'OPERATING_REVENUE', label: 'Pendapatan Operasional' },
    { value: 'NON_OPERATING_REVENUE', label: 'Pendapatan Lain-lain' }
  ],
  EXPENSE: [
    { value: 'OPERATING_EXPENSE', label: 'Beban Operasional' },
    { value: 'NON_OPERATING_EXPENSE', label: 'Beban Lain-lain' },
    { value: 'TAX', label: 'Pajak' }
  ]
}

const classificationOptions = computed(() => {
  return classifications[form.type as keyof typeof classifications] || []
})

// Watchers to init data
watch(() => props.isOpen, (val) => {
  if (val) {
    if (props.isEdit && props.initialData) {
      // Edit Mode
      form.code = props.initialData.code
      form.name = props.initialData.name
      form.type = props.initialData.type
      form.classification = props.initialData.classification
      form.isPosting = props.initialData.isPosting
    } else if (props.parentAccount) {
      // Add Child Mode
      form.code = props.parentAccount.code + '.' // Suggest code
      form.name = ''
      form.type = props.parentAccount.type // Inherit type
      form.classification = props.parentAccount.classification // Inherit class
      form.isPosting = true
    } else {
      // Create Root Mode (Reset)
      form.code = ''
      form.name = ''
      form.type = 'ASSET'
      form.classification = 'CURRENT_ASSET'
      form.isPosting = false // Root usually header
    }
  }
})

// Also watch Type to reset classification if mismatch
watch(() => form.type, (newType) => {
  const validClasses = classifications[newType as keyof typeof classifications]
  if (validClasses && !validClasses.find(c => c.value === form.classification)) {
    form.classification = validClasses[0].value
  }
})

const close = () => {
  emit('close')
}

const save = () => {
  emit('save', { ...form })
}
</script>
