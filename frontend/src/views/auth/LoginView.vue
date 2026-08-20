<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import AppInput from '../../components/common/AppInput.vue';
import AppButton from '../../components/common/AppButton.vue';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);

// Estado reactivo para contraer / expandir el banner superior en móviles
const isHeroCollapsed = ref(false);

const toggleHero = () => {
  isHeroCollapsed.value = !isHeroCollapsed.value;
};

const handleLogin = async () => {
  if (!email.value || !password.value) return;

  loading.value = true;
  error.value = null;

  try {
    await authStore.login(email.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-0 bg-[#F3F6F7]">
    <div class="w-full max-w-md lg:max-w-none lg:min-h-screen grid grid-cols-1 lg:grid-cols-12 rounded-3xl lg:rounded-none overflow-hidden shadow-lg lg:shadow-none border border-[#E4EAED] lg:border-none">
      
      <!-- Columna Izquierda / Encabezado Hero Mobile (#263840) -->
      <div class="lg:col-span-5 bg-[#263840] text-white p-5 sm:p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
        <!-- Logo Superior + Botón de Contraer/Expandir Móvil -->
        <div class="flex items-center justify-between z-10">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-[#8CA7B3]/40 border border-[#8CA7B3] flex items-center justify-center">
              <div class="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-[#C4D3D9]"></div>
            </div>
            <span class="text-xl lg:text-2xl font-bold tracking-tight text-white">Mini-CRM</span>
          </div>

          <!-- Botón Circular para Contraer / Expandir Banner Superior en Móviles -->
          <button 
            @click="toggleHero"
            type="button"
            class="lg:hidden w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
            :title="isHeroCollapsed ? 'Expandir banner' : 'Contraer banner'"
          >
            <svg 
              class="w-4 h-4 stroke-[2.5] transition-transform duration-300" 
              :class="{ 'rotate-180': isHeroCollapsed }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        <!-- Contenido Principal Hero (Se contrae dinámicamente en móvil si isHeroCollapsed === true) -->
        <div 
          v-show="!isHeroCollapsed" 
          class="my-auto py-4 lg:py-12 z-10 transition-all duration-300"
        >
          <h1 class="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight leading-tight mb-3 lg:mb-6 text-white">
            Gestión de proyectos y tareas, sin ruido.
          </h1>
          <p class="text-[#C4D3D9] text-xs sm:text-sm lg:text-base leading-relaxed mb-4 lg:mb-8 font-normal">
            Organiza equipos, controla el avance de tus proyectos y prioriza tareas desde un solo panel.
          </p>

          <!-- Pill Badge -->
          <div class="inline-flex items-center px-3 py-1 lg:px-4 lg:py-1.5 rounded-full bg-[#3D5A66]/60 border border-[#5C7E8F]/40 text-[#C4D3D9] text-[10px] lg:text-xs font-mono tracking-widest uppercase">
            RÁPIDA | SENCILLA
          </div>
        </div>

        <!-- Pie de Pagina Hero (Solo Desktop) -->
        <div class="hidden lg:block text-xs text-[#8CA7B3]/80 font-mono z-10 mt-6">
          &copy; 2026 Mini-CRM &middot; Sistema de Gestión Inteligente
        </div>
      </div>

      <!-- Columna Derecha / Formulario Mobile (#F3F6F7) -->
      <div class="lg:col-span-7 flex items-center justify-center p-5 sm:p-10 lg:p-12 bg-white lg:bg-[#F3F6F7]">
        <div class="w-full max-w-md">
          <!-- Encabezado del Formulario -->
          <div class="text-center mb-6">
            <h2 class="text-2xl sm:text-3xl font-bold text-[#263840] mb-1.5 tracking-tight">
              Iniciar sesión
            </h2>
            <p class="text-[#6E6E6E] text-xs sm:text-sm">
              Ingresa tus credenciales para acceder a tu espacio de trabajo.
            </p>
          </div>

          <!-- Alerta de Error -->
          <div v-if="error" class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center space-x-2">
            <svg class="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Formulario Completo con Componentes Reutilizables AppInput y AppButton -->
          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Campo Correo Electrónico -->
            <AppInput
              v-model="email"
              type="email"
              label="Correo electrónico"
              placeholder="tucorreo@empresa.com"
              required
            />

            <!-- Campo Contraseña -->
            <AppInput
              v-model="password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              required
            />

            <!-- Botón Principal "Entrar" (#5C7E8F) -->
            <AppButton
              type="submit"
              variant="primary"
              :loading="loading"
              fullWidth
              class="mt-4"
            >
              Entrar
            </AppButton>
          </form>

          <!-- Enlace a Registro -->
          <div class="mt-6 text-center text-xs sm:text-sm text-[#6E6E6E]">
            ¿No tienes cuenta?
            <router-link to="/register" class="text-[#5C7E8F] font-semibold hover:text-[#3D5A66] hover:underline transition-colors ml-1">
              Regístrate
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
