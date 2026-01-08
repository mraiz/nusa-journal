export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // If user is not logged in, redirect to login page
  if (!authStore.isAuthenticated && to.path !== '/auth/login') {
    return navigateTo('/auth/login')
  }
})
