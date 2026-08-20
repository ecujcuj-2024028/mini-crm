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

const emit = defineEmits(['close', 'save']);

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('USER');

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      name.value = newUser.name || '';
      email.value = newUser.email || '';
      password.value = '';
      role.value = newUser.role || 'USER';
    } else {
      name.value = '';
      email.value = '';
      password.value = '';
      role.value = 'USER';
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (!name.value || !email.value) return;
  if (!props.user && !password.value) return;

  const payload = {
    name: name.value,
    email: email.value,
    role: role.value
  };

  if (!props.user) {
    payload.password = password.value;
  }

  emit('save', payload);
};
</script>

<template>
  <AppModal
    :show="show"
    :title="user ? 'Editar Usuario' : 'Crear Nuevo Usuario'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="name"
        label="Nombre completo"
        placeholder="Juan Pérez"
        required
      />

      <AppInput
        v-model="email"
        type="email"
        label="Correo electrónico"
        placeholder="juan@empresa.com"
        required
      />

      <div v-if="!user">
        <AppInput
          v-model="password"
          type="password"
          label="Contraseña inicial"
          placeholder="••••••••"
          required
        />
      </div>

      <!-- Selector de Rol -->
      <div>
        <label class="block text-xs font-medium text-[#4A4A4A] mb-1.5">
          Rol de usuario
        </label>
        <select
          v-model="role"
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F] focus:border-[#5C7E8F] transition-colors"
        >
          <option value="USER">Usuario Estándar</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

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
          {{ user ? 'Guardar Cambios' : 'Crear Usuario' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
