<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen bg-[#F3F6F7] p-6 flex flex-col items-center justify-center">
    <div class="bg-white rounded-3xl p-8 shadow-sm border border-[#E4EAED] max-w-xl w-full text-center">
      <div class="w-16 h-16 rounded-full bg-[#C4D3D9] text-[#263840] mx-auto flex items-center justify-center mb-4 text-2xl font-bold">
        CRM
      </div>
      <h1 class="text-3xl font-bold text-[#263840] mb-2">¡Bienvenido, {{ authStore.user?.name }}!</h1>
      <p class="text-[#6E6E6E] mb-6">Estás autenticado con el rol <span class="font-bold text-[#5C7E8F]">{{ authStore.user?.role }}</span> ({{ authStore.user?.email }}).</p>
      
      <div class="flex items-center justify-center space-x-4">
        <button @click="handleLogout" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-sm transition-colors">
          Cerrar sesión
        </button>
      </div>
    </div>
  </div>
</template>
