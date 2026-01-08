<template>
  <div class="flex flex-col md:flex-row items-center justify-between border-t border-neutral-200/50 px-6 py-4 gap-4">
    
    <!-- Mobile Navigation -->
    <div class="flex flex-1 justify-between sm:hidden w-full">
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage <= 1"
        class="relative inline-flex items-center rounded-xl bg-white/80 border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm backdrop-blur-sm"
      >
        Previous
      </button>
      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage >= lastPage"
        class="relative ml-3 inline-flex items-center rounded-xl bg-white/80 border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm backdrop-blur-sm"
      >
        Next
      </button>
    </div>
    
    <!-- Desktop Navigation -->
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
      
      <!-- Info Text -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-neutral-500">
           Showing <span class="font-bold text-neutral-800">{{ from }}</span> - <span class="font-bold text-neutral-800">{{ to }}</span> of <span class="font-bold text-neutral-800">{{ total }}</span>
        </span>
      </div>
      
      <div class="flex items-center gap-6">
        
        <!-- Limit Selector -->
        <div class="flex items-center gap-2 bg-neutral-100/50 rounded-lg px-2 py-1 border border-neutral-200/50">
            <span class="text-xs text-neutral-500 font-medium pl-1">Rows:</span>
            <select :value="limit" @change="changeLimit($event)" class="text-sm bg-transparent border-none rounded focus:ring-0 text-neutral-700 font-semibold py-1 pr-8 pl-1 cursor-pointer hover:text-primary-600 transition-colors">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
            </select>
        </div>

        <!-- Page Controls -->
        <nav class="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-white/60 backdrop-blur-md p-1 border border-neutral-200/60" aria-label="Pagination">
          
          <!-- Prev -->
          <button 
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center justify-center rounded-lg px-2 w-9 h-9 text-neutral-400 hover:text-primary-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all focus:z-20 focus:outline-offset-0"
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Pages -->
          <template v-for="(page, index) in visiblePages" :key="index">
            <button 
                v-if="page !== '...'"
                @click="changePage(page)"
                :class="[
                    page === currentPage 
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' 
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-600',
                    'relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold transition-all mx-0.5'
                ]"
            >
                {{ page }}
            </button>
            <span v-else class="relative inline-flex items-center justify-center px-2 text-sm font-medium text-neutral-400">
                ...
            </span>
          </template>

          <!-- Next -->
          <button 
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= lastPage"
            class="relative inline-flex items-center justify-center rounded-lg px-2 w-9 h-9 text-neutral-400 hover:text-primary-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all focus:z-20 focus:outline-offset-0"
          >
            <span class="sr-only">Next</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    currentPage: number;
    lastPage: number;
    total: number;
    limit: number;
}>()

const emit = defineEmits(['change-page', 'change-limit'])

const from = computed(() => ((props.currentPage - 1) * props.limit) + 1)
const to = computed(() => Math.min(props.currentPage * props.limit, props.total))

const visiblePages = computed(() => {
    const delta = 2
    const range = []
    const rangeWithDots: (number | string)[] = []
    let l

    range.push(1)

    if (props.lastPage <= 1) return range

    for (let i = props.currentPage - delta; i <= props.currentPage + delta; i++) {
        if (i < props.lastPage && i > 1) {
            range.push(i)
        }
    }
    range.push(props.lastPage)

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1)
            } else if (i - l !== 1) {
                rangeWithDots.push('...')
            }
        }
        rangeWithDots.push(i)
        l = i
    }

    return rangeWithDots
})

const changePage = (page: number | string) => {
    if (typeof page === 'number' && page >= 1 && page <= props.lastPage) {
        emit('change-page', page)
    }
}

const changeLimit = (event: any) => {
    emit('change-limit', Number(event.target.value))
}
</script>
