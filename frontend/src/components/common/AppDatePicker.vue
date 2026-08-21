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
  },
  dropDirection: {
    type: String,
    default: 'down' // 'down' (top-full mt-2), 'up' (bottom-full mb-2)
  },
  align: {
    type: String,
    default: 'left' // 'left', 'right'
  },
  compact: {
    type: Boolean,
    default: false
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

// Días del mes para renderizar la cuadrilla del calendario
const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();

  // Primer día del mes
  const firstDay = new Date(year, month, 1);
  // Último día del mes
  const lastDay = new Date(year, month + 1, 0);

  // Ajustar día de la semana (0 = Domingo -> 6, 1 = Lunes -> 0)
  let startingDayOfWeek = firstDay.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const days = [];

  // Días del mes anterior para rellenar
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      monthOffset: -1,
      isCurrentMonth: false,
      dateString: ''
    });
  }

  // Días del mes actual
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
    <label v-if="label" class="block text-xs font-medium text-[#4A4A4A] dark:text-[#A2B3BC] mb-1.5 flex items-center justify-between">
      <span>{{ label }}</span>
      <span class="text-[10px] text-[#5C7E8F] dark:text-[#8CA7B3] font-semibold">Opcional</span>
    </label>

    <!-- Trigger Input con Icono -->
    <div
      @click="toggleOpen"
      :class="[
        'relative flex items-center w-full rounded-xl border border-[#C7C7C7] dark:border-[#2E3F49] bg-white dark:bg-[#121E24] text-[#263840] dark:text-[#F3F6F7] font-medium text-xs sm:text-sm cursor-pointer hover:border-[#5C7E8F] dark:hover:border-[#5C7E8F] transition-all select-none',
        compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5'
      ]"
    >
      <svg class="w-4 h-4 text-[#5C7E8F] dark:text-[#8CA7B3] mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span :class="['flex-1 truncate', !modelValue ? 'text-[#A2A2A2] dark:text-[#5E717B]' : 'text-[#263840] dark:text-[#F3F6F7] font-semibold']">
        {{ displayFormattedDate || placeholder }}
      </span>
      <button
        v-if="modelValue"
        @click.stop="clearDate"
        type="button"
        class="text-[#A2A2A2] dark:text-[#8CA7B3] hover:text-[#263840] dark:hover:text-white p-0.5 transition-colors cursor-pointer"
        title="Borrar fecha"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Calendario Popover Personalizado desplegable -->
    <div
      v-if="isOpen"
      :class="[
        'absolute w-72 bg-white dark:bg-[#1A2830] rounded-2xl shadow-2xl border border-[#E4EAED] dark:border-[#2E3F49] p-4 z-50 transform transition-all duration-200 select-none',
        dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
        align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
      ]"
    >
      <!-- Cabecera del Calendario: Mes/Año y Controles -->
      <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#E4EAED] dark:border-[#2E3F49]">
        <button
          @click="prevMonth"
          type="button"
          class="w-7 h-7 rounded-lg bg-[#F3F6F7] dark:bg-[#121E24] hover:bg-[#E4EAED] dark:hover:bg-[#263840] text-[#263840] dark:text-[#F3F6F7] flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="text-xs font-bold text-[#263840] dark:text-[#F3F6F7] tracking-wide">
          {{ currentMonthLabel }}
        </span>

        <button
          @click="nextMonth"
          type="button"
          class="w-7 h-7 rounded-lg bg-[#F3F6F7] dark:bg-[#121E24] hover:bg-[#E4EAED] dark:hover:bg-[#263840] text-[#263840] dark:text-[#F3F6F7] flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Días de la Semana -->
      <div class="grid grid-cols-7 gap-1 text-center mb-1">
        <span
          v-for="day in daysES"
          :key="day"
          class="text-[10px] font-mono uppercase text-[#6E6E6E] dark:text-[#A2B3BC] font-semibold py-1"
        >
          {{ day }}
        </span>
      </div>

      <!-- Cuadrilla de Días del Mes -->
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
              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40'
              : item.dateString === modelValue
                ? 'bg-[#5C7E8F] text-white shadow-sm font-bold scale-105'
                : 'text-[#263840] dark:text-[#F3F6F7] hover:bg-[#F3F6F7] dark:hover:bg-[#263840]'
          ]"
        >
          {{ item.day }}
        </button>
      </div>
    </div>
  </div>
</template>
