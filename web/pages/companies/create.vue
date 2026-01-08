<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Blobs -->
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-200/20 rounded-full blur-3xl animate-float -z-10"></div>
    <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-200/20 rounded-full blur-3xl animate-float -z-10" style="animation-delay: 2s"></div>

    <div class="w-full max-w-lg">
      <NuxtLink to="/companies" class="inline-flex items-center text-neutral-500 hover:text-neutral-800 mb-6 transition-colors">
        <svg class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Daftar
      </NuxtLink>

      <div class="glass-card p-8 animate-scale-in">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-soft">
            <span class="text-3xl">🚀</span>
          </div>
          <h1 class="text-2xl font-bold text-neutral-800">Buat Perusahaan Baru</h1>
          <p class="text-neutral-600 mt-2">Mulai sistem pencatatan keuangan baru</p>
        </div>

        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-down">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Nama Perusahaan</label>
            <input 
              v-model="form.name"
              type="text" 
              class="input" 
              placeholder="Contoh: PT Maju Jaya Sentosa"
              required
              @input="generateSlug"
              :disabled="loading"
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              URL Slug
              <span class="text-neutral-400 font-normal ml-2">(Otomatis generated)</span>
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-neutral-400">journal.com/</span>
              <input 
                v-model="form.slug"
                type="text" 
                class="input pl-28" 
                placeholder="pt-maju-jaya"
                required
                :disabled="loading"
              />
            </div>
            <p class="text-xs text-neutral-500 mt-1">Slug digunakan untuk URL unik perusahaan Anda.</p>
          </div>

          <!-- Plan -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Pilih Paket</label>
            <div class="grid grid-cols-2 gap-4">
              <div 
                class="border rounded-xl p-4 cursor-pointer transition-all duration-200 relative overflow-hidden"
                :class="form.plan === 'FREE' ? 'border-primary-500 bg-primary-50 shadow-soft' : 'border-neutral-200 hover:border-primary-300 bg-white'"
                @click="form.plan = 'FREE'"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-bold text-neutral-800">Starter</span>
                  <span v-if="form.plan === 'FREE'" class="text-primary-600">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  </span>
                </div>
                <p class="text-sm text-neutral-500">Gratis selamanya fitus dasar.</p>
              </div>

              <div 
                class="border rounded-xl p-4 cursor-pointer transition-all duration-200 relative overflow-hidden"
                :class="form.plan === 'BUSINESS' ? 'border-accent-500 bg-accent-50 shadow-soft' : 'border-neutral-200 hover:border-accent-300 bg-white'"
                @click="form.plan = 'BUSINESS'"
              >
                <div class="absolute top-0 right-0 bg-accent-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">POPULAR</div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-bold text-neutral-800">Business</span>
                  <span v-if="form.plan === 'BUSINESS'" class="text-accent-600">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  </span>
                </div>
                <p class="text-sm text-neutral-500">Fitur lengkap untuk bisnis berkembang.</p>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full py-3" :disabled="loading">
            <span v-if="!loading">Buat Perusahaan & Mulai</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sedang memproses...
            </span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const companyStore = useCompanyStore()
const router = useRouter()

const form = ref({
  name: '',
  slug: '',
  plan: 'FREE'
})

const error = ref('')
const loading = computed(() => companyStore.loading)

const generateSlug = () => {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const handleSubmit = async () => {
  error.value = ''
  try {
    const newCompany = await companyStore.createCompany(form.value)
    // Redirect to dashboard new company
    if (newCompany && newCompany.slug) {
      router.push(`/${newCompany.slug}/dashboard`)
    } else {
      router.push('/companies')
    }
  } catch (e: any) {
    error.value = e.message || 'Gagal membuat perusahaan. Silakan coba lagi.'
  }
}
</script>
