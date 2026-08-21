<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import AppInput from '../../components/common/AppInput.vue';
import AppButton from '../../components/common/AppButton.vue';

const authStore = useAuthStore();

// Formularios
const profileForm = ref({
  name: '',
  email: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Mensajes de respuesta
const profileSuccess = ref('');
const profileError = ref('');
const passwordSuccess = ref('');
const passwordError = ref('');

const isUpdatingProfile = ref(false);
const isChangingPassword = ref(false);

// Evaluar dinámicamente si los campos del formulario de contraseña están llenos
const isPasswordFormFilled = computed(() => {
  return (
    passwordForm.value.currentPassword.trim().length > 0 &&
    passwordForm.value.newPassword.trim().length > 0 &&
    passwordForm.value.confirmPassword.trim().length > 0
  );
});

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchMe();
  }
  if (authStore.user) {
    profileForm.value.name = authStore.user.name || '';
    profileForm.value.email = authStore.user.email || '';
  }
});

// Guardar cambios del perfil (Nombre y Correo)
const handleUpdateProfile = async () => {
  profileSuccess.value = '';
  profileError.value = '';

  if (!profileForm.value.name.trim() || !profileForm.value.email.trim()) {
    profileError.value = 'El nombre y el correo electrónico son obligatorios.';
    return;
  }

  isUpdatingProfile.value = true;
  try {
    await authStore.updateProfile(profileForm.value.name, profileForm.value.email);
    profileSuccess.value = 'Perfil actualizado exitosamente.';
  } catch (err) {
    profileError.value = err.message || 'No se pudo actualizar el perfil.';
  } finally {
    isUpdatingProfile.value = false;
  }
};

// Cambiar contraseña
const handleChangePassword = async () => {
  passwordSuccess.value = '';
  passwordError.value = '';

  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    passwordError.value = 'Debes ingresar la contraseña actual y la nueva.';
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Las contraseñas no coinciden.';
    return;
  }

  isChangingPassword.value = true;
  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );
    passwordSuccess.value = 'Contraseña actualizada exitosamente.';
    passwordForm.value.currentPassword = '';
    passwordForm.value.newPassword = '';
    passwordForm.value.confirmPassword = '';
  } catch (err) {
    passwordError.value = err.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
  } finally {
    isChangingPassword.value = false;
  }
};
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Encabezado -->
    <div class="bg-white dark:bg-[#1A2830] p-6 rounded-3xl border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs">
      <div class="flex items-center space-x-4">
        <div class="w-14 h-14 rounded-2xl bg-[#5C7E8F] text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
          {{ authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U' }}
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-[#263840] dark:text-[#F3F6F7] tracking-tight">
            {{ authStore.user?.name || 'Perfil de Usuario' }}
          </h2>
          <div class="flex items-center space-x-2 mt-1">
            <span class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] font-medium">{{ authStore.user?.email }}</span>
            <span class="text-xs text-[#A2A2A2] dark:text-[#5E717B]">•</span>
            <span :class="[
              'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
              authStore.isAdmin ? 'bg-[#5C7E8F]/10 dark:bg-[#5C7E8F]/20 text-[#5C7E8F] dark:text-[#8CA7B3] border-[#5C7E8F]/30' : 'bg-[#263840]/10 dark:bg-[#263840]/40 text-[#263840] dark:text-[#D4DDE2] border-[#263840]/20'
            ]">
              {{ authStore.isAdmin ? 'Administrador' : 'Miembro' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid de Secciones: Información Personal + Cambio de Contraseña -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Sección 1: Información Personal -->
      <div class="bg-white dark:bg-[#1A2830] p-6 rounded-3xl border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs space-y-5">
        <div class="pb-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <h3 class="text-sm font-extrabold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider flex items-center space-x-2">
            <svg class="w-4 h-4 text-[#5C7E8F] dark:text-[#8CA7B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Información Personal</span>
          </h3>
          <p class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] mt-0.5">Actualiza tu nombre y correo electrónico.</p>
        </div>

        <!-- Mensajes de Alerta -->
        <div v-if="profileSuccess" class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold">
          {{ profileSuccess }}
        </div>
        <div v-if="profileError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold">
          {{ profileError }}
        </div>

        <form @submit.prevent="handleUpdateProfile" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider mb-1.5">
              Nombre Completo
            </label>
            <AppInput
              v-model="profileForm.name"
              type="text"
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <AppInput
              v-model="profileForm.email"
              type="email"
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div class="pt-2">
            <AppButton
              type="submit"
              variant="primary"
              class="w-full justify-center"
              :disabled="isUpdatingProfile"
            >
              {{ isUpdatingProfile ? 'Guardando...' : 'Guardar Perfil' }}
            </AppButton>
          </div>
        </form>
      </div>

      <!-- Sección 2: Seguridad & Cambio de Contraseña -->
      <div class="bg-white dark:bg-[#1A2830] p-6 rounded-3xl border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs space-y-5">
        <div class="pb-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <h3 class="text-sm font-extrabold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider flex items-center space-x-2">
            <svg class="w-4 h-4 text-[#5C7E8F] dark:text-[#8CA7B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>

            <span>Seguridad & Contraseña</span>
          </h3>
          <p class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] mt-0.5">Modifica tu contraseña de acceso.</p>
        </div>

        <!-- Mensajes de Alerta -->
        <div v-if="passwordSuccess" class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold">
          {{ passwordSuccess }}
        </div>
        <div v-if="passwordError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold">
          {{ passwordError }}
        </div>

        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider mb-1.5">
              Contraseña Actual
            </label>
            <AppInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider mb-1.5">
              Nueva Contraseña
            </label>
            <AppInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <AppInput
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="Repite la contraseña"
              required
            />
          </div>

          <div class="pt-2">
            <AppButton
              type="submit"
              :variant="isPasswordFormFilled ? 'primary' : 'outline'"
              class="w-full justify-center transition-all duration-300"
              :disabled="isChangingPassword"
            >
              {{ isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña' }}
            </AppButton>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>
