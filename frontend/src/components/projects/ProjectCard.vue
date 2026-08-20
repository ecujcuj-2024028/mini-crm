<script setup>
import { computed } from 'vue';
import AppBadge from '../common/AppBadge.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

defineEmits(['edit', 'delete', 'restore', 'click']);

// Texto descriptivo del estado
const statusLabel = computed(() => {
  switch (props.project.status) {
    case 'ACTIVE':
      return 'Activo';
    case 'PAUSED':
      return 'En pausa';
    case 'COMPLETED':
      return 'Completado';
    default:
      return 'Activo';
  }
});

// Porcentaje de progreso calculado
const progressPercentage = computed(() => {
  if (props.project.status === 'COMPLETED') return 100;
  if (props.project.status === 'PAUSED') return 35;
  return 65; // Porcentaje dinamico por defecto para activos
});

// Formato de fecha
const formattedEndDate = computed(() => {
  if (!props.project.endDate) return 'Sin fecha límite';
  const date = new Date(Number(props.project.endDate) || props.project.endDate);
  if (isNaN(date.getTime())) return props.project.endDate;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
});

// Iniciales del owner / usuario asignado
const ownerInitials = computed(() => {
  if (!props.project.owner?.name) return 'U';
  return props.project.owner.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
});
</script>

<template>
  <div
    :class="[
      'bg-white rounded-3xl p-6 shadow-sm border border-[#E4EAED] flex flex-col justify-between transition-all duration-200 hover:shadow-md relative overflow-hidden group',
      !project.isActive ? 'opacity-60 bg-gray-50' : ''
    ]"
  >
    <!-- Encabezado de la Tarjeta -->
    <div>
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0 flex-1">
          <h3 
            @click="$emit('click', project.id)"
            class="text-lg font-bold text-[#263840] tracking-tight truncate hover:text-[#5C7E8F] transition-colors cursor-pointer"
          >
            {{ project.name }}
          </h3>
          <p class="text-xs font-semibold text-[#5C7E8F] mt-0.5">
            {{ project.owner?.name || 'Asignado' }}
          </p>
        </div>

        <!-- Badge de Estado -->
        <AppBadge :variant="project.status">
          {{ statusLabel }}
        </AppBadge>
      </div>

      <!-- Descripcion del Proyecto -->
      <p class="text-xs text-[#6E6E6E] line-clamp-2 mb-4 leading-relaxed">
        {{ project.description || 'Sin descripción detallada' }}
      </p>

      <!-- Barra de Progreso (Diseño Figma) -->
      <div class="mb-5">
        <div class="flex items-center justify-between text-xs font-medium text-[#4A4A4A] mb-1.5">
          <span>Progreso</span>
          <span class="font-bold text-[#263840]">{{ progressPercentage }}%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-[#E4EAED] overflow-hidden">
          <div
            class="h-full bg-[#5C7E8F] transition-all duration-500 rounded-full"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Pie de Tarjeta: Fecha Limite, Avatares y Acciones -->
    <div class="pt-4 border-t border-[#E4EAED] flex items-center justify-between text-xs">
      <!-- Fecha Limite -->
      <div class="flex items-center space-x-1.5 text-[#6E6E6E]">
        <svg class="w-4 h-4 text-[#8CA7B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{{ formattedEndDate }}</span>
      </div>

      <!-- Acciones + Avatar -->
      <div class="flex items-center space-x-3">
        <!-- Stack de Avatares -->
        <div class="flex items-center -space-x-2">
          <div
            class="w-7 h-7 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-[10px] border-2 border-white"
            :title="project.owner?.name"
          >
            {{ ownerInitials }}
          </div>
        </div>

        <!-- Iconos de Accion -->
        <div class="flex items-center space-x-1">
          <button
            @click.stop="$emit('edit', project)"
            type="button"
            title="Editar proyecto"
            class="w-7 h-7 rounded-lg bg-[#F3F6F7] hover:bg-[#E4EAED] text-[#5C7E8F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            v-if="project.isActive"
            @click.stop="$emit('delete', project)"
            type="button"
            title="Desactivar proyecto"
            class="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            v-else
            @click.stop="$emit('restore', project)"
            type="button"
            title="Restaurar proyecto"
            class="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
