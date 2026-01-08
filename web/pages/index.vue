<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-300/20 rounded-full blur-3xl animate-float" style="animation-delay: 1.5s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-200/10 rounded-full blur-3xl animate-float" style="animation-delay: 3s;"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Navbar -->
      <nav class="glass-effect border-b sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft">
                <span class="text-2xl">📊</span>
              </div>
              <span class="text-xl font-bold text-gradient-primary">Nusa Journal</span>
            </div>
            <div class="flex items-center gap-3">
              <NuxtLink to="/auth/login" class="btn btn-secondary">
                Masuk
              </NuxtLink>
              <NuxtLink to="/auth/register" class="btn btn-primary">
                Daftar Gratis
              </NuxtLink>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center max-w-4xl mx-auto">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100/60 backdrop-blur-sm rounded-full text-primary-700 text-sm font-medium mb-6 animate-slide-down">
            <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            PSAK-Compliant Accounting System
          </div>
          
          <h1 class="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
            <span class="text-gradient-primary">Sistem Akuntansi</span>
            <br />
            <span class="text-neutral-800">Modern & Mudah</span>
          </h1>
          
          <p class="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto animate-fade-in">
            Kelola keuangan bisnis Anda dengan sistem akuntansi berbasis PSAK. 
            Multi-perusahaan, laporan lengkap, dan mudah digunakan.
          </p>
          
          <div class="flex items-center justify-center gap-4 animate-slide-up" style="animation-delay: 0.2s;">
            <NuxtLink to="/auth/register" class="btn btn-primary text-lg px-8 py-3">
              Mulai Gratis
              <svg class="w-5 h-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
            <a href="#features" class="btn btn-secondary text-lg px-8 py-3">
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>

        <!-- Feature Cards -->
        <div id="features" class="grid md:grid-cols-3 gap-6 mt-20">
          <div class="glass-card p-6 text-center animate-slide-up" style="animation-delay: 0.3s;">
            <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-glow-blue">
              📈
            </div>
            <h3 class="text-xl font-bold text-neutral-800 mb-2">Double-Entry Bookkeeping</h3>
            <p class="text-neutral-600">Jurnal otomatis dengan validasi debit = kredit untuk akurasi maksimal</p>
          </div>

          <div class="glass-card p-6 text-center animate-slide-up" style="animation-delay: 0.4s;">
            <div class="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-glow-green">
              🏢
            </div>
            <h3 class="text-xl font-bold text-neutral-800 mb-2">Multi-Perusahaan</h3>
            <p class="text-neutral-600">Kelola beberapa perusahaan dalam satu akun dengan database terpisah</p>
          </div>

          <div class="glass-card p-6 text-center animate-slide-up" style="animation-delay: 0.5s;">
            <div class="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
              📊
            </div>
            <h3 class="text-xl font-bold text-neutral-800 mb-2">Laporan Lengkap</h3>
            <p class="text-neutral-600">Trial Balance, Laba Rugi, Neraca, dan laporan keuangan sesuai PSAK</p>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="mt-20 glass-card p-10 text-center">
          <h2 class="text-3xl font-bold text-gradient-primary mb-4">Siap Memulai?</h2>
          <p class="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan perusahaan yang sudah mempercayai Nusa Journal 
            untuk mengelola keuangan mereka.
          </p>
          <NuxtLink to="/auth/register" class="btn btn-accent text-lg px-10 py-3">
            Buat Akun Gratis
            <svg class="w-5 h-5 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Footer -->
      <footer class="border-t border-neutral-200 mt-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p class="text-center text-sm text-neutral-600">
            &copy; 2026 Nusa Journal. Sistem Akuntansi berbasis PSAK.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page metadata
useHead({
  title: 'Nusa Journal - Sistem Akuntansi Modern',
  meta: [
    { name: 'description', content: 'Sistem akuntansi berbasis PSAK dengan fitur multi-perusahaan, double-entry bookkeeping, dan laporan keuangan lengkap.' }
  ]
})
</script>
