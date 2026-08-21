<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../stores/user.store';
import { useAuthStore } from '../../stores/auth.store';
import { useToastStore } from '../../stores/toast.store';
import AppButton from '../../components/common/AppButton.vue';
import AppBadge from '../../components/common/AppBadge.vue';
import AppPagination from '../../components/common/AppPagination.vue';
import AppConfirmModal from '../../components/common/AppConfirmModal.vue';
import UserModal from '../../components/users/UserModal.vue';
import ResetPasswordModal from '../../components/users/ResetPasswordModal.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

// Filtros Locales
const searchInput = ref('');
const selectedRole = ref('');

// Modales
const showUserModal = ref(false);
const showResetModal = ref(false);
const showConfirmModal = ref(false);

const selectedUser = ref(null);
const userToToggle = ref(null);

onMounted(() => {
  fetchUsers();
});

const fetchUsers = (page = 1) => {
  userStore.fetchUsers({
    search: searchInput.value,
    role: selectedRole.value,
    page
  });
};

// Búsqueda y filtrado
const handleSearch = () => {
  fetchUsers(1);
};

const clearFilters = () => {
  searchInput.value = '';
  selectedRole.value = '';
  fetchUsers(1);
};

// Cambiar página
const handlePageChange = (newPage) => {
  fetchUsers(newPage);
};

// Abrir modal crear
const openCreateModal = () => {
  selectedUser.value = null;
  showUserModal.value = true;
};

// Abrir modal editar
const openEditModal = (user) => {
  selectedUser.value = user;
  showUserModal.value = true;
};

// Abrir modal resetear clave
const openResetPasswordModal = (user) => {
  selectedUser.value = user;
  showResetModal.value = true;
};

// Abrir confirmación desactivar / activar usuario
const promptToggleUser = (user) => {
  userToToggle.value = user;
  showConfirmModal.value = true;
};

// Confirmar desactivar / activar
const handleConfirmToggle = async () => {
  if (!userToToggle.value) return;

  const isDeleting = userToToggle.value.isActive;
  try {
    if (isDeleting) {
      await userStore.deleteUser(userToToggle.value.id);
      toastStore.addToast({ title: 'Usuario Desactivado', message: 'El usuario fue desactivado correctamente.', type: 'info' });
    } else {
      await userStore.restoreUser(userToToggle.value.id);
      toastStore.addToast({ title: 'Usuario Restaurado', message: 'El usuario fue reactivado exitosamente.', type: 'info' });
    }
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo cambiar el estado del usuario.', type: 'danger' });
  } finally {
    showConfirmModal.value = false;
    userToToggle.value = null;
  }
};

// Guardar usuario (Crear / Editar)
const handleSaveUser = async (payload) => {
  try {
    if (selectedUser.value) {
      await userStore.updateUser(selectedUser.value.id, payload);
      toastStore.addToast({ title: 'Usuario Actualizado', message: 'Los cambios fueron guardados.', type: 'info' });
    } else {
      await userStore.createUser(payload);
      toastStore.addToast({ title: 'Usuario Creado', message: 'El nuevo usuario fue registrado con éxito.', type: 'info' });
    }
    showUserModal.value = false;
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo guardar el usuario.', type: 'danger' });
  }
};

// Restablecer contraseña
const handleResetPassword = async ({ userId, newPassword }) => {
  try {
    await userStore.resetPassword(userId, newPassword);
    toastStore.addToast({ title: 'Contraseña Actualizada', message: 'La contraseña fue restablecida con éxito.', type: 'info' });
    showResetModal.value = false;
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo restablecer la contraseña.', type: 'danger' });
  }
};

// Iniciales del usuario
const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};
</script>

<template>
  <div class="space-y-6">
    <!-- Subtitulo Descriptivo y Boton Nuevo Usuario -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p class="text-xs sm:text-sm text-[#6E6E6E] dark:text-[#A2B3BC]">
        Administra los accesos, roles y contraseñas de la plataforma.
      </p>

      <AppButton
        @click="openCreateModal"
        variant="primary"
        class="shrink-0"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Nuevo Usuario</span>
      </AppButton>
    </div>

    <!-- Barra de Filtros y Busqueda en Tiempo Real -->
    <div class="bg-white dark:bg-[#1A2830] rounded-2xl p-4 shadow-sm border border-[#E4EAED] dark:border-[#2E3F49] flex flex-col md:flex-row items-center gap-3">
      <!-- Input de Busqueda en Tiempo Real con Boton X de Limpiar -->
      <div class="relative flex-1 w-full">
        <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A2A2A2] dark:text-[#5E717B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Buscar por nombre o correo..."
          class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] placeholder-[#A2A2A2] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        />
        <!-- Boton Limpiar dentro del Input -->
        <button
          v-if="searchInput"
          @click="searchInput = ''; handleSearch()"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2A2A2] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white transition-colors cursor-pointer"
          title="Limpiar texto"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Selector Filtro Rol -->
      <select
        v-model="selectedRole"
        @change="handleSearch"
        class="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
      >
        <option value="">Todos los roles</option>
        <option value="ADMIN">Admin</option>
        <option value="USER">Usuario</option>
      </select>

      <!-- Botones Filtrar y Limpiar -->
      <div class="flex items-center space-x-2 w-full md:w-auto shrink-0">
        <AppButton
          @click="handleSearch"
          variant="secondary"
          class="flex-1 md:flex-none"
        >
          Filtrar
        </AppButton>
        <AppButton
          v-if="searchInput || selectedRole"
          @click="clearFilters"
          variant="outline"
          class="flex-1 md:flex-none"
          title="Limpiar todos los filtros"
        >
          Limpiar
        </AppButton>
      </div>
    </div>

    <!-- Tabla de Usuarios Paginada -->
    <div class="bg-white dark:bg-[#1A2830] rounded-3xl shadow-sm border border-[#E4EAED] dark:border-[#2E3F49] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#F3F6F7] dark:bg-[#121E24] border-b border-[#E4EAED] dark:border-[#2E3F49] text-[11px] font-mono uppercase tracking-wider text-[#6E6E6E] dark:text-[#A2B3BC]">
              <th class="py-3.5 px-6 font-semibold">USUARIO</th>
              <th class="py-3.5 px-6 font-semibold">ROL</th>
              <th class="py-3.5 px-6 font-semibold">ESTADO</th>
              <th class="py-3.5 px-6 font-semibold text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E4EAED] dark:divide-[#2E3F49] text-sm">
            <tr v-if="userStore.loading" class="text-center py-8">
              <td colspan="4" class="p-8 text-[#6E6E6E] dark:text-[#A2B3BC]">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="userStore.users.length === 0" class="text-center py-8">
              <td colspan="4" class="p-8 text-[#6E6E6E] dark:text-[#A2B3BC]">No se encontraron usuarios.</td>
            </tr>
            <tr
              v-else
              v-for="user in userStore.users"
              :key="user.id"
              :class="['hover:bg-[#F3F6F7]/50 dark:hover:bg-[#263840]/50 transition-colors', !user.isActive ? 'opacity-60 bg-gray-50 dark:bg-gray-900/50' : '']"
            >
              <!-- Columna Usuario (Avatar + Nombre + Email) -->
              <td class="py-4 px-6">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <p class="font-bold text-[#263840] dark:text-[#F3F6F7] leading-tight">
                      {{ user.name }}
                    </p>
                    <p class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC]">
                      {{ user.email }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Columna Rol -->
              <td class="py-4 px-6 font-medium text-[#4A4A4A] dark:text-[#D4DDE2]">
                {{ user.role === 'ADMIN' ? 'Admin' : 'Usuario' }}
              </td>

              <!-- Columna Estado Badge -->
              <td class="py-4 px-6">
                <AppBadge :variant="user.isActive ? 'active' : 'paused'">
                  {{ user.isActive ? 'Activo' : 'Inactivo' }}
                </AppBadge>
              </td>

              <!-- Columna Acciones -->
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end space-x-2">
                  <!-- Boton Editar -->
                  <button
                    @click="openEditModal(user)"
                    type="button"
                    title="Editar usuario"
                    class="w-8 h-8 rounded-lg bg-[#F3F6F7] dark:bg-[#121E24] hover:bg-[#E4EAED] dark:hover:bg-[#263840] text-[#5C7E8F] dark:text-[#8CA7B3] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <!-- Boton Resetear Clave -->
                  <button
                    @click="openResetPasswordModal(user)"
                    type="button"
                    title="Restablecer contraseña"
                    class="w-8 h-8 rounded-lg bg-[#F3F6F7] dark:bg-[#121E24] hover:bg-[#E4EAED] dark:hover:bg-[#263840] text-[#263840] dark:text-[#F3F6F7] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </button>

                  <!-- Boton Desactivar / Restaurar -->
                  <button
                    @click="promptToggleUser(user)"
                    type="button"
                    :title="user.isActive ? 'Desactivar usuario' : 'Restaurar usuario'"
                    :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                      user.isActive
                        ? 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                    ]"
                  >
                    <svg v-if="user.isActive" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pie de Pagina con Paginacion -->
      <div v-if="userStore.totalPages > 1" class="border-t border-[#E4EAED] dark:border-[#2E3F49]">
        <AppPagination
          :page="userStore.page"
          :totalPages="userStore.totalPages"
          :totalItems="userStore.total"
          :itemsPerPage="10"
          @changePage="handlePageChange"
        />
      </div>
    </div>

    <!-- Modales -->
    <UserModal
      :show="showUserModal"
      :user="selectedUser"
      :loading="userStore.loading"
      @close="showUserModal = false"
      @save="handleSaveUser"
    />

    <ResetPasswordModal
      :show="showResetModal"
      :user="selectedUser"
      :loading="userStore.loading"
      @close="showResetModal = false"
      @reset="handleResetPassword"
    />

    <AppConfirmModal
      :show="showConfirmModal"
      :title="userToToggle?.isActive ? 'Desactivar Usuario' : 'Restaurar Usuario'"
      :message="userToToggle?.isActive ? `¿Estás seguro de que deseas desactivar la cuenta de ${userToToggle?.name}?` : `¿Deseas reactivar el acceso de ${userToToggle?.name}?`"
      :confirmText="userToToggle?.isActive ? 'Desactivar' : 'Restaurar'"
      :variant="userToToggle?.isActive ? 'danger' : 'primary'"
      :loading="userStore.loading"
      @close="showConfirmModal = false"
      @confirm="handleConfirmToggle"
    />
  </div>
</template>
