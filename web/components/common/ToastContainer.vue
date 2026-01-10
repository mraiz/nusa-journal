<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] space-y-3 max-w-md w-full pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="glass-card p-4 flex gap-3 items-start shadow-soft-lg pointer-events-auto animate-slide-left"
          :class="toastClass(toast.type)"
        >
          <!-- Icon -->
          <div
            class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            :class="iconBgClass(toast.type)"
          >
            <!-- Success -->
            <svg
              v-if="toast.type === 'success'"
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <!-- Error -->
            <svg
              v-else-if="toast.type === 'error'"
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <!-- Warning -->
            <svg
              v-else-if="toast.type === 'warning'"
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <!-- Info -->
            <svg
              v-else
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-neutral-800 text-sm">{{ toast.title }}</h4>
            <p v-if="toast.message" class="text-sm text-neutral-600 mt-0.5 break-words">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            @click="remove(toast.id)"
            class="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  const { toasts, remove } = useToast()

  const toastClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500'
      case 'error':
        return 'border-l-4 border-l-red-500'
      case 'warning':
        return 'border-l-4 border-l-amber-500'
      case 'info':
        return 'border-l-4 border-l-blue-500'
      default:
        return ''
    }
  }

  const iconBgClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-500 to-green-600'
      case 'error':
        return 'bg-gradient-to-br from-red-500 to-red-600'
      case 'warning':
        return 'bg-gradient-to-br from-amber-500 to-amber-600'
      case 'info':
        return 'bg-gradient-to-br from-blue-500 to-blue-600'
      default:
        return 'bg-neutral-500'
    }
  }
</script>

<style scoped>
  .toast-enter-active {
    transition: all 0.3s ease-out;
  }
  .toast-leave-active {
    transition: all 0.2s ease-in;
  }
  .toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }
  .toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
  .toast-move {
    transition: transform 0.3s ease;
  }

  @keyframes slide-left {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  .animate-slide-left {
    animation: slide-left 0.3s ease-out;
  }
</style>
