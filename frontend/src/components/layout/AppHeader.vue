<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import AppBadge from '../common/AppBadge.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isDropdownOpen = ref(false);
const dropdownRef = ref(null);

const pageTitle = computed(() => {
  switch (route.name) {
    case 'Dashboard':
      return 'Dashboard';
    case 'Users':
      return 'Gestión de Usuarios';
    case 'Projects':
    case 'ProjectDetail':
      return 'Proyectos';
    case 'Tasks':
      return 'Tablero de Tareas';
    case 'Profile':
      return 'Mi Perfil';
    default:
      return 'Dashboard';
  }
});

// Formatear la fecha actual en español
const currentDateFormatted = computed(() => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date().toLocaleDateString('es-ES', options);
});

// Iniciales del usuario
const userInitials = computed(() => {
  if (!authStore.user?.name) return 'U';
  return authStore.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const goToProfile = () => {
  closeDropdown();
  router.push('/profile');
};

const handleLogout = () => {
  closeDropdown();
  authStore.logout();
  router.push('/login');
};

// Listener para cerrar el menu al hacer clic fuera de el
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header class="bg-[#F3F6F7] border-b border-[#E4EAED] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
    <!-- Titulo de la Vista y Fecha -->
    <div>
      <div class="text-[11px] font-mono text-[#6E6E6E] uppercase tracking-wider mb-0.5">
        {{ currentDateFormatted }}
      </div>
      <h1 class="text-xl sm:text-2xl font-bold text-[#263840] tracking-tight">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Info Usuario & Avatar Redondo con Menu Desplegable -->
    <div ref="dropdownRef" class="relative flex items-center space-x-3">
      <!-- Badge de Rol (Admin / User) -->
      <AppBadge :variant="authStore.isAdmin ? 'ADMIN' : 'USER'" class="hidden sm:inline-flex">
        {{ authStore.user?.role }}
      </AppBadge>

      <!-- Boton Avatar Redondo Rediseñado -->
      <button
        @click.stop="toggleDropdown"
        type="button"
        class="flex items-center space-x-2 p-1.5 rounded-full hover:bg-black/5 transition-colors focus:outline-none cursor-pointer group"
        title="Opciones de usuario"
      >
        <!-- Avatar Redondo -->
        <div class="w-9 h-9 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border-2 border-white group-hover:bg-[#263840] transition-colors">
          {{ userInitials }}
        </div>
        <!-- Nombre de Usuario (Desktop) -->
        <span class="text-sm font-semibold text-[#263840] hidden sm:inline">
          {{ authStore.user?.name }}
        </span>
        <!-- Flecha Dropdown -->
        <svg class="w-4 h-4 text-[#6E6E6E] hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Menu Elegante -->
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E4EAED] py-2 z-50 transform origin-top-right transition-all duration-150"
      >
        <!-- Cabecera del Dropdown con Datos de Usuario -->
        <div class="px-4 py-3 border-b border-[#E4EAED]">
          <p class="text-xs font-bold text-[#263840] truncate">
            {{ authStore.user?.name }}
          </p>
          <p class="text-[11px] text-[#6E6E6E] truncate mt-0.5">
            {{ authStore.user?.email }}
          </p>
          <div class="mt-2 sm:hidden">
            <AppBadge :variant="authStore.isAdmin ? 'ADMIN' : 'USER'">
              {{ authStore.user?.role }}
            </AppBadge>
          </div>
        </div>

        <!-- Opciones del Menu -->
        <div class="py-1">
          <!-- Opcion 1: Mi Perfil -->
          <button
            @click="goToProfile"
            type="button"
            class="w-full text-left px-4 py-2.5 text-xs font-medium text-[#4A4A4A] hover:bg-[#F3F6F7] hover:text-[#263840] flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Mi Perfil</span>
          </button>

          <!-- Opcion 2: Cerrar Sesión -->
          <button
            @click="handleLogout"
            type="button"
            class="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2.5 transition-colors cursor-pointer border-t border-[#E4EAED] mt-1"
          >
            <svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
