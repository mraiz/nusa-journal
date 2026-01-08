<template>
  <div class="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
    <!-- Blobs -->
    <div class="absolute top-0 left-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float -z-10"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl animate-float -z-10 transition-all duration-1000" style="animation-delay: 1.5s"></div>

    <div class="text-center">
      <div v-if="error" class="max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-neutral-800 mb-2">Terjadi Kesalahan</h1>
        <p class="text-neutral-600 mb-6">{{ error.message || 'Something went wrong' }}</p>
        <button @click="handleError" class="btn btn-primary">
          Kembali ke Beranda
        </button>
      </div>
      
      <div v-else>
         <!-- 404 Layout -->
        <h1 class="text-9xl font-black text-neutral-200 mb-4 select-none">404</h1>
        <h2 class="text-3xl font-bold text-neutral-800 mb-4">Halaman Tidak Ditemukan</h2>
        <p class="text-neutral-600 mb-8 max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <NuxtLink to="/" class="btn btn-primary">
          Kembali ke Beranda
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  error: Object
})

const handleError = () => clearError({ redirect: '/' })
</script>
