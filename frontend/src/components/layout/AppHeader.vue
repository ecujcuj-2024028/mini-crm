<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import AppBadge from '../common/AppBadge.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

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

const handleToggleTheme = (event) => {
  if (event) event.stopPropagation();
  themeStore.toggleTheme();
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

// Listener para cerrar el menú al hacer clic fuera
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
  <header class="bg-[#F3F6F7] dark:bg-[#121E24] border-b border-[#E4EAED] dark:border-[#263840] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
    <!-- Titulo de la Vista y Fecha -->
    <div>
      <div class="text-[11px] font-mono text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider mb-0.5">
        {{ currentDateFormatted }}
      </div>
      <h1 class="text-xl sm:text-2xl font-bold text-[#263840] dark:text-[#F3F6F7] tracking-tight">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Acciones Header: Toggle Switch Personalizado (Solido sin degradado) + Info Usuario & Dropdown -->
    <div ref="dropdownRef" class="relative flex items-center space-x-2 sm:space-x-3">
      <!-- Toggle Switch Personalizado de Apariencia Sol / Luna (Color sólido #5C7E8F sin degradados) -->
      <label class="inline-flex items-center relative cursor-pointer select-none scale-[0.65] sm:scale-75 origin-right">
        <input
          class="peer hidden"
          id="toggle"
          type="checkbox"
          :checked="themeStore.isDark"
          @change="handleToggleTheme"
        />
        <div
          class="relative w-[110px] h-[50px] bg-white peer-checked:bg-[#121E24] rounded-full after:absolute after:content-[''] after:w-[40px] after:h-[40px] after:bg-amber-400 peer-checked:after:bg-[#5C7E8F] after:rounded-full after:top-[5px] after:left-[5px] active:after:w-[50px] peer-checked:after:left-[105px] peer-checked:after:translate-x-[-100%] shadow-sm duration-300 after:duration-300 after:shadow-md border border-[#C7C7C7] dark:border-[#5C7E8F]"
        ></div>
        <!-- Icono Sol (Modo Claro) -->
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          data-name="Layer 1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          class="fill-white peer-checked:opacity-50 absolute w-6 h-6 left-[13px] pointer-events-none transition-opacity"
        >
          <path
            d="M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5ZM13,0h-2V5h2V0Zm0,19h-2v5h2v-5ZM5,11H0v2H5v-2Zm19,0h-5v2h5v-2Zm-2.81-6.78l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54ZM7.76,17.66l-1.41-1.41-3.54,3.54,1.41,1.41,3.54-3.54Zm0-11.31l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Zm13.44,13.44l-3.54-3.54-1.41,1.41,3.54,3.54,1.41-1.41Z"
          ></path>
        </svg>
        <!-- Icono Luna (Modo Oscuro) -->
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          data-name="Layer 1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          class="fill-slate-600 opacity-60 peer-checked:opacity-90 peer-checked:fill-white absolute w-6 h-6 right-[13px] pointer-events-none transition-all"
        >
          <path
            d="M12.009,24A12.067,12.067,0,0,1,.075,10.725,12.121,12.121,0,0,1,10.1.152a13,13,0,0,1,5.03.206,2.5,2.5,0,0,1,1.8,1.8,2.47,2.47,0,0,1-.7,2.425c-4.559,4.168-4.165,10.645.807,14.412h0a2.5,2.5,0,0,1-.7,4.319A13.875,13.875,0,0,1,12.009,24Zm.074-22a10.776,10.776,0,0,0-1.675.127,10.1,10.1,0,0,0-8.344,8.8A9.928,9.928,0,0,0,4.581,18.7a10.473,10.473,0,0,0,11.093,2.734.5.5,0,0,0,.138-.856h0C9.883,16.1,9.417,8.087,14.865,3.124a.459.459,0,0,0,.127-.465.491.491,0,0,0-.356-.362A10.68,10.68,0,0,0,12.083,2ZM20.5,12a1,1,0,0,1-.97-.757l-.358-1.43L17.74,9.428a1,1,0,0,1,.035-1.94l1.4-.325.351-1.406a1,1,0,0,1,1.94,0l.355,1.418,1.418.355a1,1,0,0,1,0,1.94l-1.418.355-.355,1.418A1,1,0,0,1,20.5,12ZM16,14a1,1,0,0,0,2,0A1,1,0,0,0,16,14Zm6,4a1,1,0,0,0,2,0A1,1,0,0,0,22,18Z"
          ></path>
        </svg>
      </label>

      <!-- Badge de Rol (Admin / User) -->
      <AppBadge :variant="authStore.isAdmin ? 'ADMIN' : 'USER'" class="hidden sm:inline-flex">
        {{ authStore.user?.role }}
      </AppBadge>

      <!-- Boton Avatar Redondo -->
      <button
        @click.stop="toggleDropdown"
        type="button"
        class="flex items-center space-x-2 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer group"
        title="Opciones de usuario"
      >
        <!-- Avatar Redondo -->
        <div class="w-9 h-9 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border-2 border-white dark:border-[#263840] group-hover:bg-[#263840] transition-colors">
          {{ userInitials }}
        </div>
        <!-- Nombre de Usuario (Desktop) -->
        <span class="text-sm font-semibold text-[#263840] dark:text-[#F3F6F7] hidden sm:inline">
          {{ authStore.user?.name }}
        </span>
        <!-- Flecha Dropdown -->
        <svg class="w-4 h-4 text-[#6E6E6E] dark:text-[#A2B3BC] hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Menu Elegante -->
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1A2830] rounded-2xl shadow-xl border border-[#E4EAED] dark:border-[#2E3F49] py-2 z-50 transform origin-top-right transition-all duration-150"
      >
        <!-- Cabecera del Dropdown con Datos de Usuario -->
        <div class="px-4 py-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <p class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] truncate">
            {{ authStore.user?.name }}
          </p>
          <p class="text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] truncate mt-0.5">
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
            class="w-full text-left px-4 py-2.5 text-xs font-medium text-[#4A4A4A] dark:text-[#D4DDE2] hover:bg-[#F3F6F7] dark:hover:bg-[#263840] hover:text-[#263840] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Mi Perfil</span>
          </button>

          <!-- Opcion 2: Alternar Modo Oscuro -->
          <button
            @click="handleToggleTheme"
            type="button"
            class="w-full text-left px-4 py-2.5 text-xs font-medium text-[#4A4A4A] dark:text-[#D4DDE2] hover:bg-[#F3F6F7] dark:hover:bg-[#263840] hover:text-[#263840] dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
          >
            <svg v-if="themeStore.isDark" class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>{{ themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
          </button>

          <!-- Opcion 3: Cerrar Sesión -->
          <button
            @click="handleLogout"
            type="button"
            class="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2.5 transition-colors cursor-pointer border-t border-[#E4EAED] dark:border-[#2E3F49] mt-1"
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
