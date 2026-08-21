<script setup>
import { computed } from 'vue';
import AppBadge from '../common/AppBadge.vue';

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  colorMode: {
    type: String,
    default: 'default' // 'default', 'status', 'priority', 'custom'
  },
  customColor: {
    type: String,
    default: '#5C7E8F'
  }
});

const emit = defineEmits(['edit', 'delete', 'restore', 'open-comments', 'change-status', 'dragstart', 'drop-on-card']);

// Iniciales del usuario asignado
const assignedInitials = computed(() => {
  if (!props.task.assignedTo?.name) return 'U';
  return props.task.assignedTo.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
});

// Etiqueta de prioridad
const priorityLabel = computed(() => {
  switch (props.task.priority) {
    case 'LOW':
      return 'Baja';
    case 'MEDIUM':
      return 'Media';
    case 'HIGH':
      return 'Alta';
    case 'URGENT':
      return 'Urgente';
    default:
      return 'Media';
  }
});

// Color de la insignia de prioridad
const priorityBadgeClass = computed(() => {
  switch (props.task.priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-700 border border-red-300';
    case 'HIGH':
      return 'bg-[#263840] text-white';
    case 'MEDIUM':
      return 'bg-[#5C7E8F] text-white';
    case 'LOW':
    default:
      return 'bg-[#A2A2A2]/20 text-[#4A4A4A] border border-[#C7C7C7]';
  }
});

// Clases dinámicas del contenedor según el modo de color
const cardClasses = computed(() => {
  if (!props.task.isActive) {
    return 'bg-gray-50 opacity-60 border-[#E4EAED]';
  }

  // Modo Por Estado
  if (props.colorMode === 'status') {
    switch (props.task.status) {
      case 'DONE':
        return 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500 shadow-2xs';
      case 'REVIEW':
        return 'bg-purple-50/60 border-purple-300 hover:border-purple-500 shadow-2xs';
      case 'IN_PROGRESS':
        return 'bg-amber-50/60 border-amber-300 hover:border-amber-500 shadow-2xs';
      case 'TODO':
      default:
        return 'bg-sky-50/40 border-sky-200 hover:border-[#5C7E8F] shadow-2xs';
    }
  }

  // Modo Por Prioridad
  if (props.colorMode === 'priority') {
    switch (props.task.priority) {
      case 'URGENT':
        return 'bg-red-50/70 border-red-300 hover:border-red-500 shadow-2xs';
      case 'HIGH':
        return 'bg-slate-100/80 border-[#263840]/40 hover:border-[#263840] shadow-2xs';
      case 'MEDIUM':
        return 'bg-sky-50/60 border-[#5C7E8F]/40 hover:border-[#5C7E8F] shadow-2xs';
      case 'LOW':
      default:
        return 'bg-[#A2A2A2]/10 border-[#C7C7C7] hover:border-[#4A4A4A] shadow-2xs';
    }
  }

  // Modo por defecto
  return 'bg-white border-[#E4EAED] hover:border-[#5C7E8F] hover:shadow-md';
});

// Estilos de franja lateral para color personalizado
const customCardStyle = computed(() => {
  if (props.colorMode === 'custom' && props.task.isActive) {
    return {
      borderLeftWidth: '5px',
      borderLeftColor: props.customColor
    };
  }
  return {};
});

const handleDragStart = (event) => {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', props.task.id);
  emit('dragstart', event, props.task);
};

const handleCardDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();
  const draggedTaskId = event.dataTransfer.getData('text/plain');
  if (draggedTaskId && draggedTaskId !== props.task.id) {
    emit('drop-on-card', { draggedTaskId, targetTask: props.task });
  }
};
</script>

<template>
  <div
    draggable="true"
    @dragstart="handleDragStart"
    @dragover.prevent
    @drop="handleCardDrop"
    :class="[
      'rounded-2xl p-4 border flex flex-col justify-between transition-all duration-200 group select-none cursor-grab active:cursor-grabbing',
      cardClasses
    ]"
    :style="customCardStyle"
  >
    <div>
      <!-- Cabecera de Tarjeta: Proyecto y Prioridad -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <!-- Badge de Nombre de Proyecto -->
        <span class="text-[10px] font-bold text-[#5C7E8F] uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md truncate max-w-[140px] border border-[#E4EAED]">
          {{ task.project?.name || 'Proyecto' }}
        </span>

        <!-- Badge de Prioridad -->
        <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0', priorityBadgeClass]">
          {{ priorityLabel }}
        </span>
      </div>

      <!-- Titulo de la Tarea -->
      <h4
        @click="$emit('open-comments', task)"
        class="text-sm font-bold text-[#263840] tracking-tight hover:text-[#5C7E8F] transition-colors cursor-pointer line-clamp-2 mb-1.5"
      >
        {{ task.title }}
      </h4>

      <!-- Descripcion Opcional -->
      <p v-if="task.description" class="text-xs text-[#6E6E6E] line-clamp-2 mb-3 leading-relaxed">
        {{ task.description }}
      </p>
    </div>

    <!-- Pie de Tarjeta: Comentarios, Asignado y Acciones -->
    <div class="pt-3 border-t border-[#E4EAED]/80 flex items-center justify-between text-xs mt-2">
      <!-- Icono de Comentarios en Tiempo Real -->
      <button
        @click="$emit('open-comments', task)"
        type="button"
        class="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-white/80 border border-[#E4EAED] hover:bg-[#E4EAED] text-[#263840] transition-colors cursor-pointer"
        title="Ver comentarios"
      >
        <svg class="w-3.5 h-3.5 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span class="font-bold text-[11px]">{{ task.commentsCount || 0 }}</span>
      </button>

      <!-- Asignado + Acciones -->
      <div class="flex items-center space-x-2">
        <!-- Avatar del Usuario Asignado -->
        <div
          class="w-6 h-6 rounded-full bg-[#5C7E8F] text-white flex items-center justify-center font-bold text-[9px] border border-white shadow-2xs shrink-0"
          :title="task.assignedTo?.name ? `Asignado a: ${task.assignedTo.name}` : 'Sin asignar'"
        >
          {{ assignedInitials }}
        </div>

        <!-- Acciones Editar y Eliminar -->
        <div class="flex items-center space-x-1">
          <button
            @click.stop="$emit('edit', task)"
            type="button"
            title="Editar tarea"
            class="w-6 h-6 rounded-md bg-white hover:bg-[#F3F6F7] border border-[#E4EAED] text-[#5C7E8F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            v-if="task.isActive"
            @click.stop="$emit('delete', task)"
            type="button"
            title="Desactivar tarea"
            class="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
