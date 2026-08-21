<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'U';
  return authStore.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <aside class="w-64 bg-[#263840] dark:bg-[#121E24] text-white flex flex-col justify-between h-screen sticky top-0 border-r border-[#3D5A66]/30 dark:border-[#2E3F49] select-none z-30 transition-colors duration-200">
    <!-- Seccion Superior: Logo y Menu de Navegacion -->
    <div>
      <!-- Logo Superior  -->
      <div class="p-6 flex items-center justify-between border-b border-[#3D5A66]/40 dark:border-[#2E3F49]">
        <span class="text-xl font-bold tracking-tight text-white">Mini-CRM</span>

        <!-- Botón Modo Oscuro / Claro en el Logo -->
        <button
          @click="themeStore.toggleTheme"
          type="button"
          class="p-1.5 rounded-lg bg-[#3D5A66]/30 hover:bg-[#3D5A66]/60 text-white transition-colors cursor-pointer"
          :title="themeStore.isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
        >
          <svg v-if="themeStore.isDark" class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-4 h-4 text-[#8CA7B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>

      <!-- Links de Navegacion Principal -->
      <nav class="p-4 space-y-1.5 mt-2">
        <!-- Dashboard Link -->
        <router-link
          to="/dashboard"
          :class="[
            'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            route.path === '/dashboard'
              ? 'bg-[#5C7E8F] text-white font-semibold shadow-sm'
              : 'text-[#C4D3D9] hover:bg-[#3D5A66]/50 hover:text-white'
          ]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Dashboard</span>
        </router-link>

        <!-- Usuarios Link (Exclusivo Administradores) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/users"
          :class="[
            'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            route.path.startsWith('/users')
              ? 'bg-[#5C7E8F] text-white font-semibold shadow-sm'
              : 'text-[#C4D3D9] hover:bg-[#3D5A66]/50 hover:text-white'
          ]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Usuarios</span>
        </router-link>

        <!-- Proyectos Link -->
        <router-link
          to="/projects"
          :class="[
            'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            route.path.startsWith('/projects')
              ? 'bg-[#5C7E8F] text-white font-semibold shadow-sm'
              : 'text-[#C4D3D9] hover:bg-[#3D5A66]/50 hover:text-white'
          ]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Proyectos</span>
        </router-link>

        <!-- Tareas Link -->
        <router-link
          to="/tasks"
          :class="[
            'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            route.path.startsWith('/tasks')
              ? 'bg-[#5C7E8F] text-white font-semibold shadow-sm'
              : 'text-[#C4D3D9] hover:bg-[#3D5A66]/50 hover:text-white'
          ]"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Tareas</span>
        </router-link>
      </nav>
    </div>

    <!-- Seccion Inferior: Perfil de Usuario & Cierre de Sesion -->
    <div class="p-4 border-t border-[#3D5A66]/40 dark:border-[#2E3F49]">
      <div class="flex items-center justify-between p-2 rounded-xl bg-[#3D5A66]/30 dark:bg-[#1A2830]">
        <router-link to="/profile" class="flex items-center space-x-3 min-w-0 hover:opacity-90 transition-opacity">
          <div class="w-9 h-9 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#8CA7B3]/40">
            {{ userInitials }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-white truncate leading-tight">
              {{ authStore.user?.name }}
            </p>
            <p class="text-[10px] text-[#C4D3D9] truncate">
              {{ authStore.user?.email }}
            </p>
          </div>
        </router-link>

        <!-- Boton Logout -->
        <button
          @click="handleLogout"
          type="button"
          title="Cerrar sesión"
          class="w-8 h-8 rounded-lg bg-transparent hover:bg-red-500/20 text-[#C4D3D9] hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
        >
          <svg class="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
