<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import AppBadge from '../common/AppBadge.vue';

const route = useRoute();
const authStore = useAuthStore();

const pageTitle = computed(() => {
  switch (route.name) {
    case 'Dashboard':
      return 'Dashboard';
    case 'Users':
      return 'Gestión de Usuarios';
    case 'Projects':
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
</script>

<template>
  <header class="bg-[#F3F6F7] border-b border-[#E4EAED] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
    <!-- Titulo de la Vista y Fecha -->
    <div>
      <div class="text-[11px] font-mono text-[#6E6E6E] uppercase tracking-wider mb-0.5">
        {{ currentDateFormatted }}
      </div>
      <h1 class="text-xl sm:text-2xl font-bold text-[#263840] tracking-tight">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Info Usuario y Badge de Rol (Enlace a Mi Perfil) -->
    <router-link to="/profile" class="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
      <AppBadge :variant="authStore.isAdmin ? 'ADMIN' : 'USER'">
        {{ authStore.user?.role }}
      </AppBadge>
      <span class="text-xs sm:text-sm font-semibold text-[#263840] hidden sm:inline">
        {{ authStore.user?.name }}
      </span>
      <!-- Icono de usuario para movil -->
      <div class="w-7 h-7 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-xs sm:hidden">
        {{ authStore.user?.name ? authStore.user.name[0].toUpperCase() : 'U' }}
      </div>
    </router-link>
  </header>
</template>
