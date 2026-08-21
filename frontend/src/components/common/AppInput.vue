<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div>
    <label v-if="label" class="block text-xs font-medium text-[#4A4A4A] dark:text-[#F3F6F7] mb-1.5">
      {{ label }}
      <span v-if="required" class="text-red-500 font-bold">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="[
        'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#121E24] text-[#4A4A4A] dark:text-[#F3F6F7] placeholder-[#A2A2A2] dark:placeholder-[#5E717B] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C7E8F] focus:border-[#5C7E8F] transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
        error ? 'border-red-400 focus:ring-red-400' : 'border-[#C7C7C7] dark:border-[#2E3F49]'
      ]"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>
