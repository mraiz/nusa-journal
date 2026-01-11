<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="close"
      ></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"
        >&#8203;</span
      >

      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in"
      >
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg
                class="h-6 w-6 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Gabung Perusahaan
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 mb-4">
                  Masukkan ID Perusahaan (Slug) untuk bergabung. Permintaan Anda akan dikirim ke
                  admin perusahaan tersebut.
                </p>

                <div class="space-y-4">
                  <div>
                    <label
                      for="company-slug"
                      class="block text-sm font-medium text-neutral-700 mb-1"
                      >ID Perusahaan (Slug)</label
                    >
                    <input
                      type="text"
                      id="company-slug"
                      v-model="slug"
                      class="block w-full rounded-lg border-2 border-neutral-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-3 bg-neutral-50 focus:bg-white transition-all duration-200 hover:border-neutral-300"
                      placeholder="contoh: pt-media-antar-nusa"
                      @keyup.enter="handleSubmit"
                      :disabled="loading"
                    />
                    <p class="text-xs text-neutral-500 mt-1">
                      Gunakan huruf kecil dan tanda hubung (-).
                    </p>
                  </div>
                </div>

                <div
                  v-if="error"
                  class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start"
                >
                  <svg
                    class="w-5 h-5 mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{{ error }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed btn"
            :disabled="loading || !slug"
            @click="handleSubmit"
          >
            <span v-if="loading" class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Memproses...
            </span>
            <span v-else>Gabung Sekarang</span>
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            @click="close"
            :disabled="loading"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['close', 'success'])

  const slug = ref('')
  const loading = ref(false)
  const error = ref('')
  const { $api } = useNuxtApp()

  const close = () => {
    slug.value = ''
    error.value = ''
    emit('close')
  }

  const handleSubmit = async () => {
    if (!slug.value || loading.value) return

    loading.value = true
    error.value = ''

    try {
      // Validate slug regex
      if (!/^[a-z0-9-]+$/.test(slug.value)) {
        throw new Error(
          'Format ID Perusahaan tidak valid. Gunakan huruf kecil, angka, dan tanda hubung.'
        )
      }

      const response = await $api.post('/companies/join', {
        slug: slug.value,
      })

      emit('success', response.data)
      close()
    } catch (err: any) {
      console.error('Join failed:', err)
      error.value =
        err.response?.data?.message || err.message || 'Gagal bergabung dengan perusahaan'
    } finally {
      loading.value = false
    }
  }
</script>
