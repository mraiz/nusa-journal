<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated Background Blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-20 -left-20 w-96 h-96 bg-accent-300/20 rounded-full blur-3xl animate-float"
      ></div>
      <div
        class="absolute bottom-20 -right-20 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float"
        style="animation-delay: 1s"
      ></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Card -->
      <div class="glass-card p-8 animate-scale-in">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl mb-4 shadow-glow-green"
          >
            <span class="text-3xl">✨</span>
          </div>
          <h1 class="text-3xl font-bold text-gradient-primary mb-2">Mulai Sekarang</h1>
          <p class="text-neutral-600">Buat akun baru Anda</p>
        </div>

        <!-- Success Message -->
        <div
          v-if="success"
          class="mb-6 p-4 bg-accent-50 border border-accent-200 rounded-xl text-accent-700 text-sm animate-slide-down"
        >
          ✓ Akun berhasil dibuat! Mengalihkan ke login...
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-slide-down"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-neutral-700 mb-2">
              Nama Lengkap
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input"
              placeholder="John Doe"
              :disabled="loading"
            />
          </div>

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

          <!-- Company Code (Slug) -->
          <div>
            <label for="companySlug" class="block text-sm font-medium text-neutral-700 mb-2">
              Kode Perusahaan (Opsional)
            </label>
            <input
              id="companySlug"
              v-model="form.companySlug"
              type="text"
              class="input font-mono"
              placeholder="e.g. nusa-journal-tbk"
              :disabled="loading"
            />
            <p class="text-xs text-neutral-500 mt-1">
              Masukkan kode perusahaan jika Anda ingin langsung bergabung.
            </p>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="6"
              class="input"
              placeholder="••••••••"
              :disabled="loading"
            />
            <p class="mt-2 text-xs text-neutral-500 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Minimal 6 karakter
            </p>
          </div>

          <!-- Terms -->
          <div class="flex items-start gap-2">
            <input
              type="checkbox"
              required
              class="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm text-neutral-600">
              Saya setuju dengan
              <a href="#" class="text-primary-600 hover:text-primary-700 font-medium"
                >syarat & ketentuan</a
              >
              serta
              <a href="#" class="text-primary-600 hover:text-primary-700 font-medium"
                >kebijakan privasi</a
              >
            </span>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-accent w-full" :disabled="loading">
            <span v-if="!loading" class="flex items-center justify-center gap-2">
              <span>Buat Akun</span>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Membuat akun...</span>
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="mt-8 flex items-center gap-4">
          <div class="flex-1 h-px bg-neutral-200"></div>
          <span class="text-sm text-neutral-500">Sudah punya akun?</span>
          <div class="flex-1 h-px bg-neutral-200"></div>
        </div>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <NuxtLink to="/auth/login" class="btn btn-secondary w-full"> Masuk ke Akun </NuxtLink>
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

  definePageMeta({
    middleware: 'guest',
  })

  const form = ref({
    name: '',
    email: '',
    password: '',
    companySlug: '',
  })

  const error = ref('')
  const success = ref(false)
  const loading = computed(() => authStore.loading)

  const handleRegister = async () => {
    error.value = ''
    success.value = false

    try {
      await authStore.register(form.value)
      success.value = true

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (e: any) {
      error.value = e.message || 'Registrasi gagal. Silakan coba lagi.'
    }
  }
</script>
