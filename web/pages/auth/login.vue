<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated Background Blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 -left-20 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-20 -right-20 w-96 h-96 bg-accent-300/20 rounded-full blur-3xl animate-float" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Card -->
      <div class="glass-card p-8 animate-scale-in">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-glow-blue">
            <span class="text-3xl">📊</span>
          </div>
          <h1 class="text-3xl font-bold text-gradient-primary mb-2">Nusa Journal</h1>
          <p class="text-neutral-600">Masuk ke akun Anda</p>
        </div>

        <!-- Error Message -->
        <div 
          v-if="error" 
          class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-down"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input"
              placeholder="nama@email.com"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input pr-10"
                placeholder="••••••••"
                :disabled="loading"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <!-- Eye Open -->
                <svg v-if="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Closed -->
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.874m5.05-5.05A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.574 2.874M9 15l3-3m0 0l3-3m-3 3a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" v-model="rememberMe" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500">
              <span class="ml-2 text-neutral-700">Ingat saya</span>
            </label>
            <NuxtLink to="/auth/forgot-password" class="text-primary-600 hover:text-primary-700 font-medium">Lupa password?</NuxtLink>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="loading"
          >
            <span v-if="!loading" class="flex items-center justify-center gap-2">
              <span>Masuk</span>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memproses...</span>
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="mt-8 flex items-center gap-4">
          <div class="flex-1 h-px bg-neutral-200"></div>
          <span class="text-sm text-neutral-500">Atau</span>
          <div class="flex-1 h-px bg-neutral-200"></div>
        </div>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-neutral-600">
            Belum punya akun?
            <NuxtLink to="/auth/register" class="text-primary-600 hover:text-primary-700 font-semibold">
              Daftar sekarang
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center mt-8 text-sm text-neutral-600">
        &copy; 2026 Nusa Journal. Sistem Akuntansi PSAK.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)
const rememberMe = ref(false)

const error = ref('')
const loading = computed(() => authStore.loading)

onMounted(() => {
  // Check 'Remember Me'
  const savedEmail = localStorage.getItem('journal_remember_email')
  if (savedEmail) {
    form.value.email = savedEmail
    rememberMe.value = true
  }
})

const handleLogin = async () => {
  error.value = ''
  
  try {
    await authStore.login(form.value)
    
    // Handle 'Remember Me'
    if (rememberMe.value) {
      localStorage.setItem('journal_remember_email', form.value.email)
    } else {
      localStorage.removeItem('journal_remember_email')
    }

    // Fetch user's companies to determine redirect
    const { $api } = useNuxtApp()
    const companies = await $api<any[]>('/companies')

    if (companies && companies.length === 1) {
      // Single company - go directly to dashboard
      router.push(`/${companies[0].slug}/dashboard`)
    } else {
      // No companies or multiple - show company selection
      router.push('/companies')
    }
  } catch (e: any) {
    error.value = e.message || 'Email atau password salah'
  }
}
</script>
