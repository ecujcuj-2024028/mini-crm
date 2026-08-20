<script setup>
import { ref, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'reset']);

const newPassword = ref('');

watch(
  () => props.show,
  (val) => {
    if (val) {
      newPassword.value = '';
    }
  }
);

const handleSubmit = () => {
  if (!newPassword.value) return;
  emit('reset', { userId: props.user?.id, newPassword: newPassword.value });
};
</script>

<template>
  <AppModal
    :show="show"
    :title="`Restablecer Contraseña: ${user?.name || ''}`"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <p class="text-xs text-[#6E6E6E]">
        Ingresa una nueva contraseña para el usuario <strong class="text-[#263840]">{{ user?.email }}</strong>.
      </p>

      <AppInput
        v-model="newPassword"
        type="password"
        label="Nueva contraseña"
        placeholder="••••••••"
        required
      />

      <!-- Acciones del Modal -->
      <div class="flex items-center justify-end space-x-3 pt-4 border-t border-[#E4EAED]">
        <AppButton
          type="button"
          variant="outline"
          @click="$emit('close')"
        >
          Cancelar
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          :loading="loading"
        >
          Actualizar Contraseña
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
