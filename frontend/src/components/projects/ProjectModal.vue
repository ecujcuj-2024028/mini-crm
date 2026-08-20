<script setup>
import { ref, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';

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

const name = ref('');
const description = ref('');
const status = ref('ACTIVE');
const startDate = ref('');
const endDate = ref('');
const dateError = ref('');

watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      name.value = newProject.name || '';
      description.value = newProject.description || '';
      status.value = newProject.status || 'ACTIVE';
      startDate.value = formatDateForInput(newProject.startDate);
      endDate.value = formatDateForInput(newProject.endDate);
    } else {
      name.value = '';
      description.value = '';
      status.value = 'ACTIVE';
      startDate.value = '';
      endDate.value = '';
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

  // Validacion de rango de fechas (endDate >= startDate)
  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    dateError.value = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    return;
  }

  const payload = {
    name: name.value,
    description: description.value || null,
    status: status.value,
    startDate: startDate.value || null,
    endDate: endDate.value || null
  };

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
        <label class="block text-xs font-medium text-[#4A4A4A] mb-1.5">
          Descripción del proyecto
        </label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Detalla los objetivos principales y entregables..."
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        ></textarea>
      </div>

      <!-- Selector de Estado -->
      <div>
        <label class="block text-xs font-medium text-[#4A4A4A] mb-1.5">
          Estado del proyecto
        </label>
        <select
          v-model="status"
          class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
        >
          <option value="ACTIVE">Activo</option>
          <option value="PAUSED">En pausa</option>
          <option value="COMPLETED">Completado</option>
        </select>
      </div>

      <!-- Rango de Fechas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] mb-1.5">
            Fecha de inicio
          </label>
          <input
            v-model="startDate"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-[#4A4A4A] mb-1.5">
            Fecha de fin / entrega
          </label>
          <input
            v-model="endDate"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] bg-white text-[#4A4A4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]"
          />
        </div>
      </div>

      <!-- Alerta Error de Fechas -->
      <p v-if="dateError" class="text-xs text-red-600 font-medium">
        {{ dateError }}
      </p>

      <!-- Acciones del Modal -->
      <div class="flex items-center justify-end space-x-3 pt-4 border-t border-[#E4EAED]">
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
