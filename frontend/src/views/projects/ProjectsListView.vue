<script setup>
import { ref, computed, onMounted } from 'vue';
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

// Filtros Locales
const searchInput = ref('');
const selectedStatus = ref('');

// Modo de Color de Tarjetas (Persistencia Local): 'individual', 'default', 'status', 'custom'
const globalColorMode = ref(localStorage.getItem('crm_project_global_color_mode') || 'individual');
const globalCustomColor = ref(localStorage.getItem('crm_project_global_custom_color') || '#5C7E8F');
const savedIndividualColors = ref(JSON.parse(localStorage.getItem('crm_individual_project_colors') || '{}'));

// Presets de colores sugeridos para proyectos
const colorPresets = [
  { name: 'Slate Azul', hex: '#5C7E8F' },
  { name: 'Verde Esmeralda', hex: '#10B981' },
  { name: 'Ámbar Cálido', hex: '#F59E0B' },
  { name: 'Púrpura Elegante', hex: '#8B5CF6' },
  { name: 'Gris Oscuro', hex: '#263840' }
];

// Modales
const showProjectModal = ref(false);
const showConfirmModal = ref(false);

const selectedProject = ref(null);
const projectToToggle = ref(null);

const confirmTitle = computed(() => {
  if (!projectToToggle.value) return 'Confirmar Acción';
  return projectToToggle.value.isActive ? 'Desactivar Proyecto' : 'Restaurar Proyecto';
});

const confirmMessage = computed(() => {
  if (!projectToToggle.value) return '';
  return projectToToggle.value.isActive
    ? `¿Estás seguro de que deseas desactivar "${projectToToggle.value.name}"?`
    : `¿Deseas reactivar el proyecto "${projectToToggle.value.name}"?`;
});

onMounted(() => {
  fetchProjects();
});

const fetchProjects = (page = 1) => {
  projectStore.fetchProjects({
    search: searchInput.value,
    status: selectedStatus.value,
    page
  });
};

// Búsqueda y filtrado
const handleSearch = () => {
  fetchProjects(1);
};

const clearFilters = () => {
  searchInput.value = '';
  selectedStatus.value = '';
  fetchProjects(1);
};

// Guardar preferencia global de modo de color
const updateGlobalColorSettings = () => {
  localStorage.setItem('crm_project_global_color_mode', globalColorMode.value);
  localStorage.setItem('crm_project_global_custom_color', globalCustomColor.value);
};

// Determinar el modo de color exacto para cada tarjeta
const getCardColorMode = (projectId) => {
  if (globalColorMode.value !== 'individual') {
    return globalColorMode.value;
  }
  return savedIndividualColors.value[projectId]?.colorMode || 'default';
};

const getCardCustomColor = (projectId) => {
  if (globalColorMode.value === 'custom') {
    return globalCustomColor.value;
  }
  return savedIndividualColors.value[projectId]?.customColor || '#5C7E8F';
};

// Cambiar página
const handlePageChange = (newPage) => {
  fetchProjects(newPage);
};

// Navegar al tablero de tareas filtrando por este proyecto
const goToProjectTasks = (projectId) => {
  router.push({ path: '/tasks', query: { projectId } });
};

// Navegar al detalle del proyecto
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

// Abrir confirmación desactivar / restaurar
const promptToggleProject = (project) => {
  projectToToggle.value = project;
  showConfirmModal.value = true;
};

// Confirmar desactivar / restaurar
const handleConfirmToggle = async () => {
  if (!projectToToggle.value) return;

  const isDeleting = projectToToggle.value.isActive;
  try {
    if (isDeleting) {
      await projectStore.deleteProject(projectToToggle.value.id);
      toastStore.addToast({ title: 'Proyecto Desactivado', message: 'El proyecto fue desactivado correctamente.', type: 'info' });
    } else {
      await projectStore.restoreProject(projectToToggle.value.id);
      toastStore.addToast({ title: 'Proyecto Restaurado', message: 'El proyecto fue reactivado con éxito.', type: 'info' });
    }
  } catch (err) {
    toastStore.addToast({ title: 'Error', message: err.message || 'No se pudo actualizar el estado del proyecto.', type: 'danger' });
  } finally {
    showConfirmModal.value = false;
    projectToToggle.value = null;
  }
};

// Guardar proyecto (Crear / Editar) y guardar su configuración de color individual
const handleSaveProject = async (payload) => {
  const { colorMode: projColorMode, customColor: projCustomColor, ...input } = payload;

  try {
    if (selectedProject.value) {
      await projectStore.updateProject(selectedProject.value.id, input);
      savedIndividualColors.value[selectedProject.value.id] = {
        colorMode: projColorMode,
        customColor: projCustomColor
      };
      localStorage.setItem('crm_individual_project_colors', JSON.stringify(savedIndividualColors.value));
      toastStore.addToast({ title: 'Proyecto Actualizado', message: 'Los cambios fueron guardados.', type: 'info' });
    } else {
      await projectStore.createProject(input);
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
      <p class="text-xs sm:text-sm text-[#6E6E6E] dark:text-[#A2B3BC]">
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
            placeholder="Buscar proyecto por nombre..."
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

        <!-- Selector Filtro Estado -->
        <select
          v-model="selectedStatus"
          @change="handleSearch"
          class="w-full md:w-44 px-3 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PAUSED">En pausa</option>
          <option value="COMPLETED">Completado</option>
        </select>

        <!-- Selector Modo de Color Limpio -->
        <select
          v-model="globalColorMode"
          @change="updateGlobalColorSettings"
          class="w-full md:w-52 px-3 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-[#F3F6F7] dark:bg-[#121E24] text-[#263840] dark:text-[#F3F6F7] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
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

      <!-- Selector de Paleta de Colores Personalizados Globales -->
      <div v-if="globalColorMode === 'custom'" class="pt-3 border-t border-[#E4EAED] dark:border-[#2E3F49] flex items-center space-x-3 overflow-x-auto">
        <span class="text-xs font-semibold text-[#6E6E6E] dark:text-[#A2B3BC] shrink-0">Color global para todas las tarjetas:</span>
        <div class="flex items-center space-x-2">
          <button
            v-for="preset in colorPresets"
            :key="preset.hex"
            @click="globalCustomColor = preset.hex; updateGlobalColorSettings()"
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
            @change="updateGlobalColorSettings"
            type="color"
            class="w-7 h-7 rounded-lg border border-[#C7C7C7] dark:border-[#2E3F49] cursor-pointer bg-transparent"
            title="Elegir cualquier color hex"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="projectStore.loading" class="text-center py-16 text-[#6E6E6E] dark:text-[#A2B3BC]">
      Cargando proyectos...
    </div>

    <!-- Empty State -->
    <div v-else-if="projectStore.projects.length === 0" class="bg-white dark:bg-[#1A2830] rounded-3xl p-12 text-center border border-[#E4EAED] dark:border-[#2E3F49]">
      <div class="w-16 h-16 rounded-full bg-[#F3F6F7] dark:bg-[#121E24] text-[#5C7E8F] flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-bold text-[#263840] dark:text-[#F3F6F7] mb-1">No se encontraron proyectos</h3>
      <p class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] max-w-sm mx-auto mb-6">
        No hay proyectos registrados o no coinciden con los filtros aplicados.
      </p>
      <AppButton @click="openCreateModal" variant="primary">
        Crear Primer Proyecto
      </AppButton>
    </div>

    <!-- Grid de Tarjetas de Proyectos -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard
        v-for="project in projectStore.projects"
        :key="project.id"
        :project="project"
        :colorMode="getCardColorMode(project.id)"
        :customColor="getCardCustomColor(project.id)"
        @click="goToProjectTasks"
        @view-details="goToProjectDetail"
        @edit="openEditModal"
        @delete="promptToggleProject"
        @restore="promptToggleProject"
      />
    </div>

    <!-- Pie de Pagina Paginado -->
    <div v-if="projectStore.totalPages > 1" class="bg-white dark:bg-[#1A2830] rounded-2xl border border-[#E4EAED] dark:border-[#2E3F49] p-2">
      <AppPagination
        :page="projectStore.page"
        :totalPages="projectStore.totalPages"
        :totalItems="projectStore.total"
        :itemsPerPage="10"
        @changePage="handlePageChange"
      />
    </div>

    <!-- Modales -->
    <ProjectModal
      :show="showProjectModal"
      :project="selectedProject"
      :loading="projectStore.loading"
      @close="showProjectModal = false"
      @save="handleSaveProject"
    />

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
