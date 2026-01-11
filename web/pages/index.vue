<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-0 left-1/4 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float"
      ></div>
      <div
        class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-300/20 rounded-full blur-3xl animate-float"
        style="animation-delay: 1.5s"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-200/10 rounded-full blur-3xl animate-float"
        style="animation-delay: 3s"
      ></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Navbar -->
      <nav class="glass-effect border-b sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Responsive Logo -->
            <div class="flex items-center gap-2 md:gap-3">
              <div
                class="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-soft"
              >
                <span class="text-xl md:text-2xl">📊</span>
              </div>
              <span class="hidden md:block text-xl font-bold text-gradient-primary"
                >Nusa Journal</span
              >
            </div>
            <div class="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
              <a href="#features" class="hover:text-primary-600 transition-colors">Fitur</a>
              <a href="#how-it-works" class="hover:text-primary-600 transition-colors"
                >Cara Kerja</a
              >
              <a href="#modules" class="hover:text-primary-600 transition-colors">Modul</a>
            </div>
            <div class="flex items-center gap-2 md:gap-3">
              <template v-if="authStore.isAuthenticated">
                <NuxtLink to="/companies" class="btn btn-primary btn-sm md:btn-md">
                  Dashboard
                </NuxtLink>
              </template>
              <template v-else>
                <NuxtLink
                  to="/auth/login"
                  class="btn btn-secondary btn-sm md:btn-md px-3 text-xs md:text-sm"
                >
                  Masuk
                </NuxtLink>
                <NuxtLink
                  to="/auth/register"
                  class="btn btn-primary btn-sm md:btn-md px-3 text-xs md:text-sm"
                >
                  <span class="hidden sm:inline">Daftar</span> Gratis
                </NuxtLink>
              </template>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center max-w-4xl mx-auto">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100/60 backdrop-blur-sm rounded-full text-primary-700 text-sm font-medium mb-6 animate-slide-down"
          >
            <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            PSAK-Compliant Accounting System
          </div>

          <h1
            class="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-slide-up leading-tight"
          >
            <span class="text-gradient-primary">Sistem Akuntansi</span>
            <br />
            <span class="text-neutral-800">Modern & Profesional</span>
          </h1>

          <p class="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto animate-fade-in">
            Kelola keuangan bisnis Anda dengan sistem akuntansi berbasis PSAK. Multi-perusahaan,
            laporan lengkap, dan mudah digunakan.
          </p>

          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 animate-slide-up px-4 sm:px-0"
            style="animation-delay: 0.2s"
          >
            <NuxtLink
              to="/auth/register"
              class="btn btn-primary text-base sm:text-lg px-8 py-3 w-full sm:w-auto justify-center"
            >
              Mulai Sekarang
              <svg
                class="w-5 h-5 ml-2 inline"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </NuxtLink>
            <a
              href="#features"
              class="btn btn-secondary text-base sm:text-lg px-8 py-3 w-full sm:w-auto justify-center"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>

        <!-- Trust Indicators -->
        <div
          class="mt-16 flex flex-wrap items-center justify-center gap-8 text-center animate-fade-in"
          style="animation-delay: 0.4s"
        >
          <div>
            <div class="text-3xl font-bold text-primary-600">100%</div>
            <div class="text-sm text-neutral-500">Sesuai PSAK</div>
          </div>
          <div class="w-px h-10 bg-neutral-200 hidden md:block"></div>
          <div>
            <div class="text-3xl font-bold text-primary-600">Database</div>
            <div class="text-sm text-neutral-500">Terpisah per Tenant</div>
          </div>
          <div class="w-px h-10 bg-neutral-200 hidden md:block"></div>
          <div>
            <div class="text-3xl font-bold text-primary-600">Real-time</div>
            <div class="text-sm text-neutral-500">Laporan Otomatis</div>
          </div>
        </div>

        <!-- Feature Cards -->
        <div id="features" class="grid md:grid-cols-3 gap-6 mt-20">
          <div class="glass-card p-6 text-center animate-slide-up" style="animation-delay: 0.3s">
            <div
              class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-glow-blue"
            >
              📈
            </div>
            <h3 class="text-xl font-bold text-neutral-800 mb-2">Double-Entry Bookkeeping</h3>
            <p class="text-neutral-600">
              Jurnal otomatis dengan validasi debit = kredit untuk akurasi maksimal
            </p>
          </div>

          <div class="glass-card p-6 text-center animate-slide-up" style="animation-delay: 0.4s">
            <div
              class="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-glow-green"
            >
              🏢
            </div>
            <h3 class="text-xl font-bold text-neutral-800 mb-2">Multi-Perusahaan</h3>
            <p class="text-neutral-600">
              Kelola beberapa perusahaan dalam satu akun dengan database terpisah
            </p>
          </div>

          <div class="glass-card p-6 text-center animate-slide-up" style="animation-delay: 0.5s">
            <div
              class="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4"
            >
              📊
            </div>
            <h3 class="text-xl font-bold text-neutral-800 mb-2">Laporan Lengkap</h3>
            <p class="text-neutral-600">
              Trial Balance, Laba Rugi, Neraca, dan laporan keuangan sesuai PSAK
            </p>
          </div>
        </div>
      </div>

      <!-- How It Works Section -->
      <div id="how-it-works" class="bg-neutral-50 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-neutral-800 mb-4">Cara Kerja</h2>
            <p class="text-neutral-600 max-w-2xl mx-auto">
              Mulai kelola keuangan bisnis Anda dalam 3 langkah mudah
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
              >
                1
              </div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Daftar & Buat Perusahaan</h3>
              <p class="text-neutral-600 text-sm">
                Buat akun dan tambahkan perusahaan Anda. Database khusus akan dibuat otomatis.
              </p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
              >
                2
              </div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Atur Chart of Accounts</h3>
              <p class="text-neutral-600 text-sm">
                Sesuaikan daftar akun sesuai kebutuhan bisnis Anda atau gunakan template bawaan.
              </p>
            </div>
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
              >
                3
              </div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Catat Transaksi</h3>
              <p class="text-neutral-600 text-sm">
                Input penjualan, pembelian, dan pembayaran. Jurnal dan laporan dihasilkan otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules Section -->
      <div id="modules" class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-neutral-800 mb-4">Modul Lengkap</h2>
            <p class="text-neutral-600 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola siklus akuntansi penuh
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">📒</div>
              <h4 class="font-bold text-neutral-800 mb-1">Jurnal Umum</h4>
              <p class="text-sm text-neutral-600">
                Pencatatan transaksi dengan double-entry validation
              </p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">🧾</div>
              <h4 class="font-bold text-neutral-800 mb-1">Penjualan</h4>
              <p class="text-sm text-neutral-600">
                Invoice, tracking pembayaran, dan piutang otomatis
              </p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">🛒</div>
              <h4 class="font-bold text-neutral-800 mb-1">Pembelian</h4>
              <p class="text-sm text-neutral-600">Bill vendor, hutang, dan manajemen supplier</p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">💰</div>
              <h4 class="font-bold text-neutral-800 mb-1">Pembayaran</h4>
              <p class="text-sm text-neutral-600">Terima & bayar dengan linking ke invoice/bill</p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">📅</div>
              <h4 class="font-bold text-neutral-800 mb-1">Periode Akuntansi</h4>
              <p class="text-sm text-neutral-600">
                Buka, tutup periode, dan jurnal penutup otomatis
              </p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">📑</div>
              <h4 class="font-bold text-neutral-800 mb-1">Buku Besar</h4>
              <p class="text-sm text-neutral-600">
                General Ledger dengan running balance real-time
              </p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">📊</div>
              <h4 class="font-bold text-neutral-800 mb-1">Laporan Keuangan</h4>
              <p class="text-sm text-neutral-600">Trial Balance, Laba Rugi, Neraca, Arus Kas</p>
            </div>
            <div class="glass-card p-5 hover:shadow-soft-lg transition-shadow">
              <div class="text-3xl mb-3">👥</div>
              <h4 class="font-bold text-neutral-800 mb-1">Multi-User</h4>
              <p class="text-sm text-neutral-600">
                Invite tim dengan role: Admin, Finance, Accountant
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div
          class="glass-card p-6 md:p-10 text-center bg-gradient-to-r from-primary-50 to-accent-50"
        >
          <h2 class="text-3xl font-bold text-gradient-primary mb-4">Siap Memulai?</h2>
          <p class="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Mulai kelola keuangan bisnis Anda dengan lebih profesional dan terstruktur.
          </p>
          <NuxtLink
            to="/auth/register"
            class="btn btn-primary text-sm sm:text-lg px-4 sm:px-10 py-3 w-full sm:w-auto justify-center"
          >
            <span class="truncate">Daftar Sekarang — Gratis</span>
            <svg
              class="w-5 h-5 ml-2 inline flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Footer -->
      <footer class="border-t border-neutral-200 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid md:grid-cols-4 gap-8">
            <div class="md:col-span-2">
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft"
                >
                  <span class="text-2xl">📊</span>
                </div>
                <span class="text-xl font-bold text-gradient-primary">Nusa Journal</span>
              </div>
              <p class="text-neutral-600 text-sm max-w-sm">
                Sistem Akuntansi berbasis PSAK dengan arsitektur multi-tenant untuk bisnis
                Indonesia.
              </p>
            </div>
            <div>
              <h4 class="font-bold text-neutral-800 mb-3">Produk</h4>
              <ul class="space-y-2 text-sm text-neutral-600">
                <li><a href="#features" class="hover:text-primary-600">Fitur</a></li>
                <li><a href="#modules" class="hover:text-primary-600">Modul</a></li>
                <li><a href="#how-it-works" class="hover:text-primary-600">Cara Kerja</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-neutral-800 mb-3">Akun</h4>
              <ul class="space-y-2 text-sm text-neutral-600">
                <li><NuxtLink to="/auth/login" class="hover:text-primary-600">Masuk</NuxtLink></li>
                <li>
                  <NuxtLink to="/auth/register" class="hover:text-primary-600">Daftar</NuxtLink>
                </li>
              </ul>
            </div>
          </div>
          <div class="border-t border-neutral-100 mt-8 pt-8 text-center text-sm text-neutral-500">
            &copy; 2026 Nusa Journal. Sistem Akuntansi berbasis PSAK.
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
  const authStore = useAuthStore()

  useHead({
    title: 'Nusa Journal - Sistem Akuntansi Modern untuk Bisnis Indonesia',
    meta: [
      {
        name: 'description',
        content:
          'Sistem akuntansi berbasis PSAK dengan fitur multi-perusahaan, double-entry bookkeeping, dan laporan keuangan lengkap. Database terpisah per tenant untuk keamanan maksimal.',
      },
    ],
  })
</script>
