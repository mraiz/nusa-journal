<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 w-64 bg-white/80 backdrop-blur-xl border-r border-neutral-200 z-30 transition-transform duration-300 lg:translate-x-0 print:hidden"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-neutral-100">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-soft"
          >
            NJ
          </div>
          <span class="font-bold text-neutral-800 tracking-tight">Nusa Journal</span>
        </div>
      </div>

      <!-- Company Switcher -->
      <div class="p-4">
        <div
          class="p-3 bg-primary-50 rounded-xl border border-primary-100 flex items-center gap-3 cursor-pointer hover:bg-primary-100 transition-colors"
        >
          <div
            class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 font-bold shadow-sm"
          >
            {{ companyInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-neutral-800 truncate">{{ currentCompany?.name }}</p>
          </div>
          <NuxtLink to="/companies" class="text-neutral-400 hover:text-primary-600">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)] pb-[60px]">
        <div v-for="(group, index) in menuGroups" :key="index" class="mb-6">
          <h3 class="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            {{ group.title }}
          </h3>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.path"
              :to="`/${route.params.companySlug}${item.path}`"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group"
              active-class="bg-primary-50 text-primary-700 shadow-sm"
              :class="
                $route.path.includes(item.path) && item.path !== ''
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              "
            >
              <span class="text-lg group-hover:scale-110 transition-transform duration-200">{{
                item.icon
              }}</span>
              {{ item.name }}
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- User Profile -->
      <div
        class="absolute bottom-0 left-0 w-full p-4 border-t border-neutral-100 bg-white/50 backdrop-blur-sm"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 font-bold overflow-hidden"
          >
            <img v-if="user?.avatar" :src="user.avatar" class="w-full h-full object-cover" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-neutral-800 truncate">{{ user?.name }}</p>
            <p class="text-xs text-neutral-500 truncate">{{ user?.email }}</p>
          </div>
          <button
            @click="handleLogout"
            class="text-neutral-400 hover:text-red-500 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-20 lg:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <!-- Main Content -->
    <main class="flex-1 lg:ml-64 min-h-screen transition-all duration-300 print:ml-0">
      <!-- Topbar -->
      <header
        class="h-16 px-8 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-neutral-200 lg:hidden sticky top-0 z-20"
      >
        <button @click="isSidebarOpen = true" class="text-neutral-500 hover:text-neutral-800">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span class="font-bold text-neutral-800">Nusa Journal</span>
        <div class="w-6"></div>
        <!-- Spacer -->
      </header>

      <!-- Page Content -->
      <div class="p-6 md:p-8 max-w-7xl mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()

  const isSidebarOpen = ref(false)
  const user = computed(() => authStore.user)
  const currentCompany = computed(() => companyStore.currentCompany)

  const userInitials = computed(() => {
    if (!user.value?.name) return 'U'
    return user.value.name.substring(0, 2).toUpperCase()
  })

  const companyInitials = computed(() => {
    if (!currentCompany.value?.name) return 'C'
    return currentCompany.value.name.substring(0, 2).toUpperCase()
  })

  const handleLogout = async () => {
    if (confirm('Logout?')) {
      await authStore.logout()
      router.push('/auth/login')
    }
  }

  const menuGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: '📊' },
        { name: 'Reports', path: '/reports', icon: '📈' },
      ],
    },
    {
      title: 'Transactions',
      items: [
        { name: 'Sales', path: '/sales', icon: '💰' },
        { name: 'Purchases', path: '/purchase', icon: '🛍️' },
        { name: 'Payments', path: '/payments', icon: '💳' },
      ],
    },
    {
      title: 'Master Data',
      items: [
        { name: 'Contacts', path: '/contacts', icon: '👥' },
        { name: 'Products', path: '/products', icon: '📦' },
      ],
    },
    {
      title: 'Accounting',
      items: [
        { name: 'Journals', path: '/journals', icon: '📓' },
        { name: 'Ledger', path: '/ledger', icon: '📒' },
        { name: 'Chart of Accounts', path: '/accounts', icon: '🗂️' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'Periods', path: '/periods', icon: '📅' },
        { name: 'Company', path: '/settings', icon: '⚙️' },
      ],
    },
  ]

  // Fetch company details if not present (e.g. on direct navigation)
  onMounted(async () => {
    const slug = route.params.companySlug as string
    if (slug && (!currentCompany.value || currentCompany.value.slug !== slug)) {
      try {
        await companyStore.selectCompany(slug)
      } catch (e) {
        router.push('/companies')
      }
    }
  })
</script>
