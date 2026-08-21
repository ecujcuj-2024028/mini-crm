<script setup>
import { ref, watch, onMounted } from 'vue';
import { useProjectStore } from '../../stores/project.store';
import { useUserStore } from '../../stores/user.store';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  },
  defaultProjectId: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'save']);

const projectStore = useProjectStore();
const userStore = useUserStore();

const title = ref('');
const description = ref('');
const projectId = ref('');
const status = ref('TODO');
const priority = ref('MEDIUM');
const assignedToId = ref('');
const colorMode = ref('default');
const customColor = ref('#5C7E8F');

// Paleta de colores predefinidos para tareas
const colorPresets = [
  { name: 'Azul CRM', hex: '#5C7E8F' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rojo', hex: '#EF4444' }
];

onMounted(() => {
  if (projectStore.projects.length === 0) {
    projectStore.fetchProjects(1);
  }
  if (userStore.users.length === 0) {
    userStore.fetchUsers(1);
  }
});

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      title.value = newTask.title || '';
      description.value = newTask.description || '';
      projectId.value = newTask.project?.id || '';
      status.value = newTask.status || 'TODO';
      priority.value = newTask.priority || 'MEDIUM';
      assignedToId.value = newTask.assignedTo?.id || '';

      // Cargar configuración de color individual de la tarea desde localStorage
      const savedColors = JSON.parse(localStorage.getItem('crm_individual_task_colors') || '{}');
      const taskColorSetting = savedColors[newTask.id] || {};
      colorMode.value = taskColorSetting.colorMode || 'default';
      customColor.value = taskColorSetting.customColor || '#5C7E8F';
    } else {
      title.value = '';
      description.value = '';
      projectId.value = props.defaultProjectId || (projectStore.projects[0]?.id || '');
      status.value = 'TODO';
      priority.value = 'MEDIUM';
      assignedToId.value = '';
      colorMode.value = 'default';
      customColor.value = '#5C7E8F';
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  if (!title.value || !projectId.value) return;

  const payload = {
    projectId: projectId.value,
    title: title.value,
    description: description.value || null,
    status: status.value,
    priority: priority.value,
    colorMode: colorMode.value,
    customColor: customColor.value
  };

  if (assignedToId.value) {
    payload.assignedToId = assignedToId.value;
  }

  emit('save', payload);
};
</script>

<template>
  <AppModal
    :show="show"
    :title="task ? 'Editar Tarea' : 'Crear Nueva Tarea'"
    maxWidth="max-w-lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Selector de Proyecto Requerido -->
      <div>
        <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
          Proyecto <span class="text-red-500">*</span>
        </label>
        <select
          v-model="projectId"
          required
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="" disabled>-- Selecciona un proyecto --</option>
          <option
            v-for="p in projectStore.projects"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Título de la Tarea -->
      <AppInput
        v-model="title"
        label="Título de la tarea"
        placeholder="ej: Diseñar mockups de pantalla principal"
        required
      />

      <!-- Descripción -->
      <div>
        <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
          Descripción detallada
        </label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Especifica los pasos o requisitos para esta tarea..."
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] placeholder-[#A2A2A2] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        ></textarea>
      </div>

      <!-- Estado & Prioridad -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Columna Kanban (Estado) -->
        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
            Columna Kanban (Estado)
          </label>
          <select
            v-model="status"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          >
            <option value="TODO">Por Hacer</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="REVIEW">En Revisión</option>
            <option value="DONE">Completado</option>
          </select>
        </div>

        <!-- Prioridad -->
        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
            Prioridad
          </label>
          <select
            v-model="priority"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          >
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      <!-- Estilo de Color Individual para esta Tarea -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
            Estilo de color de esta tarjeta
          </label>
          <select
            v-model="colorMode"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          >
            <option value="default">Por defecto</option>
            <option value="status">Por Estado</option>
            <option value="priority">Por Prioridad</option>
            <option value="custom">Color Personalizado</option>
          </select>
        </div>

        <!-- Usuario Asignado del Equipo -->
        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
            Asignar a un miembro
          </label>
          <select
            v-model="assignedToId"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          >
            <option value="">-- Sin asignar --</option>
            <option
              v-for="user in userStore.users"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Paleta de Colores Individual para esta tarjeta -->
      <div v-if="colorMode === 'custom'" class="p-3 bg-[#F3F6F7] dark:bg-[#121E24] rounded-xl border border-[#E4EAED] dark:border-[#2E3F49] space-y-2">
        <label class="block text-xs font-semibold text-[#263840] dark:text-[#F3F6F7]">
          Elige el color para esta tarea:
        </label>
        <div class="flex items-center space-x-2">
          <button
            v-for="preset in colorPresets"
            :key="preset.hex"
            @click="customColor = preset.hex"
            type="button"
            :title="preset.name"
            :class="[
              'w-7 h-7 rounded-full border-2 transition-transform cursor-pointer',
              customColor === preset.hex ? 'scale-110 border-[#263840] dark:border-white shadow-md' : 'border-transparent hover:scale-105'
            ]"
            :style="{ backgroundColor: preset.hex }"
          ></button>
          <!-- Selector Libre -->
          <input
            v-model="customColor"
            type="color"
            class="w-8 h-8 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] cursor-pointer bg-transparent"
            title="Elegir otro color"
          />
        </div>
      </div>

      <!-- Acciones del Modal -->
      <div class="flex items-center justify-end space-x-3 pt-4 border-t border-[#E4EAED] dark:border-[#2E3F49]">
        <AppButton
          type="button"
          variant="outline"
          @click="$emit('close')"
        >
          Cancelar
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          :loading="loading"
        >
          {{ task ? 'Guardar Cambios' : 'Crear Tarea' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
