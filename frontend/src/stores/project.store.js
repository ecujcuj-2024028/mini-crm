import { defineStore } from 'pinia';
import { apolloClient } from '../apollo/client';
import {
  MY_PROJECTS_QUERY,
  PROJECTS_QUERY,
  PROJECT_QUERY,
  CREATE_PROJECT_MUTATION,
  UPDATE_PROJECT_MUTATION,
  DELETE_PROJECT_MUTATION,
  RESTORE_PROJECT_MUTATION
} from '../graphql/projects.gql';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10,
    statusFilter: null,
    searchQuery: '',
    loading: false,
    error: null
  }),

  actions: {
    // Cargar mis proyectos (o todos si es admin)
    async fetchProjects(page = this.page, status = this.statusFilter, search = this.searchQuery) {
      this.loading = true;
      this.error = null;
      this.page = page;

      const offset = (page - 1) * this.limit;

      try {
        const { data } = await apolloClient.query({
          query: MY_PROJECTS_QUERY,
          variables: {
            search: search || undefined,
            status: status || undefined,
            limit: this.limit,
            offset
          },
          fetchPolicy: 'network-only'
        });

        if (data?.myProjects) {
          this.projects = data.myProjects.items;
          this.total = data.myProjects.totalCount;
          this.totalPages = Math.ceil(data.myProjects.totalCount / this.limit) || 1;
        }
      } catch (err) {
        this.error = err.message || 'Error al obtener la lista de proyectos';
      } finally {
        this.loading = false;
      }
    },

    // Obtener detalle de un proyecto por ID
    async fetchProjectById(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.query({
          query: PROJECT_QUERY,
          variables: { id },
          fetchPolicy: 'network-only'
        });

        if (data?.project) {
          this.currentProject = data.project;
          return data.project;
        }
      } catch (err) {
        this.error = err.message || 'Error al cargar el proyecto';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Crear proyecto
    async createProject(input) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: CREATE_PROJECT_MUTATION,
          variables: input
        });
        await this.fetchProjects(1);
      } catch (err) {
        this.error = err.message || 'Error al crear el proyecto';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Actualizar proyecto
    async updateProject(id, input) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: UPDATE_PROJECT_MUTATION,
          variables: { id, ...input }
        });
        await this.fetchProjects();
      } catch (err) {
        this.error = err.message || 'Error al actualizar el proyecto';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Eliminar suavemente un proyecto (Cascade soft delete)
    async deleteProject(id) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: DELETE_PROJECT_MUTATION,
          variables: { id }
        });
        await this.fetchProjects();
      } catch (err) {
        this.error = err.message || 'Error al eliminar el proyecto';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Restaurar proyecto
    async restoreProject(id) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: RESTORE_PROJECT_MUTATION,
          variables: { id }
        });
        await this.fetchProjects();
      } catch (err) {
        this.error = err.message || 'Error al restaurar el proyecto';
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
