<script setup>
import { useAuthStore } from '../../stores/auth.store';
const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-[#F3F6F7] p-6 flex flex-col items-center justify-center">
    <div class="bg-white rounded-3xl p-8 shadow-sm border border-[#E4EAED] max-w-xl w-full">
      <h1 class="text-2xl font-bold text-[#263840] mb-4">Perfil de Usuario</h1>
      <p class="text-[#6E6E6E]">Configuración de perfil y contraseña.</p>
    </div>
  </div>
</template>
