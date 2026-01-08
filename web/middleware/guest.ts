export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // If user is already logged in, redirect to companies or dashboard
  if (authStore.isAuthenticated) {
    return navigateTo('/companies')
  }
})
