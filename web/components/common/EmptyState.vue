<template>
  <div class="text-center py-16 px-4">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <span class="text-3xl">{{ icon }}</span>
    </div>
    <h3 class="text-lg font-medium text-slate-900 mb-1">{{ title }}</h3>
    <p class="text-slate-500 max-w-sm mx-auto mb-6">{{ description }}</p>
    
    <button 
        v-if="actionLabel" 
        @click="$emit('action')"
        class="btn btn-primary inline-flex items-center gap-2"
    >
        <PlusIcon class="h-5 w-5" aria-hidden="true" />
        {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/20/solid'

defineProps<{
    title: string
    description: string
    icon: string
    actionLabel?: string
}>()

defineEmits(['action'])
</script>
