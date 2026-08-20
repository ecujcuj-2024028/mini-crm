<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: 'max-w-lg'
  }
});

defineEmits(['close']);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>

        <!-- Modal Wrapper Centrado -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            :class="[
              'relative w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E4EAED] transform transition-all',
              maxWidth
            ]"
          >
            <!-- Encabezado del Modal -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-[#E4EAED]">
              <h3 class="text-xl font-bold text-[#263840] tracking-tight">
                {{ title }}
              </h3>
              <button
                @click="$emit('close')"
                type="button"
                class="w-8 h-8 rounded-full bg-[#F3F6F7] hover:bg-[#E4EAED] text-[#6E6E6E] hover:text-[#263840] flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Cuerpo del Modal -->
            <div>
              <slot />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
