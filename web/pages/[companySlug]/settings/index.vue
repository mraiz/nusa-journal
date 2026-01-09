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
        :class="activeTab === 'accounts' ? 'border-primary-500 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'"
        @click="activeTab = 'accounts'"
      >
        📊 Akun
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

    <!-- Accounts Tab -->
    <div v-else-if="activeTab === 'accounts'" class="glass-card p-8 animate-fade-in max-w-2xl">
      <h3 class="text-lg font-bold text-neutral-800 mb-2 border-b border-neutral-100 pb-2">Mapping Akun</h3>
      <p class="text-sm text-neutral-500 mb-6">Konfigurasi akun default untuk pembuatan jurnal otomatis saat posting invoice dan bill.</p>
      
      <div v-if="accountsLoading" class="text-center py-8">
        <div class="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
      
      <form v-else @submit.prevent="saveAccountSettings" class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">
            Piutang Usaha (Accounts Receivable) <span class="text-red-500">*</span>
          </label>
          <select v-model="accountSettings.accountsReceivableId" class="input py-2">
            <option value="">Pilih Akun AR...</option>
            <option v-for="acc in assetAccounts" :key="acc.id" :value="acc.id">
              {{ acc.code }} - {{ acc.name }}
            </option>
          </select>
          <p class="text-xs text-neutral-400 mt-1">Digunakan saat posting invoice penjualan (Debit AR)</p>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase">
            Hutang Usaha (Accounts Payable) <span class="text-red-500">*</span>
          </label>
          <select v-model="accountSettings.accountsPayableId" class="input py-2">
            <option value="">Pilih Akun AP...</option>
            <option v-for="acc in liabilityAccounts" :key="acc.id" :value="acc.id">
              {{ acc.code }} - {{ acc.name }}
            </option>
          </select>
          <p class="text-xs text-neutral-400 mt-1">Digunakan saat posting bill pembelian (Credit AP)</p>
        </div>

        <div class="pt-4">
          <button type="submit" :disabled="savingAccounts" class="btn btn-primary">
            <span v-if="savingAccounts" class="animate-spin mr-2">...</span>
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>

    <!-- Team Tab -->
    <div v-else-if="activeTab === 'team'" class="animate-fade-in space-y-6">
      <div class="flex justify-between items-center">
        <div>
           <h3 class="text-lg font-bold text-neutral-800">Daftar Anggota</h3>
           <p class="text-sm text-neutral-500">Kelola akses user ke perusahaan ini</p>
        </div>
        <button class="btn btn-primary" @click="showInviteModal = true">
          {{ isAdmin ? '+ Tambah Anggota' : '+ Undang Anggota' }}
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
              <td class="px-6 py-4 text-right">
                <div v-if="isAdmin && member.email !== authStore.user?.email" class="flex justify-end gap-2">
                  <!-- PENDING: Approve/Reject -->
                  <template v-if="member.status === 'PENDING'">
                      <button class="btn btn-sm btn-primary py-1 px-3 text-xs" @click="handleApprove(member)">
                        Approve
                      </button>
                      <button class="btn btn-sm btn-outline-danger py-1 px-3 text-xs" @click="confirmRemove(member)">
                        Reject
                      </button>
                  </template>
                  
                  <!-- APPROVED/REJECTED: Edit/Delete -->
                  <template v-else>
                      <button class="text-primary-600 hover:text-primary-800 text-sm font-medium" @click="handleEdit(member)">
                         <PencilSquareIcon class="w-5 h-5" />
                      </button>
                      <button class="text-red-400 hover:text-red-600 text-sm font-medium" @click="confirmRemove(member)">
                        <TrashIcon class="w-5 h-5" />
                      </button>
                  </template>
                </div>
              </td>
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
          {{ isAdmin ? 'Tambah Anggota Baru' : 'Undang Anggota Baru' }}
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

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <h3 class="text-xl font-bold text-neutral-800 mb-2">Edit Anggota</h3>
        <p class="text-sm text-neutral-500 mb-6">Ubah peran/akses user <strong>{{ editForm.name }}</strong> ({{ editForm.email }}).</p>
        
        <form @submit.prevent="submitEdit" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Peran (Role)</label>
            <select v-model="editForm.role" class="input py-2">
              <option value="FINANCE">Finance (Staff Keuangan)</option>
              <option value="ACCOUNTANT">Accountant (Akuntan)</option>
              <option value="AUDITOR">Auditor (Read Only)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="companyStore.loading">
              {{ companyStore.loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Approve User Modal -->
    <div v-if="showApproveModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <h3 class="text-xl font-bold text-neutral-800 mb-2">Setujui Anggota Baru</h3>
        <p class="text-sm text-neutral-500 mb-6">Pilih peran untuk <strong>{{ approveForm.name }}</strong> agar dapat mengakses perusahaan.</p>
        
        <form @submit.prevent="submitApprove" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-500 uppercase">Peran (Role)</label>
            <select v-model="approveForm.role" class="input py-2">
              <option value="FINANCE">Finance (Staff Keuangan)</option>
              <option value="ACCOUNTANT">Accountant (Akuntan)</option>
              <option value="AUDITOR">Auditor (Read Only)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" class="btn btn-secondary" @click="showApproveModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="companyStore.loading">
              {{ companyStore.loading ? 'Memproses...' : 'Setujui Anggota' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </NuxtLayout>
</template>

<script setup lang="ts">
import { useCompanyStore } from '~/stores/company';
import { useAccountStore } from '~/stores/account';
import { useAuthStore } from '~/stores/auth';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/20/solid'


const route = useRoute()
const companyStore = useCompanyStore()
const accountStore = useAccountStore()
const authStore = useAuthStore()

const activeTab = ref('general')
const showInviteModal = ref(false)
const inviteForm = reactive({
  email: '',
  role: 'FINANCE'
})

// Accounts Tab State
const accountsLoading = ref(false)
const savingAccounts = ref(false)
const allAccounts = ref<any[]>([])
const accountSettings = reactive({
  accountsReceivableId: '',
  accountsPayableId: ''
})

const assetAccounts = computed(() => allAccounts.value.filter(a => a.type === 'ASSET' && a.isPosting))
const liabilityAccounts = computed(() => allAccounts.value.filter(a => a.type === 'LIABILITY' && a.isPosting))

const isAdmin = computed(() => {
  // 1. Try direct role from currentCompany (works if navigated from dashboard)
  if (companyStore.currentCompany?.role === 'ADMIN') return true
  
  // 2. Fallback: Find self in companyUsers list (works if direct load)
  if (authStore.user?.email && companyStore.companyUsers.length > 0) {
      const me = companyStore.companyUsers.find(u => u.email === authStore.user?.email)
      return me?.role === 'ADMIN'
  }
  
  return false
})

onMounted(async () => {
  const slug = route.params.companySlug as string
  if (slug) {
    // Always fetch users when entering settings
    companyStore.fetchCompanyUsers(slug)
    
    // Fetch accounts for settings tab
    accountsLoading.value = true
    try {
      const accRes = await accountStore.fetchAccounts(slug, { limit: 500 })
      if (accRes.data) {
        allAccounts.value = accRes.data
      } else if (Array.isArray(accRes)) {
        allAccounts.value = accRes
      }
      
      // Also fetch current company settings
      const companyData = await authStore.fetchWithAuth(`/${slug}/company`)
      
      // Ensure store has current company data so isAdmin works
      if (!companyStore.currentCompany) {
          companyStore.currentCompany = companyData
      }

      accountSettings.accountsReceivableId = companyData.accountsReceivableId || ''
      accountSettings.accountsPayableId = companyData.accountsPayableId || ''
    } catch (err) {
      console.error('Failed to fetch accounts', err)
    } finally {
      accountsLoading.value = false
    }
  }
})

// Save Account Settings
const saveAccountSettings = async () => {
  savingAccounts.value = true
  try {
    await authStore.fetchWithAuth(`/${route.params.companySlug}/company/settings`, {
      method: 'PATCH',
      body: accountSettings
    })
    alert('Pengaturan akun berhasil disimpan!')
  } catch (err: any) {
    alert(err.message || 'Gagal menyimpan pengaturan')
  } finally {
    savingAccounts.value = false
  }
}

// Invite
const submitInvite = async () => {
  if (!companyStore.currentCompany) return
  
  try {
    await companyStore.inviteUser(companyStore.currentCompany.slug, inviteForm.email, inviteForm.role)
    alert('Berhasil memproses anggota!')
    showInviteModal.value = false
    inviteForm.email = ''
  } catch (e: any) {
    alert('Gagal: ' + e.message)
  }
}

// Edit Role
const showEditModal = ref(false)
const editForm = reactive({
  userId: '',
  name: '',
  email: '',
  role: ''
})

const handleEdit = (member: any) => {
  editForm.userId = member.userId
  editForm.name = member.name
  editForm.email = member.email
  editForm.role = member.role
  showEditModal.value = true
}

const submitEdit = async () => {
  if (!companyStore.currentCompany) return
  try {
    await companyStore.updateUser(companyStore.currentCompany.slug, editForm.userId, editForm.role)
    alert('Role user berhasil diperbarui!')
    showEditModal.value = false
  } catch (e: any) {
    alert('Gagal update role: ' + e.message)
  }
}

// Approve User Logic
const showApproveModal = ref(false)
const approveForm = reactive({
  userId: '',
  name: '',
  role: 'FINANCE'
})

const handleApprove = (member: any) => {
  approveForm.userId = member.userId
  approveForm.name = member.name
  approveForm.role = 'FINANCE' // Default
  showApproveModal.value = true
}

const submitApprove = async () => {
   if (!companyStore.currentCompany) return
   try {
      await companyStore.approveUser(companyStore.currentCompany.slug, approveForm.userId, approveForm.role)
      alert('User berhasil disetujui dan aktif!')
      showApproveModal.value = false
   } catch (e: any) {
      alert('Gagal menyetujui user: ' + e.message)
   }
}

// Remove
const confirmRemove = async (member: any) => {
  if (!companyStore.currentCompany) return
  if (confirm(`Yakin ingin menghapus akses user ${member.name}?`)) {
    try {
      await companyStore.removeUser(companyStore.currentCompany.slug, member.userId)
    } catch (e: any) {
      alert('Gagal menghapus user: ' + e.message)
    }
  }
}

definePageMeta({
  middleware: 'auth'
})
</script>
