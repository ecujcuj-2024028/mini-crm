import { defineStore } from 'pinia';
import { apolloClient } from '../apollo/client';
import {
  TASKS_PAGINATED_QUERY,
  TASK_QUERY,
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  RESTORE_TASK_MUTATION,
  TASK_STATUS_CHANGED_SUBSCRIPTION
} from '../graphql/tasks.gql';

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    currentTask: null,
    total: 0,
    projectFilter: null,
    priorityFilter: null,
    statusFilter: null,
    searchQuery: '',
    loading: false,
    error: null,
    taskSubscriptionObserver: null
  }),

  getters: {
    // Tareas organizadas por columna Kanban
    todoTasks: (state) => state.tasks.filter(t => t.status === 'TODO'),
    inProgressTasks: (state) => state.tasks.filter(t => t.status === 'IN_PROGRESS'),
    reviewTasks: (state) => state.tasks.filter(t => t.status === 'REVIEW'),
    doneTasks: (state) => state.tasks.filter(t => t.status === 'DONE')
  },

  actions: {
    // Obtener lista de tareas para el tablero Kanban y suscribir a eventos WebSockets en tiempo real
    async fetchTasks(projectId = this.projectFilter, priority = this.priorityFilter, search = this.searchQuery) {
      this.loading = true;
      this.error = null;
      this.projectFilter = projectId || null;
      this.priorityFilter = priority || null;

      try {
        const { data } = await apolloClient.query({
          query: TASKS_PAGINATED_QUERY,
          variables: {
            projectId: projectId || undefined,
            priority: priority || undefined,
            search: search || undefined,
            includeDeactivated: false,
            limit: 100,
            offset: 0
          },
          fetchPolicy: 'network-only'
        });

        if (data?.tasks) {
          // Descongelar los objetos GraphQL para permitir mutaciones optimistas
          this.tasks = data.tasks.items.map(t => ({ ...t }));
          this.total = data.tasks.totalCount;
        }

        // Conectar suscripción WebSocket en tiempo real para cambios de estado de tarjetas en vivo
        this.subscribeToTaskUpdates(projectId || null);
      } catch (err) {
        this.error = err.message || 'Error al obtener la lista de tareas';
      } finally {
        this.loading = false;
      }
    },

    // Actualizar el contador de comentarios en la tarjeta Kanban
    updateCommentsCount(taskId, delta) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.commentsCount = Math.max(0, (task.commentsCount || 0) + delta);
      }
    },

    // Suscripción WebSocket en vivo para actualizar el tablero Kanban en tiempo real cuando otro usuario mueve una tarjeta
    subscribeToTaskUpdates(projectId = null) {
      if (this.taskSubscriptionObserver) {
        this.taskSubscriptionObserver.unsubscribe();
      }

      try {
        const observable = apolloClient.subscribe({
          query: TASK_STATUS_CHANGED_SUBSCRIPTION,
          variables: { projectId: projectId || undefined }
        });

        this.taskSubscriptionObserver = observable.subscribe({
          next: ({ data }) => {
            if (data?.taskStatusChanged) {
              const updatedTask = data.taskStatusChanged;

              // Si la tarea fue desactivada, removerla
              if (!updatedTask.isActive) {
                this.tasks = this.tasks.filter(t => t.id !== updatedTask.id);
                return;
              }

              const idx = this.tasks.findIndex(t => t.id === updatedTask.id);
              if (idx !== -1) {
                // Preservar contador de comentarios si vino parcial
                const existingCount = this.tasks[idx].commentsCount;
                this.tasks[idx] = {
                  ...this.tasks[idx],
                  ...updatedTask,
                  commentsCount: updatedTask.commentsCount !== undefined ? updatedTask.commentsCount : existingCount
                };
              } else {
                // Si es una nueva tarea en vivo, agregarla al estado
                this.tasks.unshift({ ...updatedTask });
              }
            }
          },
          error: (err) => {
            console.error('Error en WebSocket taskStatusChanged subscription:', err);
          }
        });
      } catch (err) {
        console.error('No se pudo conectar suscripción de tareas WebSockets:', err);
      }
    },

    // Detalle de tarea
    async fetchTaskById(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.query({
          query: TASK_QUERY,
          variables: { id },
          fetchPolicy: 'network-only'
        });
        if (data?.task) {
          this.currentTask = { ...data.task };
          return this.currentTask;
        }
      } catch (err) {
        this.error = err.message || 'Error al cargar la tarea';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Crear tarea
    async createTask(input) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: CREATE_TASK_MUTATION,
          variables: input
        });
        await this.fetchTasks();
      } catch (err) {
        this.error = err.message || 'Error al crear la tarea';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Actualizar tarea / Mover de columna Kanban
    async updateTask(id, input) {
      this.loading = true;
      this.error = null;
      try {
        // Actualización optimista reactiva (creando nuevo objeto mutable)
        const taskIdx = this.tasks.findIndex(t => t.id === id);
        if (taskIdx !== -1) {
          const oldStatus = this.tasks[taskIdx].status;
          this.tasks[taskIdx] = { ...this.tasks[taskIdx], ...input };
          // Si cambio de estado, incrementar comentariosCount por el registro de auditoria [SISTEMA]
          if (input.status && input.status !== oldStatus) {
            this.tasks[taskIdx].commentsCount = (this.tasks[taskIdx].commentsCount || 0) + 1;
          }
        }

        await apolloClient.mutate({
          mutation: UPDATE_TASK_MUTATION,
          variables: { id, ...input }
        });
      } catch (err) {
        this.error = err.message || 'Error al actualizar la tarea';
        await this.fetchTasks(); // Revertir en caso de falla
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Eliminar tarea suavemente
    async deleteTask(id) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: DELETE_TASK_MUTATION,
          variables: { id }
        });
        await this.fetchTasks();
      } catch (err) {
        this.error = err.message || 'Error al eliminar la tarea';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Restaurar tarea
    async restoreTask(id) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: RESTORE_TASK_MUTATION,
          variables: { id }
        });
        await this.fetchTasks();
      } catch (err) {
        this.error = err.message || 'Error al restaurar la tarea';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Cancelar suscripción WebSocket al desmontar la vista
    unsubscribeTasks() {
      if (this.taskSubscriptionObserver) {
        this.taskSubscriptionObserver.unsubscribe();
        this.taskSubscriptionObserver = null;
      }
    }
  }
});
