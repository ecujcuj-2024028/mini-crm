<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seleccionar fecha'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const containerRef = ref(null);

// Año y mes actual del popup
const viewDate = ref(new Date());

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const parsed = new Date(val + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        viewDate.value = parsed;
      }
    }
  },
  { immediate: true }
);

const monthsES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const daysES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const currentMonthLabel = computed(() => {
  return `${monthsES[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`;
});

// Dias del mes para renderizar la cuadrilla del calendario
const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();

  // Primer dia del mes
  const firstDay = new Date(year, month, 1);
  // Ultimo dia del mes
  const lastDay = new Date(year, month + 1, 0);

  // Ajustar dia de la semana (0 = Domingo -> 6, 1 = Lunes -> 0)
  let startingDayOfWeek = firstDay.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const days = [];

  // Dias del mes anterior para rellenar
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      monthOffset: -1,
      isCurrentMonth: false,
      dateString: ''
    });
  }

  // Dias del mes actual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const dateString = `${year}-${formattedMonth}-${formattedDay}`;

    days.push({
      day: d,
      monthOffset: 0,
      isCurrentMonth: true,
      dateString
    });
  }

  // Rellenar hasta completar 35 o 42 celdas
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      monthOffset: 1,
      isCurrentMonth: false,
      dateString: ''
    });
  }

  return days;
});

// Formato amigable para mostrar en el input
const displayFormattedDate = computed(() => {
  if (!props.modelValue) return '';
  const parsed = new Date(props.modelValue + 'T00:00:00');
  if (isNaN(parsed.getTime())) return props.modelValue;
  return parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
});

const prevMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1);
};

const selectDate = (dateStr) => {
  if (!dateStr) return;
  emit('update:modelValue', dateStr);
  isOpen.value = false;
};

const clearDate = () => {
  emit('update:modelValue', '');
  isOpen.value = false;
};

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Etiqueta opcional -->
    <label v-if="label" class="block text-xs font-medium text-[#4A4A4A] mb-1.5 flex items-center justify-between">
      <span>{{ label }}</span>
      <span class="text-[10px] text-[#5C7E8F] font-semibold">Opcional</span>
    </label>

    <!-- Trigger Input con Icono -->
    <div
      @click="toggleOpen"
      class="relative flex items-center w-full px-4 py-2.5 rounded-xl border border-[#C7C7C7] bg-[#F3F6F7]/50 text-[#263840] font-medium text-sm cursor-pointer hover:border-[#5C7E8F] transition-all select-none"
    >
      <svg class="w-4 h-4 text-[#5C7E8F] mr-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span :class="['flex-1 truncate', !modelValue ? 'text-[#A2A2A2]' : 'text-[#263840] font-semibold']">
        {{ displayFormattedDate || placeholder }}
      </span>
      <button
        v-if="modelValue"
        @click.stop="clearDate"
        type="button"
        class="text-[#A2A2A2] hover:text-[#263840] p-1 transition-colors"
        title="Borrar fecha"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Calendario Popover Personalizado desplegable hacia ARRIBA (bottom-full mb-2) -->
    <div
      v-if="isOpen"
      class="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#E4EAED] p-4 z-50 transform origin-bottom-left transition-all duration-200 select-none"
    >
      <!-- Cabecera del Calendario: Mes/Año y Controles -->
      <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#E4EAED]">
        <button
          @click="prevMonth"
          type="button"
          class="w-7 h-7 rounded-lg bg-[#F3F6F7] hover:bg-[#E4EAED] text-[#263840] flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="text-xs font-bold text-[#263840] tracking-wide">
          {{ currentMonthLabel }}
        </span>

        <button
          @click="nextMonth"
          type="button"
          class="w-7 h-7 rounded-lg bg-[#F3F6F7] hover:bg-[#E4EAED] text-[#263840] flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Dias de la Semana -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1">
        <span
          v-for="day in daysES"
          :key="day"
          class="text-[10px] font-mono uppercase text-[#6E6E6E] font-semibold py-1"
        >
          {{ day }}
        </span>
      </div>

      <!-- Cuadrilla de Dias del Mes -->
      <div class="grid grid-cols-7 gap-1 text-center">
        <button
          v-for="(item, idx) in calendarDays"
          :key="idx"
          @click="selectDate(item.dateString)"
          type="button"
          :disabled="!item.isCurrentMonth"
          :class="[
            'w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer mx-auto',
            !item.isCurrentMonth
              ? 'text-gray-300 cursor-not-allowed opacity-40'
              : item.dateString === modelValue
                ? 'bg-[#5C7E8F] text-white shadow-sm font-bold scale-105'
                : 'text-[#263840] hover:bg-[#F3F6F7]'
          ]"
        >
          {{ item.day }}
        </button>
      </div>
    </div>
  </div>
</template>
