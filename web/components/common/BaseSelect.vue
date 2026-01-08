<template>
  <div class="relative" ref="container">
    <label v-if="label" class="block text-xs font-semibold text-neutral-500 uppercase mb-1">
      {{ label }}
    </label>
    
    <!-- Trigger Button -->
    <button 
      type="button"
      @click="toggle"
      :disabled="disabled"
      class="w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm text-left flex items-center justify-between transition-all duration-200 outline-none"
      :class="[
        isOpen ? 'border-primary-400 ring-2 ring-primary-400/20' : 'border-neutral-300 hover:border-neutral-400',
        disabled ? 'bg-neutral-50 cursor-not-allowed opacity-75' : 'cursor-pointer'
      ]"
    >
      <span v-if="selectedOption" class="text-neutral-900 truncate block">{{ selectedOption.label }}</span>
      <span v-else class="text-neutral-400">{{ placeholder || 'Select option' }}</span>
      
      <svg 
        class="w-5 h-5 text-neutral-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-1"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-1"
    >
      <div 
        v-if="isOpen" 
        class="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-neutral-100 max-h-60 overflow-auto focus:outline-none py-1 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
      >
        <div 
            v-for="option in options" 
            :key="option.value"
            @click="select(option)"
            class="px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 flex items-center justify-between group"
            :class="[
                isSelected(option) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700 hover:bg-neutral-50'
            ]"
        >
          <span>{{ option.label }}</span>
          <svg v-if="isSelected(option)" class="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div v-if="options.length === 0" class="px-4 py-3 text-sm text-neutral-400 text-center">
            No options available
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

interface Option {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue: string | number | null | undefined
  options: Option[]
  label?: string
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const container = ref(null)
const isOpen = ref(false)

onClickOutside(container, () => {
    isOpen.value = false
})

const toggle = () => {
    if (!props.disabled) {
        isOpen.value = !isOpen.value
    }
}

const selectedOption = computed(() => {
    return props.options.find(o => o.value === props.modelValue)
})

const isSelected = (option: Option) => {
    return props.modelValue === option.value
}

const select = (option: Option) => {
    emit('update:modelValue', option.value)
    emit('change', option.value)
    isOpen.value = false
}
</script>

<style scoped>
/* Custom Scrollbar for dropdown */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #e5e5e5;
  border-radius: 20px;
}
</style>
