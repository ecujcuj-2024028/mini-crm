<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTaskStore } from '../../stores/task.store';
import { useProjectStore } from '../../stores/project.store';
import { useToastStore } from '../../stores/toast.store';
import AppButton from '../../components/common/AppButton.vue';
import AppConfirmModal from '../../components/common/AppConfirmModal.vue';
import TaskCard from '../../components/tasks/TaskCard.vue';
import TaskModal from '../../components/tasks/TaskModal.vue';
import TaskDetailModal from '../../components/tasks/TaskDetailModal.vue';

const route = useRoute();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const toastStore = useToastStore();

const searchInput = ref('');
const selectedProject = ref(route.query.projectId || '');
const selectedPriority = ref('');

// Modo de color global de tarjetas de tareas ('individual', 'default', 'status', 'priority', 'custom')
const globalColorMode = ref(localStorage.getItem('crm_task_global_color_mode') || 'individual');
const globalCustomColor = ref(localStorage.getItem('crm_task_global_custom_color') || '#5C7E8F');

// Paleta de colores predefinidos para la barra global de tareas
const colorPresets = [
  { name: 'Azul CRM', hex: '#5C7E8F' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rojo', hex: '#EF4444' }
];

// Colores individuales por tarea guardados en localStorage
const savedIndividualTaskColors = ref(JSON.parse(localStorage.getItem('crm_individual_task_colors') || '{}'));

// Guardar preferencia global en localStorage
watch(globalColorMode, (val) => {
  localStorage.setItem('crm_task_global_color_mode', val);
});

watch(globalCustomColor, (val) => {
  localStorage.setItem('crm_task_global_custom_color', val);
});

// Ordenamiento especifico por columna
const columnSorts = ref({
  TODO: 'manual',
  IN_PROGRESS: 'manual',
  REVIEW: 'manual',
  DONE: 'manual'
});

// Filtro de prioridad especifico por columna
const columnPriorityFilters = ref({
  TODO: '',
  IN_PROGRESS: '',
  REVIEW: '',
  DONE: ''
});

// Modales State
const showTaskModal = ref(false);
const showDetailModal = ref(false);
const showConfirmModal = ref(false);

const selectedTask = ref(null);
const taskToToggle = ref(null);

// Estado de arrastre (Drag and Drop con mouse)
const activeDragColumn = ref(null);

// Temporizador debounce para busqueda en tiempo real
let searchTimer = null;

onMounted(() => {
  if (projectStore.projects.length === 0) {
    projectStore.fetchProjects(1);
  }
  taskStore.fetchTasks(selectedProject.value || null, selectedPriority.value || null, searchInput.value);
});

// Obtener modo de color especifico para una tarea
const getTaskColorMode = (taskId) => {
  if (globalColorMode.value !== 'individual') {
    return globalColorMode.value;
  }
  return savedIndividualTaskColors.value[taskId]?.colorMode || 'default';
};

// Obtener color personalizado especifico para una tarea
const getTaskCustomColor = (taskId) => {
  if (globalColorMode.value !== 'individual') {
    return globalCustomColor.value;
  }
  return savedIndividualTaskColors.value[taskId]?.customColor || '#5C7E8F';
};

// Watcher reactivo con debounce de 300ms para busqueda en tiempo real al escribir
watch(searchInput, (newVal) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    taskStore.fetchTasks(selectedProject.value || null, selectedPriority.value || null, newVal.trim());
  }, 300);
});

const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  taskStore.fetchTasks(selectedProject.value || null, selectedPriority.value || null, searchInput.value.trim());
};

const clearFilters = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchInput.value = '';
  selectedProject.value = '';
  selectedPriority.value = '';
  columnPriorityFilters.value = { TODO: '', IN_PROGRESS: '', REVIEW: '', DONE: '' };
  columnSorts.value = { TODO: 'manual', IN_PROGRESS: 'manual', REVIEW: 'manual', DONE: 'manual' };
  taskStore.fetchTasks(null, null, '');
};

// Funcion helper para procesar tareas de una columna (filtrar por prioridad y ordenar)
const processColumnTasks = (rawTasks, colKey) => {
  let result = [...rawTasks];

  // 1. Filtrar por prioridad de la columna si existe
  const priorityFilter = columnPriorityFilters.value[colKey];
  if (priorityFilter) {
    result = result.filter(t => t.priority === priorityFilter);
  }

  // 2. Ordenar por la opcion seleccionada en la columna
  const sortType = columnSorts.value[colKey];
  const priorityRank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  switch (sortType) {
    case 'date_desc':
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'date_asc':
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      break;
    case 'priority_desc':
      result.sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0));
      break;
    case 'priority_asc':
      result.sort((a, b) => (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0));
      break;
    case 'name_asc':
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'manual':
    default:
      // Mantener orden manual de la lista
      break;
  }

  return result;
};

// Computed para cada columna procesada
const processedTodoTasks = computed(() => processColumnTasks(taskStore.todoTasks, 'TODO'));
const processedInProgressTasks = computed(() => processColumnTasks(taskStore.inProgressTasks, 'IN_PROGRESS'));
const processedReviewTasks = computed(() => processColumnTasks(taskStore.reviewTasks, 'REVIEW'));
const processedDoneTasks = computed(() => processColumnTasks(taskStore.doneTasks, 'DONE'));

// Computed para confirmar desactivar
const confirmTitle = computed(() => 'Desactivar Tarea');
const confirmMessage = computed(() => {
  if (!taskToToggle.value) return '';
  return `¿Estás seguro de desactivar la tarea "${taskToToggle.value.title}"?`;
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

// Abrir confirmacion desactivar
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

// Guardar tarea y guardar configuracion de color individual
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

  const targetTask = taskStore.tasks.find(t => t.id === taskId);
  if (targetTask && targetTask.status !== targetStatus) {
    try {
      await taskStore.updateTask(taskId, { status: targetStatus });
      toastStore.addToast({
        title: 'Tarea Movida',
        message: `"${targetTask.title}" se movió a ${statusLabel(targetStatus)}.`,
        type: 'info'
      });
    } catch (err) {
      toastStore.addToast({ title: 'Error', message: 'No se pudo mover la tarjeta.', type: 'danger' });
    }
  }
};

// Reordenamiento manual al soltar directamente sobre una tarjeta especifica
const handleDropOnCard = async ({ draggedTaskId, targetTask }) => {
  activeDragColumn.value = null;
  if (!draggedTaskId || draggedTaskId === targetTask.id) return;

  const draggedIdx = taskStore.tasks.findIndex(t => t.id === draggedTaskId);
  const targetIdx = taskStore.tasks.findIndex(t => t.id === targetTask.id);

  if (draggedIdx !== -1 && targetIdx !== -1) {
    const [movedTask] = taskStore.tasks.splice(draggedIdx, 1);
    const oldStatus = movedTask.status;
    movedTask.status = targetTask.status;
    taskStore.tasks.splice(targetIdx, 0, movedTask);

    if (oldStatus !== targetTask.status) {
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
      <p class="text-xs sm:text-sm text-[#6E6E6E]">
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
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-[#E4EAED] space-y-3">
      <div class="flex flex-col md:flex-row items-center gap-3">
        <!-- Input de Busqueda en Tiempo Real -->
        <div class="relative flex-1 w-full">
          <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A2A2A2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Buscar tareas por título..."
            class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          />
          <!-- Boton Limpiar dentro del Input -->
          <button
            v-if="searchInput"
            @click="searchInput = ''; handleSearch()"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2A2A2] hover:text-[#263840] transition-colors cursor-pointer"
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
          class="w-full md:w-48 px-3 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
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
          class="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
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
          class="w-full md:w-52 px-3 py-2.5 rounded-xl border border-[#C7C7C7] bg-[#F3F6F7] text-[#263840] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
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
      <div v-if="globalColorMode === 'custom'" class="pt-3 border-t border-[#E4EAED] flex items-center space-x-3 overflow-x-auto">
        <span class="text-xs font-semibold text-[#6E6E6E] shrink-0">Color global para todas las tareas:</span>
        <div class="flex items-center space-x-2">
          <button
            v-for="preset in colorPresets"
            :key="preset.hex"
            @click="globalCustomColor = preset.hex"
            type="button"
            :title="preset.name"
            :class="[
              'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer',
              globalCustomColor === preset.hex ? 'scale-125 border-[#263840] shadow-md' : 'border-transparent hover:scale-110'
            ]"
            :style="{ backgroundColor: preset.hex }"
          ></button>
          <!-- Selector Libre Color Picker -->
          <input
            v-model="globalCustomColor"
            type="color"
            class="w-7 h-7 rounded-lg border border-[#C7C7C7] cursor-pointer bg-transparent"
            title="Elegir cualquier color hex"
          />
        </div>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="taskStore.loading" class="text-center py-12 bg-white rounded-3xl border border-[#E4EAED]">
      <p class="text-sm text-[#6E6E6E]">Cargando tareas del tablero Kanban...</p>
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
          activeDragColumn === 'TODO' ? 'bg-sky-50/80 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] border-[#E4EAED]'
        ]"
      >
        <!-- Encabezado de Columna con Controles de Orden y Filtro -->
        <div class="space-y-2 pb-2 border-b border-[#E4EAED]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#A2A2A2]"></span>
              <h3 class="text-xs font-bold text-[#263840] uppercase tracking-wider">
                Por Hacer
              </h3>
              <span class="bg-[#E4EAED] text-[#263840] text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedTodoTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('TODO')"
              type="button"
              class="text-[#5C7E8F] hover:text-[#263840] p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedTodoTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] italic border-2 border-dashed border-[#C7C7C7]/40 rounded-2xl">
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
          activeDragColumn === 'IN_PROGRESS' ? 'bg-sky-50/80 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] border-[#E4EAED]'
        ]"
      >
        <div class="space-y-2 pb-2 border-b border-[#E4EAED]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#5C7E8F]"></span>
              <h3 class="text-xs font-bold text-[#263840] uppercase tracking-wider">
                En Progreso
              </h3>
              <span class="bg-[#5C7E8F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedInProgressTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('IN_PROGRESS')"
              type="button"
              class="text-[#5C7E8F] hover:text-[#263840] p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedInProgressTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] italic border-2 border-dashed border-[#C7C7C7]/40 rounded-2xl">
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
          activeDragColumn === 'REVIEW' ? 'bg-sky-50/80 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] border-[#E4EAED]'
        ]"
      >
        <div class="space-y-2 pb-2 border-b border-[#E4EAED]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#8CA7B3]"></span>
              <h3 class="text-xs font-bold text-[#263840] uppercase tracking-wider">
                En Revisión
              </h3>
              <span class="bg-[#8CA7B3] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedReviewTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('REVIEW')"
              type="button"
              class="text-[#5C7E8F] hover:text-[#263840] p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedReviewTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] italic border-2 border-dashed border-[#C7C7C7]/40 rounded-2xl">
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
          activeDragColumn === 'DONE' ? 'bg-sky-50/80 border-[#5C7E8F] ring-2 ring-[#5C7E8F]' : 'bg-[#F3F6F7] border-[#E4EAED]'
        ]"
      >
        <div class="space-y-2 pb-2 border-b border-[#E4EAED]">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#263840]"></span>
              <h3 class="text-xs font-bold text-[#263840] uppercase tracking-wider">
                Completado
              </h3>
              <span class="bg-[#263840] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {{ processedDoneTasks.length }}
              </span>
            </div>
            <button
              @click="openCreateModal('DONE')"
              type="button"
              class="text-[#5C7E8F] hover:text-[#263840] p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
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
              class="text-[11px] py-1 px-2 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5C7E8F]"
            >
              <option value="">Todas prioridades</option>
              <option value="URGENT">Urgente</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </div>
        </div>

        <div v-if="processedDoneTasks.length === 0" class="text-center py-12 text-xs text-[#A2A2A2] italic border-2 border-dashed border-[#C7C7C7]/40 rounded-2xl">
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

    <!-- Modales para Crear/Editar, Detalles/Comentarios y Confirmacion -->
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
