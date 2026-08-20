<script setup>
import { useToastStore } from '../../stores/toast.store';

const toastStore = useToastStore();
</script>

<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
    <TransitionGroup
      enter-active-class="transition ease-out duration-300 transform"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200 transform"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-95"
    >
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto bg-[#263840] text-white p-4 rounded-2xl shadow-xl border border-[#5C7E8F]/40 flex items-start space-x-3"
      >
        <!-- Icono Bell SVG segun tipo -->
        <div class="shrink-0 mt-0.5">
          <div class="w-7 h-7 rounded-full bg-[#5C7E8F] flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>

        <!-- Contenido del Toast -->
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-white tracking-wide uppercase">
            {{ toast.title || 'Notificación' }}
          </h4>
          <p class="text-xs text-[#C4D3D9] mt-0.5 leading-snug">
            {{ toast.message }}
          </p>
        </div>

        <!-- Boton Cerrar -->
        <button
          @click="toastStore.removeToast(toast.id)"
          class="shrink-0 text-[#8CA7B3] hover:text-white transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
