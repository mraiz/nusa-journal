<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
        <span class="text-3xl">📊</span> Laporan Keuangan
      </h1>
      <p class="text-neutral-500 mt-1">Pilih laporan yang ingin Anda lihat</p>
    </div>

    <!-- Reports Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      
      <!-- Balance Sheet -->
      <NuxtLink :to="`/${slug}/reports/balance-sheet`" class="glass-card p-6 group cursor-pointer hover:shadow-soft-lg hover:-translate-y-1 transition-all">
        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
          🏛️
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Neraca (Balance Sheet)</h3>
        <p class="text-sm text-neutral-500">
          Posisi keuangan perusahaan (Harta, Kewajiban, Modal) pada saat tertentu.
        </p>
      </NuxtLink>

      <!-- Profit & Loss -->
      <NuxtLink :to="`/${slug}/reports/profit-loss`" class="glass-card p-6 group cursor-pointer hover:shadow-soft-lg hover:-translate-y-1 transition-all">
        <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
          📈
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Laba Rugi (Profit & Loss)</h3>
        <p class="text-sm text-neutral-500">
          Kinerja perusahaan (Pendapatan & Beban) selama periode tertentu.
        </p>
      </NuxtLink>

      <!-- Trial Balance -->
      <NuxtLink :to="`/${slug}/reports/trial-balance`" class="glass-card p-6 group cursor-pointer hover:shadow-soft-lg hover:-translate-y-1 transition-all">
        <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
          ⚖️
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Neraca Saldo (Trial Balance)</h3>
        <p class="text-sm text-neutral-500">
          Daftar saldo akhir semua akun untuk pengecekan keseimbangan debit/kredit.
        </p>
      </NuxtLink>

      <!-- Ledger Link -->
      <NuxtLink :to="`/${slug}/ledger`" class="glass-card p-6 group cursor-pointer hover:shadow-soft-lg hover:-translate-y-1 transition-all border-dashed border-neutral-300 bg-neutral-50/50">
        <div class="w-12 h-12 rounded-xl bg-neutral-200 flex items-center justify-center text-neutral-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
          📒
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">Buku Besar Detail</h3>
        <p class="text-sm text-neutral-500">
          Lihat rincian transaksi per akun.
        </p>
      </NuxtLink>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.companySlug as string

definePageMeta({
  middleware: 'auth'
})
</script>
