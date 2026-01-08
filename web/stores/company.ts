export const useCompanyStore = defineStore('company', () => {
  const { $api } = useNuxtApp()
  const loading = ref(false)
  const companies = ref<any[]>([])
  const currentCompany = ref<any>(null)

  // Fetch user's companies
  const fetchCompanies = async () => {
    loading.value = true
    try {
      const data = await $api('/companies')
      companies.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Create new company
  const createCompany = async (payload: { name: string; slug: string; plan?: string }) => {
    loading.value = true
    try {
      const data = await $api('/companies', {
        method: 'POST',
        body: payload,
      })
      await fetchCompanies() // Refresh list
      return data
    } finally {
      loading.value = false
    }
  }

  // Select company (set as current)
  const selectCompany = async (companySlug: string) => {
    loading.value = true
    try {
      const data = await $api(`/${companySlug}/company`)
      currentCompany.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  const companyUsers = ref<any[]>([])

  // Fetch company users
  const fetchCompanyUsers = async (slug: string) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/company/users`)
      companyUsers.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // Invite user
  const inviteUser = async (slug: string, email: string, role: string) => {
    loading.value = true
    try {
      const data = await $api(`/${slug}/company/invite`, {
        method: 'POST',
        body: { email, role }
      })
      await fetchCompanyUsers(slug)
      return data
    } finally {
      loading.value = false
    }
  }

  // Remove user
  const removeUser = async (slug: string, userId: string) => {
    loading.value = true
    try {
      await $api(`/${slug}/company/users/${userId}`, {
        method: 'DELETE'
      })
      await fetchCompanyUsers(slug)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    companies,
    currentCompany,
    companyUsers,
    fetchCompanies,
    createCompany,
    selectCompany,
    fetchCompanyUsers,
    inviteUser,
    removeUser
  }
})
