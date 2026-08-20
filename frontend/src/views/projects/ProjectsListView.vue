<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../../stores/project.store';
import { useToastStore } from '../../stores/toast.store';
import AppButton from '../../components/common/AppButton.vue';
import AppPagination from '../../components/common/AppPagination.vue';
import AppConfirmModal from '../../components/common/AppConfirmModal.vue';
import ProjectCard from '../../components/projects/ProjectCard.vue';
import ProjectModal from '../../components/projects/ProjectModal.vue';

const router = useRouter();
const projectStore = useProjectStore();
const toastStore = useToastStore();

const searchInput = ref('');
const selectedStatus = ref('');

// Modo de color global de tarjetas ('individual', 'default', 'status', 'custom')
const globalColorMode = ref(localStorage.getItem('crm_project_global_color_mode') || 'individual');
const globalCustomColor = ref(localStorage.getItem('crm_project_global_custom_color') || '#5C7E8F');

// Paleta de colores predefinidos para la barra global
const colorPresets = [
  { name: 'Azul CRM', hex: '#5C7E8F' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rojo', hex: '#EF4444' }
];

// Colores individuales por proyecto guardados en localStorage
const savedIndividualColors = ref(JSON.parse(localStorage.getItem('crm_individual_project_colors') || '{}'));

// Guardar preferencia global en localStorage
watch(globalColorMode, (val) => {
  localStorage.setItem('crm_project_global_color_mode', val);
});

watch(globalCustomColor, (val) => {
  localStorage.setItem('crm_project_global_custom_color', val);
});

// Modales State
const showProjectModal = ref(false);
const showConfirmModal = ref(false);
const selectedProject = ref(null);
const projectToToggle = ref(null);

// Temporizador debounce para busqueda en tiempo real
let searchTimer = null;

onMounted(() => {
  projectStore.fetchProjects(1);
});

// Obtener modo de color especifico para un proyecto
const getProjectColorMode = (projectId) => {
  if (globalColorMode.value !== 'individual') {
    return globalColorMode.value;
  }
  return savedIndividualColors.value[projectId]?.colorMode || 'default';
};

// Obtener color personalizado especifico para un proyecto
const getProjectCustomColor = (projectId) => {
  if (globalColorMode.value !== 'individual') {
    return globalCustomColor.value;
  }
  return savedIndividualColors.value[projectId]?.customColor || '#5C7E8F';
};

// Computed para textos del modal de confirmacion
const confirmTitle = computed(() => {
  return projectToToggle.value?.isActive ? 'Desactivar Proyecto' : 'Restaurar Proyecto';
});

const confirmMessage = computed(() => {
  if (!projectToToggle.value) return '';
  return projectToToggle.value.isActive
    ? `¿Estás seguro de desactivar el proyecto "${projectToToggle.value.name}"? Todas sus tareas pasarán a estado inactivo.`
    : `¿Deseas restaurar el proyecto "${projectToToggle.value.name}"?`;
});

// Watcher reactivo con debounce de 300ms para busqueda en tiempo real al escribir
watch(searchInput, (newVal) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    projectStore.searchQuery = newVal.trim();
    projectStore.statusFilter = selectedStatus.value || null;
    projectStore.fetchProjects(1);
  }, 300);
});

const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  projectStore.searchQuery = searchInput.value.trim();
  projectStore.statusFilter = selectedStatus.value || null;
  projectStore.fetchProjects(1);
};

const clearFilters = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchInput.value = '';
  selectedStatus.value = '';
  projectStore.searchQuery = '';
  projectStore.statusFilter = null;
  projectStore.fetchProjects(1);
};

const handlePageChange = (newPage) => {
  projectStore.fetchProjects(newPage);
};

// Navegar al tablero de tareas del proyecto
const goToTasks = (projectId) => {
  router.push({ path: '/tasks', query: { projectId } });
};

// Navegar al detalle del proyecto (al presionar el icono de informacion (i))
const goToProjectDetail = (projectId) => {
  router.push(`/projects/${projectId}`);
};

// Abrir modal crear
const openCreateModal = () => {
  selectedProject.value = null;
  showProjectModal.value = true;
};

// Abrir modal editar
const openEditModal = (project) => {
  selectedProject.value = project;
  showProjectModal.value = true;
};

// Abrir modal confirmacion desactivar/restaurar
const promptToggleProject = (project) => {
  projectToToggle.value = project;
  showConfirmModal.value = true;
};

// Confirmar desactivar/restaurar proyecto
const handleConfirmToggle = async () => {
  if (!projectToToggle.value) return;
  const project = projectToToggle.value;

  try {
    if (project.isActive) {
      await projectStore.deleteProject(project.id);
      toastStore.addToast({ title: 'Proyecto Desactivado', message: `El proyecto "${project.name}" y sus tareas fueron desactivados.`, type: 'info' });
    } else {
      await projectStore.restoreProject(project.id);
      toastStore.addToast({ title: 'Proyecto Restaurado', message: `El proyecto "${project.name}" fue restaurado con éxito.`, type: 'info' });
    }
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo cambiar el estado del proyecto.', type: 'danger' });
  } finally {
    showConfirmModal.value = false;
    projectToToggle.value = null;
  }
};

// Guardar proyecto y su configuracion de color individual
const handleSaveProject = async (payload) => {
  const { colorMode: projColorMode, customColor: projCustomColor, ...input } = payload;

  try {
    if (selectedProject.value) {
      await projectStore.updateProject(selectedProject.value.id, input);
      // Guardar configuracion de color individual del proyecto
      savedIndividualColors.value[selectedProject.value.id] = {
        colorMode: projColorMode,
        customColor: projCustomColor
      };
      localStorage.setItem('crm_individual_project_colors', JSON.stringify(savedIndividualColors.value));
      toastStore.addToast({ title: 'Proyecto Actualizado', message: 'Los cambios fueron guardados exitosamente.', type: 'info' });
    } else {
      await projectStore.createProject(input);
      // Guardar configuracion de color del proyecto recién creado
      if (projectStore.projects[0]) {
        savedIndividualColors.value[projectStore.projects[0].id] = {
          colorMode: projColorMode,
          customColor: projCustomColor
        };
        localStorage.setItem('crm_individual_project_colors', JSON.stringify(savedIndividualColors.value));
      }
      toastStore.addToast({ title: 'Proyecto Creado', message: 'El proyecto fue registrado correctamente.', type: 'info' });
    }
    showProjectModal.value = false;
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo guardar el proyecto.', type: 'danger' });
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Subtitulo y Boton Crear Nuevo Proyecto -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p class="text-xs sm:text-sm text-[#6E6E6E]">
        Organiza, monitorea progresos y gestiona los proyectos de tu equipo.
      </p>

      <AppButton
        @click="openCreateModal"
        variant="primary"
        class="shrink-0"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Crear Nuevo Proyecto</span>
      </AppButton>
    </div>

    <!-- Barra de Filtros y Selector de Estilo de Tarjetas -->
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
            placeholder="Buscar proyecto por nombre..."
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

        <!-- Selector Filtro Estado -->
        <select
          v-model="selectedStatus"
          @change="handleSearch"
          class="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PAUSED">En pausa</option>
          <option value="COMPLETED">Completado</option>
        </select>

        <!-- Selector Modo de Color Limpio -->
        <select
          v-model="globalColorMode"
          class="w-full md:w-52 px-3 py-2.5 rounded-xl border border-[#C7C7C7] bg-[#F3F6F7] text-[#263840] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="individual">Estilo: Selección Individual</option>
          <option value="default">Global: Por defecto</option>
          <option value="status">Global: Por Estado</option>
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
            v-if="searchInput || selectedStatus"
            @click="clearFilters"
            variant="outline"
            class="flex-1 md:flex-none"
          >
            Limpiar
          </AppButton>
        </div>
      </div>

      <!-- Selector de Paleta de Colores Personalizados Globales (Visible cuando globalColorMode === 'custom') -->
      <div v-if="globalColorMode === 'custom'" class="pt-3 border-t border-[#E4EAED] flex items-center space-x-3 overflow-x-auto">
        <span class="text-xs font-semibold text-[#6E6E6E] shrink-0">Color global para todas las tarjetas:</span>
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

    <!-- Estado de Carga / Vacio -->
    <div v-if="projectStore.loading" class="text-center py-12 bg-white rounded-3xl border border-[#E4EAED]">
      <p class="text-sm text-[#6E6E6E]">Cargando proyectos...</p>
    </div>

    <div v-else-if="projectStore.projects.length === 0" class="text-center py-12 bg-white rounded-3xl border border-[#E4EAED]">
      <p class="text-sm text-[#6E6E6E]">No se encontraron proyectos registrados.</p>
    </div>

    <!-- Grilla de Proyectos con Colores Individuales o Globales -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ProjectCard
        v-for="project in projectStore.projects"
        :key="project.id"
        :project="project"
        :colorMode="getProjectColorMode(project.id)"
        :customColor="getProjectCustomColor(project.id)"
        @click="goToTasks"
        @view-details="goToProjectDetail"
        @edit="openEditModal"
        @delete="promptToggleProject"
        @restore="promptToggleProject"
      />
    </div>

    <!-- Pie con Paginacion -->
    <div v-if="projectStore.total > 0" class="bg-white rounded-2xl border border-[#E4EAED] px-4">
      <AppPagination
        :page="projectStore.page"
        :totalPages="projectStore.totalPages"
        :totalItems="projectStore.total"
        :itemsPerPage="projectStore.limit"
        @changePage="handlePageChange"
      />
    </div>

    <!-- Modal para Crear / Editar Proyecto -->
    <ProjectModal
      :show="showProjectModal"
      :project="selectedProject"
      :loading="projectStore.loading"
      @close="showProjectModal = false"
      @save="handleSaveProject"
    />

    <!-- Modal Elegante de Confirmacion -->
    <AppConfirmModal
      :show="showConfirmModal"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirmText="projectToToggle?.isActive ? 'Desactivar' : 'Restaurar'"
      :variant="projectToToggle?.isActive ? 'danger' : 'primary'"
      :loading="projectStore.loading"
      @close="showConfirmModal = false"
      @confirm="handleConfirmToggle"
    />
  </div>
</template>
