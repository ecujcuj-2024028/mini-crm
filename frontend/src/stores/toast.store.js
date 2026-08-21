import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),

  actions: {
    addToast({ title, message, type = 'info', timeout = 4000 }) {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, title, message, type });

      if (timeout > 0) {
        setTimeout(() => {
          this.removeToast(id);
        }, timeout);
      }
    },

    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }
});
