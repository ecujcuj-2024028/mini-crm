<script setup>
import { ref, watch, onMounted } from 'vue';
import { useUserStore } from '../../stores/user.store';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';
import AppDatePicker from '../common/AppDatePicker.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'save']);
const userStore = useUserStore();

const name = ref('');
const description = ref('');
const status = ref('ACTIVE');
const startDate = ref('');
const endDate = ref('');
const assignedUserId = ref('');
const colorMode = ref('default');
const customColor = ref('#5C7E8F');
const dateError = ref('');

// Paleta de colores predefinidos para la tarjeta individual
const colorPresets = [
  { name: 'Azul CRM', hex: '#5C7E8F' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rojo', hex: '#EF4444' }
];

onMounted(() => {
  if (userStore.users.length === 0) {
    userStore.fetchUsers(1);
  }
});

watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      name.value = newProject.name || '';
      description.value = newProject.description || '';
      status.value = newProject.status || 'ACTIVE';
      startDate.value = formatDateForInput(newProject.startDate);
      endDate.value = formatDateForInput(newProject.endDate);
      assignedUserId.value = newProject.owner?.id || '';

      // Cargar configuración de color individual del proyecto desde localStorage
      const savedColors = JSON.parse(localStorage.getItem('crm_individual_project_colors') || '{}');
      const projectColorSetting = savedColors[newProject.id] || {};
      colorMode.value = projectColorSetting.colorMode || 'default';
      customColor.value = projectColorSetting.customColor || '#5C7E8F';
    } else {
      name.value = '';
      description.value = '';
      status.value = 'ACTIVE';
      startDate.value = '';
      endDate.value = '';
      assignedUserId.value = '';
      colorMode.value = 'default';
      customColor.value = '#5C7E8F';
    }
    dateError.value = '';
  },
  { immediate: true }
);

function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  const d = new Date(Number(dateVal) || dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

const handleSubmit = () => {
  dateError.value = '';
  if (!name.value) return;

  // Validación de rango de fechas (endDate >= startDate)
  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    dateError.value = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    return;
  }

  const payload = {
    name: name.value,
    description: description.value || null,
    status: status.value,
    startDate: startDate.value || null,
    endDate: endDate.value || null,
    colorMode: colorMode.value,
    customColor: customColor.value
  };

  if (assignedUserId.value) {
    payload.assignedUserId = assignedUserId.value;
  }

  emit('save', payload);
};
</script>

<template>
  <AppModal
    :show="show"
    :title="project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'"
    maxWidth="max-w-xl"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Nombre del Proyecto -->
      <AppInput
        v-model="name"
        label="Nombre del proyecto"
        placeholder="ej: Rediseño Web Corporativo"
        required
      />

      <!-- Descripcion -->
      <div>
        <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
          Descripción del proyecto
        </label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Detalla los objetivos principales y entregables..."
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] placeholder-[#A2A2A2] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        ></textarea>
      </div>

      <!-- Selector de Propietario / Usuario Asignado -->
      <div>
        <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5 flex items-center justify-between">
          <span>Propietario / Usuario Asignado del Proyecto</span>
          <span class="text-[10px] text-[#5C7E8F] dark:text-[#8CA7B3] font-semibold">Miembro del equipo</span>
        </label>
        <select
          v-model="assignedUserId"
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="">-- Sin reasignar (Mantener propietario actual) --</option>
          <option
            v-for="user in userStore.users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name }} ({{ user.email }})
          </option>
        </select>
      </div>

      <!-- Selector de Estado & Estilo de Color Individual -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5">
            Estado del proyecto
          </label>
          <select
            v-model="status"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          >
            <option value="ACTIVE">Activo</option>
            <option value="PAUSED">En pausa</option>
            <option value="COMPLETED">Completado</option>
          </select>
        </div>

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
            <option value="custom">Color Personalizado</option>
          </select>
        </div>
      </div>

      <!-- Paleta de Colores Individual para esta tarjeta -->
      <div v-if="colorMode === 'custom'" class="p-3 bg-[#F3F6F7] dark:bg-[#121E24] rounded-xl border border-[#E4EAED] dark:border-[#2E3F49] space-y-2">
        <label class="block text-xs font-semibold text-[#263840] dark:text-[#F3F6F7]">
          Elige el color para este proyecto:
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

      <!-- Rango de Fechas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Fecha de Inicio -->
        <AppDatePicker
          v-model="startDate"
          label="Fecha de inicio"
          placeholder="Seleccionar fecha inicio"
          dropDirection="up"
        />

        <!-- Fecha de Fin / Entrega -->
        <AppDatePicker
          v-model="endDate"
          label="Fecha de fin / entrega"
          placeholder="Seleccionar fecha fin"
          dropDirection="up"
        />
      </div>

      <!-- Alerta Error de Fechas -->
      <p v-if="dateError" class="text-xs text-red-600 dark:text-red-400 font-medium">
        {{ dateError }}
      </p>

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
          {{ project ? 'Guardar Cambios' : 'Crear Proyecto' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
