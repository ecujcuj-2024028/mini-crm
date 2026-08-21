<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'active' // 'active', 'paused', 'completed', 'high', 'medium', 'low', 'admin', 'user'
  }
});

const badgeStyle = computed(() => {
  switch (props.variant) {
    case 'ACTIVE':
    case 'active':
      return 'bg-[#5C7E8F] text-white';
    case 'PAUSED':
    case 'paused':
      return 'bg-[#A2A2A2] text-white';
    case 'COMPLETED':
    case 'completed':
      return 'bg-[#263840] text-white';
    case 'HIGH':
    case 'high':
      return 'bg-[#263840] text-white';
    case 'MEDIUM':
    case 'medium':
      return 'bg-[#5C7E8F] text-white';
    case 'LOW':
    case 'low':
      return 'bg-[#C7C7C7] text-[#4A4A4A]';
    case 'ADMIN':
    case 'admin':
      return 'bg-[#263840] text-white';
    case 'USER':
    case 'user':
      return 'bg-[#E8E8E8] text-[#4A4A4A]';
    default:
      return 'bg-[#5C7E8F] text-white';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase',
      badgeStyle
    ]"
  >
    <slot />
  </span>
</template>
