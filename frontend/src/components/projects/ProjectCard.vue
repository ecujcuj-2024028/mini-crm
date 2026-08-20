<script setup>
import { computed } from 'vue';
import AppBadge from '../common/AppBadge.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  colorMode: {
    type: String,
    default: 'default' // 'default', 'status', 'custom'
  },
  customColor: {
    type: String,
    default: '#5C7E8F'
  }
});

defineEmits(['edit', 'delete', 'restore', 'click', 'view-details']);

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

// Formato de fecha sin desfase de zona horaria (UTC vs Local)
const formattedEndDate = computed(() => {
  if (!props.project.endDate) return 'Sin fecha límite';

  let dateVal = props.project.endDate;
  if (typeof dateVal === 'string' && dateVal.includes('-')) {
    const cleanStr = dateVal.split('T')[0];
    const [year, month, day] = cleanStr.split('-').map(Number);
    if (year && month && day) {
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  const numVal = Number(dateVal);
  const date = new Date(isNaN(numVal) ? dateVal : numVal);
  if (isNaN(date.getTime())) return dateVal;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
});

// Iniciales del owner / usuario asignado
const ownerInitials = computed(() => {
  if (!props.project.owner?.name) return 'U';
  return props.project.owner.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
});

// Estilos de la tarjeta segun el modo de color seleccionado
const cardClasses = computed(() => {
  if (!props.project.isActive) {
    return 'bg-gray-50 opacity-60 border-[#E4EAED]';
  }

  if (props.colorMode === 'status') {
    switch (props.project.status) {
      case 'COMPLETED':
        return 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 shadow-sm';
      case 'PAUSED':
        return 'bg-amber-50/50 border-amber-300 hover:border-amber-500 shadow-sm';
      case 'ACTIVE':
      default:
        return 'bg-sky-50/40 border-[#8CA7B3]/60 hover:border-[#5C7E8F] shadow-sm';
    }
  }

  // Modo por defecto / personalizada limpia
  return 'bg-white border-[#E4EAED] hover:shadow-md';
});

// Estilo dinamico para color personalizado
const customCardStyle = computed(() => {
  if (props.colorMode === 'custom' && props.project.isActive) {
    return {
      borderLeftWidth: '5px',
      borderLeftColor: props.customColor
    };
  }
  return {};
});

// Estilo de la barra de progreso
const progressBarColor = computed(() => {
  if (props.colorMode === 'status') {
    switch (props.project.status) {
      case 'COMPLETED':
        return 'bg-emerald-600';
      case 'PAUSED':
        return 'bg-amber-500';
      case 'ACTIVE':
      default:
        return 'bg-[#5C7E8F]';
    }
  }
  if (props.colorMode === 'custom') {
    return ''; // Usara style inline
  }
  return 'bg-[#5C7E8F]';
});
</script>

<template>
  <div
    :class="[
      'rounded-3xl p-6 border flex flex-col justify-between transition-all duration-200 relative overflow-hidden group',
      cardClasses
    ]"
    :style="customCardStyle"
  >
    <!-- Encabezado de la Tarjeta (Click en el titulo o tarjeta navega al Tablero de Tareas) -->
    <div>
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0 flex-1">
          <h3 
            @click="$emit('click', project.id)"
            class="text-lg font-bold text-[#263840] tracking-tight truncate hover:text-[#5C7E8F] transition-colors cursor-pointer"
            title="Ver tablero de tareas"
          >
            {{ project.name }}
          </h3>
          <p class="text-xs font-semibold text-[#5C7E8F] mt-0.5">
            {{ project.owner?.name || 'Asignado' }}
          </p>
        </div>

        <!-- Badge de Estado -->
        <span
          v-if="colorMode === 'status'"
          :class="[
            'px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
            project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : '',
            project.status === 'PAUSED' ? 'bg-amber-100 text-amber-800 border border-amber-300' : '',
            project.status === 'ACTIVE' ? 'bg-sky-100 text-sky-900 border border-sky-300' : ''
          ]"
        >
          {{ statusLabel }}
        </span>
        <AppBadge v-else :variant="project.status">
          {{ statusLabel }}
        </AppBadge>
      </div>

      <!-- Descripcion del Proyecto -->
      <p class="text-xs text-[#6E6E6E] line-clamp-2 mb-4 leading-relaxed">
        {{ project.description || 'Sin descripción detallada' }}
      </p>

      <!-- Barra de Progreso -->
      <div class="mb-5">
        <div class="flex items-center justify-between text-xs font-medium text-[#4A4A4A] mb-1.5">
          <span>Progreso</span>
          <span class="font-bold text-[#263840]">{{ progressPercentage }}%</span>
        </div>
        <div class="w-full h-2 rounded-full bg-[#E4EAED] overflow-hidden">
          <div
            :class="['h-full transition-all duration-500 rounded-full', progressBarColor]"
            :style="colorMode === 'custom' ? { backgroundColor: customColor, width: `${progressPercentage}%` } : { width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Pie de Tarjeta: Fecha Limite, Avatares y Acciones (Boton (i) para Detalles) -->
    <div class="pt-4 border-t border-[#E4EAED]/80 flex items-center justify-between text-xs">
      <!-- Badge de Fecha Limite Rediseñado -->
      <div class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-[#E4EAED] text-[#263840] transition-colors shadow-2xs">
        <svg class="w-3.5 h-3.5 text-[#5C7E8F] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="truncate font-semibold text-[11px] text-[#263840] tracking-tight">
          {{ formattedEndDate }}
        </span>
      </div>

      <!-- Acciones + Avatar -->
      <div class="flex items-center space-x-3">
        <!-- Stack de Avatares -->
        <div class="flex items-center -space-x-2">
          <div
            class="w-7 h-7 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-[10px] border-2 border-white shadow-xs"
            :title="project.owner?.name"
          >
            {{ ownerInitials }}
          </div>
        </div>

        <!-- Iconos de Accion -->
        <div class="flex items-center space-x-1">
          <!-- Boton (i) Info para Ver Detalles del Proyecto -->
          <button
            @click.stop="$emit('view-details', project.id)"
            type="button"
            title="Ver detalles del proyecto"
            class="w-7 h-7 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <!-- Boton Editar -->
          <button
            @click.stop="$emit('edit', project)"
            type="button"
            title="Editar proyecto"
            class="w-7 h-7 rounded-lg bg-white hover:bg-[#F3F6F7] border border-[#E4EAED] text-[#5C7E8F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <!-- Boton Desactivar / Restaurar -->
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
