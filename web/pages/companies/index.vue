<template>
  <div class="min-h-screen bg-slate-50 relative overflow-hidden">
    <!-- Background Blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-20 -right-20 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute top-1/2 -left-20 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl animate-float" style="animation-delay: 2s"></div>
    </div>

    <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="flex items-center justify-between mb-10 animate-slide-down">
        <div>
          <h1 class="text-3xl font-bold text-gradient-primary mb-2">Pilih Perusahaan</h1>
          <p class="text-neutral-600">Kelola keuangan bisnis Anda dari sini</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-neutral-200">
            <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-soft">
              {{ userInitials }}
            </div>
            <span class="text-sm font-medium text-neutral-700">{{ user?.name }}</span>
            <button @click="handleLogout" class="ml-2 text-neutral-400 hover:text-red-500 transition-colors" title="Logout">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="glass-card h-48 p-6 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="skeleton h-12 w-12 rounded-xl"></div>
            <div class="skeleton h-6 w-3/4 bg-slate-200 rounded"></div>
            <div class="skeleton h-4 w-1/2 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="companies.length === 0" class="glass-card p-12 text-center animate-scale-in">
        <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-blue">
          <span class="text-4xl">🏢</span>
        </div>
        <h2 class="text-2xl font-bold text-neutral-800 mb-2">Belum ada perusahaan</h2>
        <p class="text-neutral-600 mb-8 max-w-md mx-auto">
          Anda belum terhubung dengan perusahaan manapun. Buat perusahaan baru untuk mulai mencatat keuangan.
        </p>
        <NuxtLink to="/companies/create" class="btn btn-primary px-8 py-3 text-lg">
          + Buat Perusahaan Baru
        </NuxtLink>
      </div>

      <!-- Company List -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        <!-- New Company Button -->
        <NuxtLink 
          to="/companies/create" 
          class="glass-card p-6 flex flex-col items-center justify-center text-center border-dashed border-2 border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 group transition-all duration-300 min-h-[220px]"
        >
          <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-soft mb-4 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 class="font-semibold text-neutral-800 group-hover:text-primary-600">Buat Perusahaan Baru</h3>
          <p class="text-sm text-neutral-500 mt-1">Mulai pembukuan baru</p>
        </NuxtLink>

        <!-- Company Cards -->
        <div 
          v-for="company in companies" 
          :key="company.id"
          class="card-interactive p-6 flex flex-col justify-between group min-h-[220px]"
          @click="selectCompany(company)"
        >
          <div>
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-soft group-hover:scale-105 transition-transform">
                {{ getInitials(company.name) }}
              </div>
              
            </div>
            <h3 class="text-lg font-bold text-neutral-800 mb-1 group-hover:text-primary-600 transition-colors">
              {{ company.name }}
            </h3>
            <p class="text-sm text-neutral-500 font-mono">{{ company.slug }}</p>
          </div>

          <div class="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-sm">
            <span class="text-neutral-500 text-xs">
              Role: <span class="font-medium text-neutral-700 uppercase">{{ company.role }}</span>
            </span>
            <span class="text-primary-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Dashboard
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const companyStore = useCompanyStore()
const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)
const companies = computed(() => companyStore.companies)
const loading = computed(() => companyStore.loading)

const userInitials = computed(() => {
  if (!user.value?.name) return 'U'
  return getInitials(user.value.name)
})

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const selectCompany = async (company: any) => {
  await router.push(`/${company.slug}/dashboard`)
}

const handleLogout = async () => {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    await authStore.logout()
    router.push('/auth/login')
  }
}

// Fetch companies on mount
onMounted(() => {
  companyStore.fetchCompanies()
})

// Middleware to ensure user is logged in
definePageMeta({
  middleware: ['auth'] // We'll create this middleware or rely on server checks if implemented
})
</script>
