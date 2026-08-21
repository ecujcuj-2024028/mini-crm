<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from './stores/theme.store';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initTheme();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F3F6F7] dark:bg-[#0F171C] text-[#263840] dark:text-[#F3F6F7] transition-colors duration-200">
    <router-view />
  </div>
</template>
