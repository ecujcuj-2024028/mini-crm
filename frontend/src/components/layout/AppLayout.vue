<script setup>
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
import AppToast from '../common/AppToast.vue';

const route = useRoute();
const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen flex bg-[#F3F6F7]">
    <!-- Sidebar Desktop (Oculto en pantallas moviles) -->
    <div class="hidden lg:block shrink-0">
      <AppSidebar />
    </div>

    <!-- Contenido Principal -->
    <div class="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
      <!-- Header Superior -->
      <AppHeader />

      <!-- Area de Vista Paginada -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>

    <!-- Barra de Navegacion Inferior para Moviles (Bottom Nav con opcion de Perfil) -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-[#263840] border-t border-[#3D5A66]/40 flex items-center justify-around py-2 px-2 z-40">
      <!-- Dashboard Link -->
      <router-link
        to="/dashboard"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
          route.path === '/dashboard' ? 'text-[#5C7E8F] font-bold' : 'text-[#C4D3D9]'
        ]"
      >
        <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Dashboard</span>
      </router-link>

      <!-- Usuarios Link (Admin) -->
      <router-link
        v-if="authStore.isAdmin"
        to="/users"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
          route.path.startsWith('/users') ? 'text-[#5C7E8F] font-bold' : 'text-[#C4D3D9]'
        ]"
      >
        <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Usuarios</span>
      </router-link>

      <!-- Proyectos Link -->
      <router-link
        to="/projects"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
          route.path.startsWith('/projects') ? 'text-[#5C7E8F] font-bold' : 'text-[#C4D3D9]'
        ]"
      >
        <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span>Proyectos</span>
      </router-link>

      <!-- Tareas Link -->
      <router-link
        to="/tasks"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
          route.path.startsWith('/tasks') ? 'text-[#5C7E8F] font-bold' : 'text-[#C4D3D9]'
        ]"
      >
        <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span>Tareas</span>
      </router-link>

      <!-- Perfil Link (Acceso a Perfil en Moviles) -->
      <router-link
        to="/profile"
        :class="[
          'flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
          route.path === '/profile' ? 'text-[#5C7E8F] font-bold' : 'text-[#C4D3D9]'
        ]"
      >
        <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Perfil</span>
      </router-link>
    </nav>

    <!-- Notificaciones Flotantes Toast -->
    <AppToast />
  </div>
</template>
