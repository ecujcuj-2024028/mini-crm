<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDashboardStore } from '../../stores/dashboard.store';
import { useAuthStore } from '../../stores/auth.store';
import AppButton from '../../components/common/AppButton.vue';
import AppDatePicker from '../../components/common/AppDatePicker.vue';

const dashboardStore = useDashboardStore();
const authStore = useAuthStore();

const activePreset = ref('all');

onMounted(() => {
  dashboardStore.fetchSummary();
});

const applyPreset = (preset) => {
  activePreset.value = preset;
  dashboardStore.setPresetRange(preset);
};

const handleCustomDateFilter = () => {
  activePreset.value = 'custom';
  dashboardStore.fetchSummary(dashboardStore.startDate, dashboardStore.endDate);
};

const clearDateFilter = () => {
  activePreset.value = 'all';
  dashboardStore.setPresetRange('all');
};

// Tasa de finalización global de tareas (%)
const globalTaskCompletionRate = computed(() => {
  if (!dashboardStore.summary?.totalTasks) return 0;
  return Math.round((dashboardStore.summary.completedTasks / dashboardStore.summary.totalTasks) * 100);
});

// Tasa de finalización personal del usuario (%)
const myTaskCompletionRate = computed(() => {
  if (!dashboardStore.summary?.myTotalTasks) return 0;
  return Math.round((dashboardStore.summary.myCompletedTasks / dashboardStore.summary.myTotalTasks) * 100);
});

// Tasa de finalización de proyectos (%)
const projectCompletionRate = computed(() => {
  if (!dashboardStore.summary?.totalProjects) return 0;
  return Math.round((dashboardStore.summary.completedProjects / dashboardStore.summary.totalProjects) * 100);
});

// Conteo específico por estado de tarea en Kanban
const getTaskCountByStatus = (st) => {
  if (!dashboardStore.summary?.tasksByStatus) return 0;
  const match = dashboardStore.summary.tasksByStatus.find(item => item.status === st);
  return match ? match.count : 0;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado con Bienvenida y Controles de Fecha (Time-Boxing) -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1A2830] p-6 rounded-3xl border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs">
      <div>
        <h2 class="text-xl font-extrabold text-[#263840] dark:text-[#F3F6F7] tracking-tight">
          ¡Hola de nuevo, {{ authStore.user?.name || 'Usuario' }}!
        </h2>
        <p class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] mt-1">
          Panel de control con métricas globales, progreso personal y actividades del CRM.
        </p>
      </div>

      <!-- Selector de Rango de Fechas (Time-Boxing) -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <!-- Atajos Rápidos -->
        <div class="flex items-center bg-[#F3F6F7] dark:bg-[#121E24] p-1 rounded-xl border border-[#E4EAED] dark:border-[#2E3F49] w-full sm:w-auto shrink-0">
          <button
            @click="applyPreset('all')"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex-1 sm:flex-none',
              activePreset === 'all' ? 'bg-white dark:bg-[#1A2830] text-[#263840] dark:text-[#F3F6F7] shadow-2xs' : 'text-[#6E6E6E] dark:text-[#A2B3BC] hover:text-[#263840] dark:hover:text-white'
            ]"
          >
            Todo
          </button>
          <button
            @click="applyPreset('month')"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex-1 sm:flex-none',
              activePreset === 'month' ? 'bg-white dark:bg-[#1A2830] text-[#263840] dark:text-[#F3F6F7] shadow-2xs' : 'text-[#6E6E6E] dark:text-[#A2B3BC] hover:text-[#263840] dark:hover:text-white'
            ]"
          >
            Este Mes
          </button>
          <button
            @click="applyPreset('year')"
            type="button"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex-1 sm:flex-none',
              activePreset === 'year' ? 'bg-white dark:bg-[#1A2830] text-[#263840] dark:text-[#F3F6F7] shadow-2xs' : 'text-[#6E6E6E] dark:text-[#A2B3BC] hover:text-[#263840] dark:hover:text-white'
            ]"
          >
            Este Año
          </button>
        </div>

        <!-- Rango de Fechas Libre con Calendario Elegante Personalizado (AppDatePicker) -->
        <div class="flex items-center space-x-2 w-full sm:w-auto">
          <AppDatePicker
            v-model="dashboardStore.startDate"
            placeholder="Fecha inicio"
            dropDirection="down"
            align="right"
            compact
            @update:modelValue="handleCustomDateFilter"
            class="w-36 sm:w-40"
          />
          <span class="text-xs text-[#A2A2A2] dark:text-[#5E717B] font-bold">a</span>
          <AppDatePicker
            v-model="dashboardStore.endDate"
            placeholder="Fecha fin"
            dropDirection="down"
            align="right"
            compact
            @update:modelValue="handleCustomDateFilter"
            class="w-36 sm:w-40"
          />

          <button
            v-if="dashboardStore.startDate || dashboardStore.endDate"
            @click="clearDateFilter"
            type="button"
            class="text-[#A2A2A2] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white p-1 transition-colors cursor-pointer shrink-0"
            title="Limpiar fechas"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="dashboardStore.loading" class="text-center py-16 bg-white dark:bg-[#1A2830] rounded-3xl border border-[#E4EAED] dark:border-[#2E3F49]">
      <p class="text-sm text-[#6E6E6E] dark:text-[#A2B3BC]">Cargando estadísticas y métricas del Dashboard...</p>
    </div>

    <!-- Estado de Error -->
    <div v-else-if="dashboardStore.error" class="p-6 bg-red-50 dark:bg-red-950/40 rounded-3xl border border-red-200 dark:border-red-800 text-center space-y-3">
      <p class="text-sm font-bold text-red-700 dark:text-red-300">Ocurrió un problema al cargar el Dashboard</p>
      <p class="text-xs text-red-600 dark:text-red-400">{{ dashboardStore.error }}</p>
      <AppButton @click="dashboardStore.fetchSummary()" variant="outline" class="mx-auto text-xs">
        Reintentar
      </AppButton>
    </div>

    <!-- Contenido del Dashboard -->
    <div v-else-if="dashboardStore.summary" class="space-y-6">

      <!-- SECCIÓN 1: Tarjetas KPI de Rendimiento Personal del Usuario -->
      <div class="space-y-3">
        <h3 class="text-xs font-extrabold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider flex items-center space-x-2">
          <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Mi Rendimiento Personal</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Mi KPI 1: Mis Proyectos -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Mis Proyectos</span>
              <div class="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                {{ dashboardStore.summary.myProjectsCount }}
              </h3>
              <p class="text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-2 pt-2 border-t border-[#E4EAED] dark:border-[#2E3F49]">
                Proyectos donde participas o eres responsable
              </p>
            </div>
          </div>

          <!-- Mi KPI 2: Tareas Asignadas -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Tareas Asignadas</span>
              <div class="w-9 h-9 rounded-2xl bg-[#5C7E8F]/10 text-[#5C7E8F] dark:text-[#8CA7B3] flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                {{ dashboardStore.summary.myTotalTasks }}
              </h3>
              <div class="flex items-center space-x-2 text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-2 pt-2 border-t border-[#E4EAED] dark:border-[#2E3F49]">
                <span class="text-amber-600 dark:text-amber-400 font-bold">{{ dashboardStore.summary.myPendingTasks }} Pendientes</span>
                <span>•</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ dashboardStore.summary.myCompletedTasks }} Listas</span>
              </div>
            </div>
          </div>

          <!-- Mi KPI 3: Tareas Completadas -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Tareas Completadas</span>
              <div class="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                {{ dashboardStore.summary.myCompletedTasks }}
              </h3>
              <p class="text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-2 pt-2 border-t border-[#E4EAED] dark:border-[#2E3F49]">
                Tareas finalizadas con éxito
              </p>
            </div>
          </div>

          <!-- Mi KPI 4: Mi Eficiencia (%) -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Mi Eficiencia</span>
              <div class="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                  {{ myTaskCompletionRate }}%
                </h3>
                <span class="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  Personal
                </span>
              </div>
              <div class="w-full bg-[#E4EAED] dark:bg-[#2E3F49] h-2 rounded-full overflow-hidden">
                <div
                  class="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${myTaskCompletionRate}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: Métricas Globales del CRM -->
      <div class="space-y-3 pt-2">
        <h3 class="text-xs font-extrabold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider flex items-center space-x-2">
          <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Visión Global del CRM</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Global 1: Usuarios Activos -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Usuarios Activos</span>
              <div class="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                {{ dashboardStore.summary.activeUsersCount }}
              </h3>
              <p class="text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-2 pt-2 border-t border-[#E4EAED] dark:border-[#2E3F49]">
                Miembros activos colaborando en el equipo
              </p>
            </div>
          </div>

          <!-- Global 2: Proyectos Totales -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Proyectos del CRM</span>
              <div class="w-9 h-9 rounded-2xl bg-[#5C7E8F]/10 text-[#5C7E8F] dark:text-[#8CA7B3] flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                {{ dashboardStore.summary.totalProjects }}
              </h3>
              <div class="flex items-center space-x-2 text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-2 pt-2 border-t border-[#E4EAED] dark:border-[#2E3F49]">
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ dashboardStore.summary.activeProjects }} Activos</span>
                <span>•</span>
                <span class="text-amber-600 dark:text-amber-400 font-bold">{{ dashboardStore.summary.pausedProjects }} Pausa</span>
              </div>
            </div>
          </div>

          <!-- Global 3: Tareas Actuales -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Tareas Actuales</span>
              <div class="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                {{ dashboardStore.summary.totalTasks }}
              </h3>
              <div class="flex items-center space-x-2 text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-2 pt-2 border-t border-[#E4EAED] dark:border-[#2E3F49]">
                <span class="text-amber-600 dark:text-amber-400 font-bold">{{ dashboardStore.summary.pendingTasks }} Pendientes</span>
                <span>•</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ dashboardStore.summary.completedTasks }} Hechas</span>
              </div>
            </div>
          </div>

          <!-- Global 4: Tasa Global de Finalización -->
          <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-5 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase tracking-wider">Tareas Completadas</span>
              <div class="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-3xl font-extrabold text-[#263840] dark:text-[#F3F6F7]">
                  {{ dashboardStore.summary.completedTasks }}
                </h3>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {{ globalTaskCompletionRate }}% Éxito
                </span>
              </div>
              <div class="w-full bg-[#E4EAED] dark:bg-[#2E3F49] h-2 rounded-full overflow-hidden">
                <div
                  class="bg-[#10B981] h-full rounded-full transition-all duration-500"
                  :style="{ width: `${globalTaskCompletionRate}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 3: Gráficos Visuales e Indicadores por Estado Kanban -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico 1: Estado de Proyectos -->
        <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-6 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
            <h3 class="text-sm font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider">
              Avance de Proyectos
            </h3>
            <span class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] font-medium">Progreso Global: {{ projectCompletionRate }}%</span>
          </div>

          <div class="space-y-3">
            <!-- Activos -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-[#263840] dark:text-[#F3F6F7]">Activos</span>
                <span class="text-[#6E6E6E] dark:text-[#A2B3BC]">{{ dashboardStore.summary.activeProjects }} proyectos</span>
              </div>
              <div class="w-full bg-[#E4EAED] dark:bg-[#2E3F49] h-2.5 rounded-full overflow-hidden">
                <div
                  class="bg-[#5C7E8F] h-full rounded-full transition-all duration-500"
                  :style="{ width: `${dashboardStore.summary.totalProjects ? (dashboardStore.summary.activeProjects / dashboardStore.summary.totalProjects) * 100 : 0}%` }"
                ></div>
              </div>
            </div>

            <!-- Completados -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-emerald-700 dark:text-emerald-400">Completados</span>
                <span class="text-[#6E6E6E] dark:text-[#A2B3BC]">{{ dashboardStore.summary.completedProjects }} proyectos</span>
              </div>
              <div class="w-full bg-[#E4EAED] dark:bg-[#2E3F49] h-2.5 rounded-full overflow-hidden">
                <div
                  class="bg-[#10B981] h-full rounded-full transition-all duration-500"
                  :style="{ width: `${dashboardStore.summary.totalProjects ? (dashboardStore.summary.completedProjects / dashboardStore.summary.totalProjects) * 100 : 0}%` }"
                ></div>
              </div>
            </div>

            <!-- Pausados -->
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-amber-700 dark:text-amber-400">Pausados</span>
                <span class="text-[#6E6E6E] dark:text-[#A2B3BC]">{{ dashboardStore.summary.pausedProjects }} proyectos</span>
              </div>
              <div class="w-full bg-[#E4EAED] dark:bg-[#2E3F49] h-2.5 rounded-full overflow-hidden">
                <div
                  class="bg-[#F59E0B] h-full rounded-full transition-all duration-500"
                  :style="{ width: `${dashboardStore.summary.totalProjects ? (dashboardStore.summary.pausedProjects / dashboardStore.summary.totalProjects) * 100 : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráfico 2: Desglose por Columnas Kanban -->
        <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-6 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
            <h3 class="text-sm font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider">
              Desglose de Tareas en Kanban
            </h3>
            <span class="text-xs text-[#6E6E6E] dark:text-[#A2B3BC] font-medium">Total: {{ dashboardStore.summary.totalTasks }}</span>
          </div>

          <!-- Cuadrícula de 4 Columnas Kanban -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-[#F3F6F7] dark:bg-[#121E24] rounded-2xl border border-[#E4EAED] dark:border-[#2E3F49] text-center">
              <span class="text-[10px] font-bold text-[#6E6E6E] dark:text-[#A2B3BC] uppercase">Por Hacer</span>
              <h4 class="text-xl font-extrabold text-[#263840] dark:text-[#F3F6F7] mt-1">
                {{ getTaskCountByStatus('TODO') }}
              </h4>
            </div>
            <div class="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
              <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">En Progreso</span>
              <h4 class="text-xl font-extrabold text-amber-800 dark:text-amber-200 mt-1">
                {{ getTaskCountByStatus('IN_PROGRESS') }}
              </h4>
            </div>
            <div class="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-center">
              <span class="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">En Revisión</span>
              <h4 class="text-xl font-extrabold text-purple-800 dark:text-purple-200 mt-1">
                {{ getTaskCountByStatus('REVIEW') }}
              </h4>
            </div>
            <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
              <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Completado</span>
              <h4 class="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1">
                {{ getTaskCountByStatus('DONE') }}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 4: Feed de Actividad Reciente (Proyectos & Tareas) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Lista de Proyectos Recientes -->
        <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-6 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
            <h3 class="text-sm font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider flex items-center space-x-2">
              <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Proyectos Recientes</span>
            </h3>
            <router-link to="/projects" class="text-xs font-bold text-[#5C7E8F] dark:text-[#8CA7B3] hover:underline">
              Ver todos ➔
            </router-link>
          </div>

          <div v-if="dashboardStore.summary.recentProjects.length === 0" class="text-center py-8 text-xs text-[#A2A2A2] dark:text-[#5E717B] italic">
            No hay proyectos recientes en el rango seleccionado.
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="p in dashboardStore.summary.recentProjects"
              :key="p.id"
              :to="`/projects/${p.id}`"
              class="p-3.5 rounded-2xl bg-[#F3F6F7] dark:bg-[#121E24] hover:bg-[#E4EAED] dark:hover:bg-[#263840] border border-[#E4EAED] dark:border-[#2E3F49] flex items-center justify-between transition-colors block group"
            >
              <div>
                <h4 class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] group-hover:text-[#5C7E8F] dark:group-hover:text-[#8CA7B3]">
                  {{ p.name }}
                </h4>
                <p class="text-[11px] text-[#6E6E6E] dark:text-[#A2B3BC] mt-0.5">
                  Líder: {{ p.owner?.name || p.user?.name || 'Sin asignar' }}
                </p>
              </div>

              <div class="flex items-center space-x-2">
                <span :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                  p.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : p.status === 'PAUSED' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                ]">
                  {{ p.status === 'ACTIVE' ? 'Activo' : p.status === 'PAUSED' ? 'Pausado' : 'Completado' }}
                </span>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Lista de Tareas Recientes -->
        <div class="bg-white dark:bg-[#1A2830] rounded-3xl p-6 border border-[#E4EAED] dark:border-[#2E3F49] shadow-2xs space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E4EAED] dark:border-[#2E3F49]">
            <h3 class="text-sm font-bold text-[#263840] dark:text-[#F3F6F7] uppercase tracking-wider flex items-center space-x-2">
              <svg class="w-4 h-4 text-[#5C7E8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Tareas Recientes</span>
            </h3>
            <router-link to="/tasks" class="text-xs font-bold text-[#5C7E8F] dark:text-[#8CA7B3] hover:underline">
              Ver Kanban ➔
            </router-link>
          </div>

          <div v-if="dashboardStore.summary.recentTasks.length === 0" class="text-center py-8 text-xs text-[#A2A2A2] dark:text-[#5E717B] italic">
            No hay tareas recientes en el rango seleccionado.
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="t in dashboardStore.summary.recentTasks"
              :key="t.id"
              to="/tasks"
              class="p-3.5 rounded-2xl bg-[#F3F6F7] dark:bg-[#121E24] hover:bg-[#E4EAED] dark:hover:bg-[#263840] border border-[#E4EAED] dark:border-[#2E3F49] flex items-center justify-between transition-colors block group"
            >
              <div>
                <div class="flex items-center space-x-2">
                  <span class="text-[9px] font-bold text-[#5C7E8F] dark:text-[#8CA7B3] uppercase bg-white dark:bg-[#1A2830] px-1.5 py-0.5 rounded border border-[#E4EAED] dark:border-[#2E3F49]">
                    {{ t.project?.name || 'Proyecto' }}
                  </span>
                  <span class="text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                    {{ t.priority }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] group-hover:text-[#5C7E8F] dark:group-hover:text-[#8CA7B3] mt-1">
                  {{ t.title }}
                </h4>
              </div>

              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white dark:bg-[#1A2830] border border-[#C7C7C7] dark:border-[#2E3F49] text-[#4A4A4A] dark:text-[#D4DDE2]">
                  {{ t.status }}
                </span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
