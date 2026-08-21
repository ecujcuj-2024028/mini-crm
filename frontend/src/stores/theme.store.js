import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: localStorage.getItem('crm_theme') === 'dark'
  }),

  actions: {
    // Inicializar el tema actual en <html> y <body> al cargar la app
    initTheme() {
      const savedTheme = localStorage.getItem('crm_theme');
      let shouldBeDark = false;

      if (savedTheme === 'dark') {
        shouldBeDark = true;
      } else if (savedTheme === 'light') {
        shouldBeDark = false;
      } else {
        shouldBeDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      this.isDark = shouldBeDark;
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    },

    // Alternar entre Modo Claro y Modo Oscuro comprobando el estado real del DOM
    toggleTheme() {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');

      if (isCurrentlyDark) {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        this.isDark = false;
        localStorage.setItem('crm_theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        this.isDark = true;
        localStorage.setItem('crm_theme', 'dark');
      }
    }
  }
});
