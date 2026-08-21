import { defineStore } from 'pinia';
import { apolloClient } from '../apollo/client';
import { DASHBOARD_SUMMARY_QUERY } from '../graphql/dashboard.gql';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    startDate: '',
    endDate: '',
    loading: false,
    error: null
  }),

  actions: {
    // Obtener resumen de métricas y estadísticas del Dashboard con rango de fechas opcional (Time-boxing)
    async fetchSummary(startDate = this.startDate, endDate = this.endDate) {
      this.loading = true;
      this.error = null;
      this.startDate = startDate || '';
      this.endDate = endDate || '';

      try {
        const { data } = await apolloClient.query({
          query: DASHBOARD_SUMMARY_QUERY,
          variables: {
            startDate: startDate || undefined,
            endDate: endDate || undefined
          },
          fetchPolicy: 'network-only'
        });

        if (data?.dashboardSummary) {
          this.summary = { ...data.dashboardSummary };
        }
      } catch (err) {
        this.error = err.message || 'Error al cargar las estadísticas del dashboard';
      } finally {
        this.loading = false;
      }
    },

    // Aplicar rango de fechas rápido (Este mes, Este año, Todo el tiempo)
    setPresetRange(preset) {
      const now = new Date();
      if (preset === 'month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        this.startDate = firstDay.toISOString().split('T')[0];
        this.endDate = now.toISOString().split('T')[0];
      } else if (preset === 'year') {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        this.startDate = firstDay.toISOString().split('T')[0];
        this.endDate = now.toISOString().split('T')[0];
      } else {
        this.startDate = '';
        this.endDate = '';
      }
      this.fetchSummary(this.startDate, this.endDate);
    }
  }
});
