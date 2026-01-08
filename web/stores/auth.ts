import { defineStore } from 'pinia'
import type { User, LoginDto, RegisterDto, LoginResponse } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    loading: false,
  }),

  getters: {
    currentUser: (state) => state.user,
    userEmail: (state) => state.user?.email,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    async login(credentials: LoginDto) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api<LoginResponse>('/auth/login', {
          method: 'POST',
          body: credentials
        })
        
        this.user = response.user
        this.isAuthenticated = true
        
        // Save access token if returned (for client-side usage if needed, though we prefer cookies)
        // Store locally if needed, but mainly we rely on user state
        
        return response
      } finally {
        this.loading = false
      }
    },

    async register(data: RegisterDto) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        await $api('/auth/register', {
          method: 'POST',
          body: data
        })
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        const { $api } = useNuxtApp()
        await $api('/auth/logout', { method: 'POST' })
      } finally {
        this.user = null
        this.isAuthenticated = false
        navigateTo('/auth/login')
      }
    },

    async checkAuth() {
      // Avoid checking if already loading or (optional) if already authenticated to prevent redundant calls
      // But for "persistence" on reload, we need to check.
      try {
        const { $api } = useNuxtApp()
        // verify endpoint
        const user = await $api<User>('/auth/me')
        this.user = user
        this.isAuthenticated = true
      } catch (e) {
        console.error('[AuthStore] checkAuth failed:', e)
        this.user = null
        this.isAuthenticated = false
        // Silent fail is okay, just means not logged in
      }
    },
  },
})
