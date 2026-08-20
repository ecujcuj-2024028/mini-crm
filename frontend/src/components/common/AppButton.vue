<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary' // 'primary', 'secondary', 'danger', 'outline', 'ghost'
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-[#5C7E8F] hover:bg-[#3D5A66] text-white shadow-sm';
    case 'secondary':
      return 'bg-[#263840] hover:bg-[#1C2A31] text-white shadow-sm';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white shadow-sm';
    case 'outline':
      return 'border border-[#C7C7C7] bg-white text-[#4A4A4A] hover:bg-[#F3F6F7]';
    case 'ghost':
      return 'bg-transparent text-[#5C7E8F] hover:bg-[#F3F6F7]';
    default:
      return 'bg-[#5C7E8F] hover:bg-[#3D5A66] text-white';
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
      variantClasses,
      fullWidth ? 'w-full' : ''
    ]"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>
