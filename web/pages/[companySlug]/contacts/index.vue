<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Contacts</h1>
      <button @click="openCreateModal" class="btn btn-primary flex items-center gap-2">
        <span class="i-heroicons-plus-20-solid" />
        New {{ activeTab === 'CUSTOMERS' ? 'Customer' : 'Vendor' }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 border-b border-slate-200 mb-6">
      <button
        v-for="tab in ['CUSTOMERS', 'VENDORS']"
        :key="tab"
        @click="switchTab(tab)"
        class="px-4 py-2 text-sm font-medium transition-colors relative"
        :class="activeTab === tab ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'"
      >
        {{ tab === 'CUSTOMERS' ? 'Customers' : 'Vendors' }}
        <div
          v-if="activeTab === tab"
          class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500"
        ></div>
      </button>
    </div>

    <!-- Filters & Search -->
    <div
      class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between"
    >
      <div class="w-full sm:w-72">
        <SearchInput
          v-model="search"
          :placeholder="`Search ${activeTab.toLowerCase()}...`"
          @search="handleSearch"
        />
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="text-center py-12">
      <div
        class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"
      ></div>
      <p class="mt-2 text-slate-500">Loading contacts...</p>
    </div>

    <div
      v-else
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody v-if="currentList?.length > 0" class="divide-y divide-slate-100">
            <tr
              v-for="item in currentList"
              :key="item.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 text-sm font-medium text-slate-900">{{ item.code }}</td>
              <td class="px-6 py-4 text-sm text-slate-700">{{ item.name }}</td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ item.email || '-' }}</td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ item.phone || '-' }}</td>
              <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button
                  @click="handleEdit(item)"
                  class="text-slate-400 hover:text-primary-600 transition-colors"
                  title="Edit"
                >
                  <PencilSquareIcon class="w-5 h-5" />
                </button>
                <button
                  @click="handleDelete(item.id)"
                  class="text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="currentList?.length === 0 && !loading">
        <EmptyState
          :title="activeTab === 'CUSTOMERS' ? 'No Customers Yet' : 'No Vendors Yet'"
          :description="
            activeTab === 'CUSTOMERS'
              ? 'Add customers to track sales and receivables.'
              : 'Add vendors to track expenses and payables.'
          "
          :icon="activeTab === 'CUSTOMERS' ? '👥' : '🏢'"
          :action-label="activeTab === 'CUSTOMERS' ? 'New Customer' : 'New Vendor'"
          @action="openCreateModal"
        />
      </div>

      <PaginationControl
        v-if="currentList?.length > 0"
        :current-page="page"
        v-model:limit="limit"
        :total="total"
        @page-change="changePage"
      />
    </div>

    <CreateContactModal
      :show="showCreateModal"
      :type="activeTab === 'CUSTOMERS' ? 'CUSTOMER' : 'VENDOR'"
      :initial-data="selectedContact"
      @close="closeMeta"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import EmptyState from '@/components/common/EmptyState.vue'
  import SearchInput from '@/components/common/SearchInput.vue'
  import PaginationControl from '@/components/common/PaginationControl.vue'
  import CreateContactModal from '@/components/contacts/CreateContactModal.vue'
  import { PencilSquareIcon, TrashIcon } from '@heroicons/vue/20/solid'

  definePageMeta({
    layout: 'dashboard',
  })
  const contactStore = useContactStore()
  const activeTab = ref('CUSTOMERS')
  const toast = useToast()

  const loading = computed(() => contactStore.loading)
  const currentList = computed(() => {
    return activeTab.value === 'CUSTOMERS' ? contactStore.customers : contactStore.vendors
  })

  // Pagination & Search State
  const page = ref(1)
  const limit = ref(10)
  const search = ref('')
  const total = ref(0)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      if (activeTab.value === 'CUSTOMERS') {
        await contactStore.deleteCustomer(id)
      } else {
        await contactStore.deleteVendor(id)
      }
      fetchData()
      toast.success('Berhasil', 'Kontak berhasil dihapus')
    } catch (err: any) {
      toast.apiError(err, 'Gagal Menghapus Kontak')
    }
  }

  const fetchData = async () => {
    let data
    if (activeTab.value === 'CUSTOMERS') {
      data = await contactStore.fetchCustomers({
        limit: limit.value,
        offset: (page.value - 1) * limit.value,
        search: search.value,
      })
    } else {
      data = await contactStore.fetchVendors({
        limit: limit.value,
        offset: (page.value - 1) * limit.value,
        search: search.value,
      })
    }

    if (data) {
      total.value = data.total
    }
  }

  const switchTab = (tab: string) => {
    activeTab.value = tab
    search.value = ''
    page.value = 1
    fetchData()
  }

  const handleSearch = (val: string) => {
    search.value = val
    page.value = 1
    fetchData()
  }

  const changePage = (newPage: number) => {
    page.value = newPage
    fetchData()
  }

  watch(limit, () => {
    page.value = 1
    fetchData()
  })

  onMounted(() => {
    fetchData()
  })

  const showCreateModal = ref(false)
  const selectedContact = ref<any>(null)

  const openCreateModal = () => {
    selectedContact.value = null // Reset for create
    showCreateModal.value = true
  }

  const handleEdit = (item: any) => {
    selectedContact.value = item
    showCreateModal.value = true
  }

  const closeMeta = () => {
    showCreateModal.value = false
    selectedContact.value = null
  }

  const handleCreateSuccess = () => {
    fetchData()
  }
</script>
