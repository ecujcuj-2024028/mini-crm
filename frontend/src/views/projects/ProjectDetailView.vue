<script setup>
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../../stores/project.store';
import AppButton from '../../components/common/AppButton.vue';
import AppBadge from '../../components/common/AppBadge.vue';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

onMounted(async () => {
  const id = route.params.id;
  if (id) {
    await projectStore.fetchProjectById(id);
  }
});

const project = computed(() => projectStore.currentProject);

const formattedDate = (dateVal) => {
  if (!dateVal) return 'No especificada';
  if (typeof dateVal === 'string' && dateVal.includes('-')) {
    const cleanStr = dateVal.split('T')[0];
    const [year, month, day] = cleanStr.split('-').map(Number);
    if (year && month && day) {
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  const numVal = Number(dateVal);
  const d = new Date(isNaN(numVal) ? dateVal : numVal);
  if (isNaN(d.getTime())) return dateVal;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};
</script>

<template>
  <div class="space-y-6">
    <!-- Boton Volver a Proyectos -->
    <div>
      <button
        @click="router.push('/projects')"
        type="button"
        class="inline-flex items-center text-xs font-semibold text-[#5C7E8F] hover:text-[#263840] transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Volver a la lista de proyectos</span>
      </button>
    </div>

    <!-- Carga / Error -->
    <div v-if="projectStore.loading" class="text-center py-12 bg-white rounded-3xl border border-[#E4EAED]">
      <p class="text-sm text-[#6E6E6E]">Cargando detalle del proyecto...</p>
    </div>

    <div v-else-if="!project" class="text-center py-12 bg-white rounded-3xl border border-[#E4EAED]">
      <p class="text-sm text-[#6E6E6E]">No se encontró el proyecto solicitado.</p>
    </div>

    <!-- Tarjeta Principal de Detalle (Diseño Figma) -->
    <div v-else class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E4EAED] space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4EAED]">
        <div>
          <div class="flex items-center space-x-3 mb-2">
            <h2 class="text-2xl font-bold text-[#263840] tracking-tight">
              {{ project.name }}
            </h2>
            <AppBadge :variant="project.status">
              {{ project.status }}
            </AppBadge>
          </div>
          <p class="text-xs text-[#6E6E6E]">
            Creado por <strong class="text-[#263840]">{{ project.owner?.name }}</strong> ({{ project.owner?.email }})
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <AppButton
            @click="router.push('/tasks')"
            variant="primary"
          >
            Ver Tablero de Tareas
          </AppButton>
        </div>
      </div>

      <!-- Descripcion -->
      <div>
        <h4 class="text-xs font-bold text-[#6E6E6E] uppercase tracking-wider mb-2">
          Descripción del Proyecto
        </h4>
        <p class="text-sm text-[#4A4A4A] leading-relaxed">
          {{ project.description || 'Sin descripción ingresada.' }}
        </p>
      </div>

      <!-- Informacion de Fechas & Metricas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E4EAED]">
        <div class="p-4 rounded-2xl bg-[#F3F6F7] border border-[#E4EAED]">
          <p class="text-[11px] font-mono text-[#6E6E6E] uppercase">FECHA INICIO</p>
          <p class="text-sm font-bold text-[#263840] mt-1">{{ formattedDate(project.startDate) }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-[#F3F6F7] border border-[#E4EAED]">
          <p class="text-[11px] font-mono text-[#6E6E6E] uppercase">FECHA ENTREGA</p>
          <p class="text-sm font-bold text-[#263840] mt-1">{{ formattedDate(project.endDate) }}</p>
        </div>

        <div class="p-4 rounded-2xl bg-[#F3F6F7] border border-[#E4EAED]">
          <p class="text-[11px] font-mono text-[#6E6E6E] uppercase">TOTAL TAREAS</p>
          <p class="text-sm font-bold text-[#263840] mt-1">{{ project.tasksCount || 0 }} Tareas registradas</p>
        </div>
      </div>
    </div>
  </div>
</template>
