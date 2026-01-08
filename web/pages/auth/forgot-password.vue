<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 -left-20 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-20 -right-20 w-96 h-96 bg-accent-300/20 rounded-full blur-3xl animate-float" style="animation-delay: 1s;"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <div class="glass-card p-8 animate-scale-in">
        <div class="text-center mb-8">
           <div class="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 text-neutral-500 rounded-2xl mb-4">
            <span class="text-3xl">🔐</span>
          </div>
          <h1 class="text-2xl font-bold text-neutral-800 mb-2">Lupa Password?</h1>
          <p class="text-neutral-600 text-sm">Masukkan email Anda untuk reset password.</p>
        </div>

        <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center animate-slide-down">
          Link reset password telah dikirim ke email Anda (Simulasi).
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6" v-else>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Email</label>
            <input 
                type="email" 
                v-model="email" 
                required 
                class="input" 
                placeholder="nama@email.com"
            >
          </div>

          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? 'Mengirim...' : 'Kirim Link Reset' }}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <NuxtLink to="/auth/login" class="text-sm text-neutral-500 hover:text-neutral-800 font-medium">
            ← Kembali ke Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const loading = ref(false)
const success = ref(false)

const handleSubmit = async () => {
    loading.value = true
    // Simulate API call
    setTimeout(() => {
        loading.value = false
        success.value = true
    }, 1500)
}

definePageMeta({
    layout: false
})
</script>
