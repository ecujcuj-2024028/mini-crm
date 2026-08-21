<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '../../stores/task.store';
import { useProjectStore } from '../../stores/project.store';
import { useToastStore } from '../../stores/toast.store';
import AppButton from '../../components/common/AppButton.vue';
import AppConfirmModal from '../../components/common/AppConfirmModal.vue';
import TaskCard from '../../components/tasks/TaskCard.vue';
import TaskModal from '../../components/tasks/TaskModal.vue';
import TaskDetailModal from '../../components/tasks/TaskDetailModal.vue';

const route = useRoute();
const router = useRouter();

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const toastStore = useToastStore();

// Filtros Globales del Tablero
const searchInput = ref('');
const selectedProject = ref('');
const selectedPriority = ref('');

// Modo de Color de Tarjetas (Persistencia Local): 'individual', 'default', 'status', 'priority', 'custom'
const globalColorMode = ref(localStorage.getItem('crm_task_global_color_mode') || 'individual');
const globalCustomColor = ref(localStorage.getItem('crm_task_global_custom_color') || '#5C7E8F');
const savedIndividualTaskColors = ref(JSON.parse(localStorage.getItem('crm_individual_task_colors') || '{}'));

// Presets de colores sugeridos para tareas
const colorPresets = [
  { name: 'Azul CRM', hex: '#5C7E8F' },
  { name: 'Verde Esmeralda', hex: '#10B981' },
  { name: 'Ámbar Cálido', hex: '#F59E0B' },
  { name: 'Púrpura Elegante', hex: '#8B5CF6' },
  { name: 'Rosa Vibrante', hex: '#EC4899' },
  { name: 'Rojo Urgencia', hex: '#EF4444' }
];

// Estado de Drag & Drop para destacar la columna destino
const activeDragColumn = ref(null);

// Ordenamiento e Historial Interno por Cada Columna Kanban
const columnSorts = ref({
  TODO: 'manual',
  IN_PROGRESS: 'manual',
  REVIEW: 'manual',
  DONE: 'manual'
});

const columnPriorityFilters = ref({
  TODO: '',
  IN_PROGRESS: '',
  REVIEW: '',
  DONE: ''
});

// Modales
const showTaskModal = ref(false);
const showDetailModal = ref(false);
const showConfirmModal = ref(false);

const selectedTask = ref(null);
const taskToToggle = ref(null);

onMounted(async () => {
  // Cargar proyectos si aún no están cargados
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects(1);
  }

  // Si viene con parámetro ?projectId=XYZ en la URL
  if (route.query.projectId) {
    selectedProject.value = route.query.projectId;
  }

  fetchTasks();
});

// Cargar tareas aplicando filtros
const fetchTasks = () => {
  taskStore.fetchTasks(
    selectedProject.value || null,
    selectedPriority.value || null,
    searchInput.value || null
  );
};

// Búsqueda y filtrado
const handleSearch = () => {
  fetchTasks();
};

const clearFilters = () => {
  searchInput.value = '';
  selectedProject.value = '';
  selectedPriority.value = '';
  router.replace({ query: {} });
  fetchTasks();
};

// Guardar configuración global de color de tareas
watch(globalColorMode, (newVal) => {
  localStorage.setItem('crm_task_global_color_mode', newVal);
});

watch(globalCustomColor, (newVal) => {
  localStorage.setItem('crm_task_global_custom_color', newVal);
});

// Determinar el modo de color exacto para cada tarjeta
const getTaskColorMode = (taskId) => {
  if (globalColorMode.value !== 'individual') {
    return globalColorMode.value;
  }
  return savedIndividualTaskColors.value[taskId]?.colorMode || 'default';
};

const getTaskCustomColor = (taskId) => {
  if (globalColorMode.value === 'custom') {
    return globalCustomColor.value;
  }
  return savedIndividualTaskColors.value[taskId]?.customColor || '#5C7E8F';
};

// Ordenar y filtrar una lista de tareas según las opciones de la columna
const processColumnTasks = (tasks = [], sortType, priorityFilter) => {
  let result = [...tasks];

  // 1. Filtro interno por prioridad
  if (priorityFilter) {
    result = result.filter(t => t.priority === priorityFilter);
  }

  // 2. Ordenamiento interno
  if (sortType === 'date_desc') {
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (sortType === 'date_asc') {
    result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  } else if (sortType === 'priority_desc') {
    const weights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    result.sort((a, b) => (weights[b.priority] || 0) - (weights[a.priority] || 0));
  } else if (sortType === 'priority_asc') {
    const weights = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    result.sort((a, b) => (weights[a.priority] || 0) - (weights[b.priority] || 0));
  } else if (sortType === 'name_asc') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
};

// Computados por Columna Kanban (con encadenamiento opcional seguro ?. para evitar errores TypeError)
const processedTodoTasks = computed(() => processColumnTasks(taskStore.tasksByStatus?.TODO || [], columnSorts.value.TODO, columnPriorityFilters.value.TODO));
const processedInProgressTasks = computed(() => processColumnTasks(taskStore.tasksByStatus?.IN_PROGRESS || [], columnSorts.value.IN_PROGRESS, columnPriorityFilters.value.IN_PROGRESS));
const processedReviewTasks = computed(() => processColumnTasks(taskStore.tasksByStatus?.REVIEW || [], columnSorts.value.REVIEW, columnPriorityFilters.value.REVIEW));
const processedDoneTasks = computed(() => processColumnTasks(taskStore.tasksByStatus?.DONE || [], columnSorts.value.DONE, columnPriorityFilters.value.DONE));

// Título y mensaje dinámico del modal de confirmación
const confirmTitle = computed(() => {
  if (!taskToToggle.value) return 'Confirmar Acción';
  return taskToToggle.value.isActive ? 'Desactivar Tarea' : 'Restaurar Tarea';
});

const confirmMessage = computed(() => {
  if (!taskToToggle.value) return '';
  return taskToToggle.value.isActive
    ? `¿Estás seguro de que deseas desactivar la tarea "${taskToToggle.value.title}"?`
    : `¿Deseas restaurar la tarea "${taskToToggle.value.title}"?`;
});

// Abrir modal crear
const openCreateModal = (defaultStatus = 'TODO') => {
  selectedTask.value = null;
  showTaskModal.value = true;
};

// Abrir modal editar
const openEditModal = (task) => {
  selectedTask.value = task;
  showTaskModal.value = true;
};

// Abrir modal detalles y comentarios en tiempo real
const openCommentsModal = (task) => {
  selectedTask.value = task;
  showDetailModal.value = true;
};

// Abrir confirmación desactivar
const promptToggleTask = (task) => {
  taskToToggle.value = task;
  showConfirmModal.value = true;
};

// Confirmar desactivar
const handleConfirmToggle = async () => {
  if (!taskToToggle.value) return;
  try {
    await taskStore.deleteTask(taskToToggle.value.id);
    toastStore.addToast({ title: 'Tarea Desactivada', message: 'La tarea ha sido desactivada.', type: 'info' });
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo desactivar la tarea.', type: 'danger' });
  } finally {
    showConfirmModal.value = false;
    taskToToggle.value = null;
  }
};

// Guardar tarea y guardar configuración de color individual
const handleSaveTask = async (payload) => {
  const { colorMode: tColorMode, customColor: tCustomColor, ...input } = payload;

  try {
    if (selectedTask.value) {
      await taskStore.updateTask(selectedTask.value.id, input);
      savedIndividualTaskColors.value[selectedTask.value.id] = {
        colorMode: tColorMode,
        customColor: tCustomColor
      };
      localStorage.setItem('crm_individual_task_colors', JSON.stringify(savedIndividualTaskColors.value));
      toastStore.addToast({ title: 'Tarea Actualizada', message: 'Los cambios fueron guardados.', type: 'info' });
    } else {
      await taskStore.createTask(input);
      if (taskStore.tasks[0]) {
        savedIndividualTaskColors.value[taskStore.tasks[0].id] = {
          colorMode: tColorMode,
          customColor: tCustomColor
        };
        localStorage.setItem('crm_individual_task_colors', JSON.stringify(savedIndividualTaskColors.value));
      }
      toastStore.addToast({ title: 'Tarea Creada', message: 'La nueva tarea fue creada exitosamente.', type: 'info' });
    }
    showTaskModal.value = false;
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo guardar la tarea.', type: 'danger' });
  }
};

// Controladores Drag & Drop con Mouse
const handleDragOver = (event, columnName) => {
  event.preventDefault();
  activeDragColumn.value = columnName;
};

const handleDragLeave = (columnName) => {
  if (activeDragColumn.value === columnName) {
    activeDragColumn.value = null;
  }
};

const handleDrop = async (event, targetStatus) => {
  event.preventDefault();
  activeDragColumn.value = null;
  const taskId = event.dataTransfer.getData('text/plain');
  if (!taskId) return;

  const task = taskStore.tasks.find(t => t.id === taskId);
  if (task && task.status !== targetStatus) {
    try {
      await taskStore.updateTask(taskId, { status: targetStatus });
      toastStore.addToast({
        title: 'Estado Actualizado',
        message: `"${task.title}" fue movida a ${statusLabel(targetStatus)}.`,
        type: 'info'
      });
    } catch (err) {
      toastStore.addToast({ title: 'Error', message: 'No se pudo cambiar el estado de la tarea.', type: 'danger' });
    }
  }
};

// Soltar tarjeta sobre otra tarjeta para reordenarla o cambiarla de columna
const handleDropOnCard = async ({ draggedTaskId, targetTask }) => {
  if (!draggedTaskId || !targetTask) return;

  const movedTask = taskStore.tasks.find(t => t.id === draggedTaskId);
  if (!movedTask) return;

  if (movedTask.status !== targetTask.status) {
    try {
      await taskStore.updateTask(draggedTaskId, { status: targetTask.status });
      toastStore.addToast({
        title: 'Tarea Movida',
        message: `"${movedTask.title}" fue movida a la columna ${statusLabel(targetTask.status)}.`,
        type: 'info'
      });
    } catch (err) {
      toastStore.addToast({ title: 'Error', message: 'No se pudo mover la tarea.', type: 'danger' });
    }
  } else {
    // Reordenar localmente dentro de la misma columna
    const columnList = taskStore.tasksByStatus?.[targetTask.status] || [];
    const fromIndex = columnList.findIndex(t => t.id === draggedTaskId);
    const toIndex = columnList.findIndex(t => t.id === targetTask.id);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const [item] = columnList.splice(fromIndex, 1);
      columnList.splice(toIndex, 0, item);
      try {
        await taskStore.updateTask(draggedTaskId, { status: targetTask.status });
        toastStore.addToast({
          title: 'Tarea Reordenada',
          message: `"${movedTask.title}" fue movida a ${statusLabel(targetTask.status)}.`,
          type: 'info'
        });
      } catch (err) {
        toastStore.addToast({ title: 'Error', message: 'No se pudo reordenar la tarjeta.', type: 'danger' });
      }
    }
  }
};

const statusLabel = (st) => {
  switch (st) {
    case 'TODO': return 'Por Hacer';
    case 'IN_PROGRESS': return 'En Progreso';
    case 'REVIEW': return 'En Revisión';
    case 'DONE': return 'Completado';
    default: return st;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Subtitulo y Boton Nueva Tarea -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p class="text-xs sm:text-sm text-[#6E6E6E] dark:text-[#A2B3BC]">
        Gestiona, filtra y reordena tareas por cada columna Kanban en tiempo real.
      </p>

      <AppButton
        @click="openCreateModal('TODO')"
        variant="primary"
        class="shrink-0"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Nueva Tarea</span>
      </AppButton>
    </div>

    <!-- Barra de Filtros y Selector Modo de Color -->
    <div class="bg-white dark:bg-[#1A2830] rounded-2xl p-4 shadow-sm border border-[#E4EAED] dark:border-[#2E3F49] space-y-3">
      <div class="flex flex-col md:flex-row items-center gap-3">
        <!-- Input de Busqueda en Tiempo Real -->
        <div class="relative flex-1 w-full">
          <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A2A2A2] dark:text-[#5E717B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Buscar tareas por título..."
            class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          />
          <!-- Boton Limpiar dentro del Input -->
          <button
            v-if="searchInput"
            @click="searchInput = ''; handleSearch()"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2A2A2] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white transition-colors cursor-pointer"
            title="Limpiar texto"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Selector Filtro Proyecto -->
        <select
          v-model="selectedProject"
          @change="handleSearch"
          class="w-full md:w-48 px-3 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="">Todos los proyectos</option>
          <option
            v-for="p in projectStore.projects"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }}
          </option>
        </select>

        <!-- Selector Filtro Prioridad Global -->
        <select
          v-model="selectedPriority"
          @change="handleSearch"
          class="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="">Todas las prioridades</option>
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>

        <!-- Selector Modo de Color Global o Individual -->
        <select
          v-model="globalColorMode"
          class="w-full md:w-52 px-3 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-[#F3F6F7] dark:bg-[#121E24] text-[#263840] dark:text-[#F3F6F7] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="individual">Estilo: Selección Individual</option>
          <option value="default">Global: Por defecto</option>
          <option value="status">Global: Por Estado</option>
          <option value="priority">Global: Por Prioridad</option>
          <option value="custom">Global: Color Personalizado</option>
        </select>

        <!-- Botones Filtrar y Limpiar -->
        <div class="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <AppButton
            @click="handleSearch"
            variant="secondary"
            class="flex-1 md:flex-none"
          >
            Filtrar
          </AppButton>
          <AppButton
            v-if="searchInput || selectedProject || selectedPriority"
            @click="clearFilters"
            variant="outline"
            class="flex-1 md:flex-none"
          >
            Limpiar
          </AppButton>
        </div>
      </div>

      <!-- Selector de Paleta de Colores Personalizados Globales para Tareas -->
      <div v-if="globalColorMode === 'custom'" class="pt-3 border-t border-[#E4EAED] dark:border-[#2E3F49] flex items-center space-x-3 overflow-x-auto">
        <span class="text-xs font-semibold text-[#6E6E6E] dark:text-[#A2B3BC] shrink-0">Color global para todas las tareas:</span>
        <div class="flex items-center space-x-2">
          <button
            v-for="preset in colorPresets"
            :key="preset.hex"
            @click="globalCustomColor = preset.hex"
            type="button"
            :title="preset.name"
            :class="[
              'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer',
              globalCustomColor === preset.hex ? 'scale-125 border-[#263840] dark:border-white shadow-md' : 'border-transparent hover:scale-110'
            ]"
            :style="{ backgroundColor: preset.hex }"
          ></button>
          <!-- Selector Libre Color Picker -->
          <input
            v-model="globalCustomColor"
            type="color"
            class="w-7 h-7 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] cursor-pointer bg-transparent"
            title="Elegir cualquier color hex"
          />
        </div>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="taskStore.loading" class="text-center py-12 bg-white dark:bg-[#1A2830] rounded-3xl border border-[#E4EAED] dark:border-[#2E3F49]">
      <p class="text-sm text-[#6E6E6E] dark:text-[#A2B3BC]">Cargando tareas del tablero Kanban...</p>
    </div>

    <!-- Tablero Kanban de 4 Columnas con Filtros e Ordenamiento por Columna -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      <!-- Columna 1: Por Hacer (TODO) -->
      <div
        @dragover="handleDragOver($event, 'TODO')"
        @dragleave="handleDragLeave('TODO')"
        @drop="handleDrop($event, 'TODO')"
        :class="[
          'rounded-3xl p-4 border transition-all duration-200 space-y-3 min-h-[500px]',
          activeDragColumn === 'TODO' ? 'bg-sky-50/80 dark:bg-sky-950/50 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] dark:bg-[#121E24] border-[#E4EAED] dark:border-[#2E3F49]'
        ]"
      >
        <!-- Encabezado de Columna con Controles de Orden y Filtro -->
        <div class="space-y-2 pb-2 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#A2A2A2] dark:bg-[#8CA7B3]"></span>
              <h3 class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider">
                Por Hacer
              </h3>
              <span class="bg-[#E4EAED] dark:bg-[#2E3F49] text-[#263840] dark:text-[#F3F6F7] text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedTodoTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('TODO')"
              type="button"
              class="text-[#5C7E8F] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white p-1 rounded-lg hover:bg-white dark:hover:bg-[#1A2830] transition-colors cursor-pointer"
              title="Agregar tarea a Por Hacer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Controles Internos de Columna: Orden & Filtro -->
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <select
              v-model="columnSorts.TODO"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="manual">Orden: Manual</option>
              <option value="date_desc">Recientes primero</option>
              <option value="date_asc">Antiguas primero</option>
              <option value="priority_desc">Prioridad Alta</option>
              <option value="priority_asc">Prioridad Baja</option>
              <option value="name_asc">Nombre (A-Z)</option>
            </select>

            <select
              v-model="columnPriorityFilters.TODO"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedTodoTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] dark:text-[#5E717B] italic border-2 border-dashed border-[#C7C7C7]/40 dark:border-[#2E3F49] rounded-2xl">
          Sin tareas en esta columna
        </div>
        <TaskCard
          v-for="task in processedTodoTasks"
          :key="task.id"
          :task="task"
          :colorMode="getTaskColorMode(task.id)"
          :customColor="getTaskCustomColor(task.id)"
          @edit="openEditModal"
          @delete="promptToggleTask"
          @open-comments="openCommentsModal"
          @drop-on-card="handleDropOnCard"
        />
      </div>

      <!-- Columna 2: En Progreso (IN_PROGRESS) -->
      <div
        @dragover="handleDragOver($event, 'IN_PROGRESS')"
        @dragleave="handleDragLeave('IN_PROGRESS')"
        @drop="handleDrop($event, 'IN_PROGRESS')"
        :class="[
          'rounded-3xl p-4 border transition-all duration-200 space-y-3 min-h-[500px]',
          activeDragColumn === 'IN_PROGRESS' ? 'bg-amber-50/80 dark:bg-amber-950/50 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] dark:bg-[#121E24] border-[#E4EAED] dark:border-[#2E3F49]'
        ]"
      >
        <div class="space-y-2 pb-2 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#5C7E8F]"></span>
              <h3 class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider">
                En Progreso
              </h3>
              <span class="bg-[#5C7E8F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedInProgressTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('IN_PROGRESS')"
              type="button"
              class="text-[#5C7E8F] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white p-1 rounded-lg hover:bg-white dark:hover:bg-[#1A2830] transition-colors cursor-pointer"
              title="Agregar tarea a En Progreso"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Controles Internos de Columna -->
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <select
              v-model="columnSorts.IN_PROGRESS"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="manual">Orden: Manual</option>
              <option value="date_desc">Recientes primero</option>
              <option value="date_asc">Antiguas primero</option>
              <option value="priority_desc">Prioridad Alta</option>
              <option value="priority_asc">Prioridad Baja</option>
              <option value="name_asc">Nombre (A-Z)</option>
            </select>

            <select
              v-model="columnPriorityFilters.IN_PROGRESS"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedInProgressTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] dark:text-[#5E717B] italic border-2 border-dashed border-[#C7C7C7]/40 dark:border-[#2E3F49] rounded-2xl">
          Sin tareas en esta columna
        </div>
        <TaskCard
          v-for="task in processedInProgressTasks"
          :key="task.id"
          :task="task"
          :colorMode="getTaskColorMode(task.id)"
          :customColor="getTaskCustomColor(task.id)"
          @edit="openEditModal"
          @delete="promptToggleTask"
          @open-comments="openCommentsModal"
          @drop-on-card="handleDropOnCard"
        />
      </div>

      <!-- Columna 3: En Revisión (REVIEW) -->
      <div
        @dragover="handleDragOver($event, 'REVIEW')"
        @dragleave="handleDragLeave('REVIEW')"
        @drop="handleDrop($event, 'REVIEW')"
        :class="[
          'rounded-3xl p-4 border transition-all duration-200 space-y-3 min-h-[500px]',
          activeDragColumn === 'REVIEW' ? 'bg-purple-50/80 dark:bg-purple-950/50 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] dark:bg-[#121E24] border-[#E4EAED] dark:border-[#2E3F49]'
        ]"
      >
        <div class="space-y-2 pb-2 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#8CA7B3]"></span>
              <h3 class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider">
                En Revisión
              </h3>
              <span class="bg-[#8CA7B3] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedReviewTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('REVIEW')"
              type="button"
              class="text-[#5C7E8F] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white p-1 rounded-lg hover:bg-white dark:hover:bg-[#1A2830] transition-colors cursor-pointer"
              title="Agregar tarea a En Revisión"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Controles Internos de Columna -->
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <select
              v-model="columnSorts.REVIEW"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="manual">Orden: Manual</option>
              <option value="date_desc">Recientes primero</option>
              <option value="date_asc">Antiguas primero</option>
              <option value="priority_desc">Prioridad Alta</option>
              <option value="priority_asc">Prioridad Baja</option>
              <option value="name_asc">Nombre (A-Z)</option>
            </select>

            <select
              v-model="columnPriorityFilters.REVIEW"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedReviewTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] dark:text-[#5E717B] italic border-2 border-dashed border-[#C7C7C7]/40 dark:border-[#2E3F49] rounded-2xl">
          Sin tareas en esta columna
        </div>
        <TaskCard
          v-for="task in processedReviewTasks"
          :key="task.id"
          :task="task"
          :colorMode="getTaskColorMode(task.id)"
          :customColor="getTaskCustomColor(task.id)"
          @edit="openEditModal"
          @delete="promptToggleTask"
          @open-comments="openCommentsModal"
          @drop-on-card="handleDropOnCard"
        />
      </div>

      <!-- Columna 4: Completado (DONE) -->
      <div
        @dragover="handleDragOver($event, 'DONE')"
        @dragleave="handleDragLeave('DONE')"
        @drop="handleDrop($event, 'DONE')"
        :class="[
          'rounded-3xl p-4 border transition-all duration-200 space-y-3 min-h-[500px]',
          activeDragColumn === 'DONE' ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] dark:bg-[#121E24] border-[#E4EAED] dark:border-[#2E3F49]'
        ]"
      >
        <div class="space-y-2 pb-2 border-b border-[#E4EAED] dark:border-[#2E3F49]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#263840] dark:bg-emerald-400"></span>
              <h3 class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider">
                Completado
              </h3>
              <span class="bg-[#263840] dark:bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedDoneTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('DONE')"
              type="button"
              class="text-[#5C7E8F] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white p-1 rounded-lg hover:bg-white dark:hover:bg-[#1A2830] transition-colors cursor-pointer"
              title="Agregar tarea a Completado"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Controles Internos de Columna -->
          <div class="grid grid-cols-2 gap-1.5 pt-1">
            <select
              v-model="columnSorts.DONE"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="manual">Orden: Manual</option>
              <option value="date_desc">Recientes primero</option>
              <option value="date_asc">Antiguas primero</option>
              <option value="priority_desc">Prioridad Alta</option>
              <option value="priority_asc">Prioridad Baja</option>
              <option value="name_asc">Nombre (A-Z)</option>
            </select>

            <select
              v-model="columnPriorityFilters.DONE"
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#1A2830] text-[#4A4A4A] dark:text-[#F3F6F7] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedDoneTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] dark:text-[#5E717B] italic border-2 border-dashed border-[#C7C7C7]/40 dark:border-[#2E3F49] rounded-2xl">
          Sin tareas en esta columna
        </div>
        <TaskCard
          v-for="task in processedDoneTasks"
          :key="task.id"
          :task="task"
          :colorMode="getTaskColorMode(task.id)"
          :customColor="getTaskCustomColor(task.id)"
          @edit="openEditModal"
          @delete="promptToggleTask"
          @open-comments="openCommentsModal"
          @drop-on-card="handleDropOnCard"
        />
      </div>
    </div>

    <!-- Modales para Crear/Editar, Detalles/Comentarios y Confirmación -->
    <TaskModal
      :show="showTaskModal"
      :task="selectedTask"
      :defaultProjectId="selectedProject"
      :loading="taskStore.loading"
      @close="showTaskModal = false"
      @save="handleSaveTask"
    />

    <TaskDetailModal
      :show="showDetailModal"
      :task="selectedTask"
      @close="showDetailModal = false"
    />

    <AppConfirmModal
      :show="showConfirmModal"
      :title="confirmTitle"
      :message="confirmMessage"
      confirmText="Desactivar"
      variant="danger"
      :loading="taskStore.loading"
      @close="showConfirmModal = false"
      @confirm="handleConfirmToggle"
    />
  </div>
</template>
