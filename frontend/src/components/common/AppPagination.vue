<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['changePage']);

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.page - 1) * props.itemsPerPage + 1;
});

const endItem = computed(() => {
  return Math.min(props.page * props.itemsPerPage, props.totalItems);
});

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= props.totalPages) {
    emit('changePage', newPage);
  }
};
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs sm:text-sm text-[#6E6E6E]">
    <!-- Texto Informativo -->
    <div>
      Mostrando <span class="font-bold text-[#263840]">{{ startItem }}</span> a <span class="font-bold text-[#263840]">{{ endItem }}</span> de <span class="font-bold text-[#263840]">{{ totalItems }}</span> resultados
    </div>

    <!-- Botones de Paginación -->
    <div class="flex items-center space-x-1.5">
      <!-- Botón Anterior -->
      <button
        @click="changePage(page - 1)"
        :disabled="page <= 1"
        class="px-3 py-1.5 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] hover:bg-[#F3F6F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
      >
        Anterior
      </button>

      <!-- Páginas numeradas -->
      <button
        v-for="p in totalPages"
        :key="p"
        @click="changePage(p)"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
          p === page
            ? 'bg-[#263840] text-white font-bold'
            : 'border border-[#C7C7C7] bg-white text-[#4A4A4A] hover:bg-[#F3F6F7]'
        ]"
      >
        {{ p }}
      </button>

      <!-- Botón Siguiente -->
      <button
        @click="changePage(page + 1)"
        :disabled="page >= totalPages"
        class="px-3 py-1.5 rounded-lg border border-[#C7C7C7] bg-white text-[#4A4A4A] hover:bg-[#F3F6F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium cursor-pointer"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>
