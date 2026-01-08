<template>
  <NuxtLayout name="dashboard">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
        <span class="text-3xl">⚙️</span> Pengaturan
      </h1>
      <p class="text-neutral-500 mt-1">Kelola profil perusahaan dan anggota tim</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-neutral-200 mb-6">
      <button 
        class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="activeTab === 'general' ? 'border-primary-500 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'"
        @click="activeTab = 'general'"
      >
        🏢 Umum
      </button>
      <button 
        class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="activeTab === 'team' ? 'border-primary-500 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'"
        @click="activeTab = 'team'"
      >
        👥 Anggota Tim
      </button>
    </div>

    <!-- General Tab -->
    <div v-if="activeTab === 'general'" class="glass-card p-8 animate-fade-in max-w-2xl">
      <h3 class="text-lg font-bold text-neutral-800 mb-6 border-b border-neutral-100 pb-2">Profil Perusahaan</h3>
      
      <div class="space-y-6">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Nama Perusahaan</label>
          <input type="text" :value="companyStore.currentCompany?.name" class="input py-2 bg-neutral-50" readonly>
          <p class="text-xs text-neutral-400 mt-1">Hubungi support untuk mengubah nama perusahaan.</p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Slug URL</label>
          <div class="flex items-center gap-2">
            <span class="text-neutral-400 text-sm">journal.nusa.id/</span>
            <input type="text" :value="companyStore.currentCompany?.slug" class="input py-2 flex-1 bg-neutral-50" readonly>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">Mata Uang Dasar</label>
          <input type="text" :value="companyStore.currentCompany?.baseCurrency" class="input py-2 bg-neutral-50 font-mono" readonly>
        </div>
      </div>
    </div>

    <!-- Team Tab -->
    <div v-else-if="activeTab === 'team'" class="animate-fade-in space-y-6">
      <div class="flex justify-between items-center">
        <div>
           <h3 class="text-lg font-bold text-neutral-800">Daftar Anggota</h3>
           <p class="text-sm text-neutral-500">Kelola akses user ke perusahaan ini</p>
        </div>
        <button class="btn btn-primary" @click="showInviteModal = true">
          {{ isAdmin ? '+ Tambah Anggota' : '+ Undang Teman' }}
        </button>
      </div>

      <div class="glass-card overflow-hidden">
        <table class="w-full">
          <thead class="bg-neutral-50 text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">
            <tr>
              <th class="px-6 py-3">Nama user</th>
              <th class="px-6 py-3">Email</th>
              <th class="px-6 py-3">Role</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr v-for="member in companyStore.companyUsers" :key="member.userId" class="hover:bg-neutral-50">
              <td class="px-6 py-4 font-medium text-neutral-800">
                {{ member.name }}
              </td>
              <td class="px-6 py-4 text-sm text-neutral-600">
                {{ member.email }}
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">{{ member.role }}</span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span v-if="member.status === 'APPROVED'" class="text-green-600 font-medium">Aktif</span>
                <span v-else-if="member.status === 'PENDING'" class="text-orange-500 font-medium">Pending Invite</span>
                <span v-else class="text-red-500">{{ member.status }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button v-if="isAdmin" class="text-red-400 hover:text-red-600 text-sm font-medium" @click="confirmRemove(member)">
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <h3 class="text-xl font-bold text-neutral-800 mb-2">
          {{ isAdmin ? 'Tambah Anggota Baru' : 'Undang Teman' }}
        </h3>
        <p class="text-sm text-neutral-500 mb-6">
          {{ isAdmin ? 'Masukkan email user yang sudah terdaftar. User akan langsung aktif.' : 'Undangan akan dikirim ke email tujuan untuk konfirmasi.' }}
        </p>
        
        <form @submit.prevent="submitInvite" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Email User</label>
            <input type="email" v-model="inviteForm.email" class="input py-2" placeholder="user@example.com" required>
          </div>
          
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Peran (Role)</label>
            <select v-model="inviteForm.role" class="input py-2">
              <option value="FINANCE">Finance (Staff Keuangan)</option>
              <option value="ACCOUNTANT">Accountant (Akuntan)</option>
              <option value="AUDITOR">Auditor (Read Only)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" class="btn btn-secondary" @click="showInviteModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="companyStore.loading">
              {{ companyStore.loading ? 'Memproses...' : (isAdmin ? 'Tambah Member' : 'Kirim Undangan') }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import { useCompanyStore } from '~/stores/company';

const companyStore = useCompanyStore()
const activeTab = ref('general')
const showInviteModal = ref(false)
const inviteForm = reactive({
  email: '',
  role: 'FINANCE'
})

const isAdmin = computed(() => {
  return companyStore.currentCompany?.role === 'ADMIN'
})

onMounted(() => {
  if (companyStore.currentCompany) {
    companyStore.fetchCompanyUsers(companyStore.currentCompany.slug)
  }
})

// Invite
const submitInvite = async () => {
  if (!companyStore.currentCompany) return
  
  try {
    await companyStore.inviteUser(companyStore.currentCompany.slug, inviteForm.email, inviteForm.role)
    alert('Berhasil memproses anggota!')
    showInviteModal.value = false
    inviteForm.email = ''
  } catch (e) {
    alert('Gagal: ' + e)
  }
}

// Remove
const confirmRemove = async (member: any) => {
  if (!companyStore.currentCompany) return
  if (confirm(`Yakin ingin menghapus akses user ${member.name}?`)) {
    try {
      await companyStore.removeUser(companyStore.currentCompany.slug, member.userId)
    } catch (e) {
      alert('Gagal menghapus user: ' + e)
    }
  }
}

definePageMeta({
  middleware: 'auth'
})
</script>
