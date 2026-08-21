<script setup>
import { computed } from 'vue';
import AppModal from './AppModal.vue';
import AppButton from './AppButton.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirmar Acción'
  },
  message: {
    type: String,
    default: '¿Estás seguro de que deseas realizar esta acción?'
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  variant: {
    type: String,
    default: 'danger' // 'danger', 'warning', 'primary'
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close', 'confirm']);

const iconContainerClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400';
    case 'warning':
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400';
    default:
      return 'bg-[#C4D3D9] dark:bg-[#2E3F49] text-[#263840] dark:text-[#F3F6F7]';
  }
});

const buttonVariant = computed(() => {
  return props.variant === 'danger' ? 'danger' : 'primary';
});
</script>

<template>
  <AppModal
    :show="show"
    :title="title"
    maxWidth="max-w-md"
    @close="$emit('close')"
  >
    <div class="flex items-start space-x-4">
      <!-- Icono Alerta -->
      <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5', iconContainerClass]">
        <svg v-if="variant === 'danger'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <!-- Contenido de Advertencia -->
      <div class="flex-1 min-w-0">
        <p class="text-sm text-[#6E6E6E] dark:text-[#A2B3BC] leading-relaxed">
          {{ message }}
        </p>
      </div>
    </div>

    <!-- Acciones del Modal -->
    <div class="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-[#E4EAED] dark:border-[#2E3F49]">
      <AppButton
        type="button"
        variant="outline"
        @click="$emit('close')"
      >
        {{ cancelText }}
      </AppButton>
      <AppButton
        type="button"
        :variant="buttonVariant"
        :loading="loading"
        @click="$emit('confirm')"
      >
        {{ confirmText }}
      </AppButton>
    </div>
  </AppModal>
</template>
