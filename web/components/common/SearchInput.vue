<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
      <MagnifyingGlassIcon class="h-5 w-5 text-slate-400" aria-hidden="true" />
    </div>
    <input
      type="text"
      :value="modelValue"
      @input="handleInput"
      :placeholder="placeholder"
      class="input pl-10 relative z-0"
    />
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  debounce?: number
}>()

const emit = defineEmits(['update:modelValue', 'search'])

const debouncedEmit = useDebounceFn((value: string) => {
    emit('search', value)
}, props.debounce || 300)

const handleInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update:modelValue', value)
    debouncedEmit(value)
}
</script>
