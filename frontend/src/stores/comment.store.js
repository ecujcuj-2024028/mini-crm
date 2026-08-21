import { defineStore } from 'pinia';
import { apolloClient } from '../apollo/client';
import { useTaskStore } from './task.store';
import {
  COMMENTS_QUERY,
  CREATE_COMMENT_MUTATION,
  DELETE_COMMENT_MUTATION,
  COMMENT_ADDED_SUBSCRIPTION,
  COMMENT_DELETED_SUBSCRIPTION
} from '../graphql/comments.gql';

export const useCommentStore = defineStore('comment', {
  state: () => ({
    comments: [],
    taskId: null,
    loading: false,
    error: null,
    subscriptionAddedObserver: null,
    subscriptionDeletedObserver: null
  }),

  actions: {
    // Cargar lista de comentarios de una tarea con los más recientes al inicio y conectar suscripciones WebSockets
    async fetchComments(taskId) {
      this.loading = true;
      this.error = null;
      this.taskId = taskId;

      try {
        const { data } = await apolloClient.query({
          query: COMMENTS_QUERY,
          variables: { taskId, limit: 100, offset: 0 },
          fetchPolicy: 'network-only'
        });

        if (data?.comments) {
          // Descongelar los objetos para permitir reactividad instantánea en Vue 3
          this.comments = data.comments.items.map(c => ({ ...c }));
        }

        // Conectar suscripciones WebSockets en tiempo real (sin borrar el estado recién cargado)
        this.subscribeToComments(taskId);
      } catch (err) {
        this.error = err.message || 'Error al obtener comentarios';
      } finally {
        this.loading = false;
      }
    },

    // Crear comentario colocándolo al inicio (más reciente arriba) y actualizar contador en la tarjeta
    async createComment(taskId, content) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.mutate({
          mutation: CREATE_COMMENT_MUTATION,
          variables: { taskId, content }
        });

        if (data?.createComment) {
          const newComment = { ...data.createComment };
          const exists = this.comments.some(c => String(c.id) === String(newComment.id));
          if (!exists) {
            // Colocar al inicio (más recientes primero)
            this.comments = [newComment, ...this.comments];
            useTaskStore().updateCommentsCount(taskId, 1);
          }
        }
      } catch (err) {
        this.error = err.message || 'Error al enviar el comentario';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Eliminar comentario inmediatamente en local y vía WebSockets
    async deleteComment(id) {
      this.loading = true;
      this.error = null;
      try {
        // Borrado reactivo instantáneo en la interfaz
        this.comments = this.comments.filter(c => String(c.id) !== String(id));
        if (this.taskId) {
          useTaskStore().updateCommentsCount(this.taskId, -1);
        }

        await apolloClient.mutate({
          mutation: DELETE_COMMENT_MUTATION,
          variables: { id }
        });
      } catch (err) {
        this.error = err.message || 'Error al eliminar el comentario';
        await this.fetchComments(this.taskId); // Revertir en caso de falla
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Desconectar únicamente los observadores WebSockets de forma limpia
    unsubscribeObservers() {
      if (this.subscriptionAddedObserver) {
        this.subscriptionAddedObserver.unsubscribe();
        this.subscriptionAddedObserver = null;
      }
      if (this.subscriptionDeletedObserver) {
        this.subscriptionDeletedObserver.unsubscribe();
        this.subscriptionDeletedObserver = null;
      }
    },

    // Suscripción WebSocket en tiempo real para nuevos comentarios y borrado de comentarios
    subscribeToComments(taskId) {
      this.unsubscribeObservers();

      try {
        // 1. Suscripción para comentarios agregados en vivo por cualquier usuario
        const addedObservable = apolloClient.subscribe({
          query: COMMENT_ADDED_SUBSCRIPTION,
          variables: { taskId }
        });

        this.subscriptionAddedObserver = addedObservable.subscribe({
          next: ({ data }) => {
            if (data?.commentAdded) {
              const newComment = { ...data.commentAdded };
              const exists = this.comments.some(c => String(c.id) === String(newComment.id));
              if (!exists) {
                this.comments = [newComment, ...this.comments];
                useTaskStore().updateCommentsCount(taskId, 1);
              }
            }
          },
          error: (err) => {
            console.error('Error en WebSocket commentAdded subscription:', err);
          }
        });

        // 2. Suscripción para comentarios eliminados en tiempo real por otros miembros del equipo
        const deletedObservable = apolloClient.subscribe({
          query: COMMENT_DELETED_SUBSCRIPTION,
          variables: { taskId }
        });

        this.subscriptionDeletedObserver = deletedObservable.subscribe({
          next: ({ data }) => {
            if (data?.commentDeleted) {
              const deletedId = data.commentDeleted;
              const exists = this.comments.some(c => String(c.id) === String(deletedId));
              if (exists) {
                this.comments = this.comments.filter(c => String(c.id) !== String(deletedId));
                useTaskStore().updateCommentsCount(taskId, -1);
              }
            }
          },
          error: (err) => {
            console.error('Error en WebSocket commentDeleted subscription:', err);
          }
        });
      } catch (err) {
        console.error('No se pudo establecer suscripciones WebSocket para comentarios:', err);
      }
    },

    // Desconectar suscripciones WebSockets al cerrar el modal
    unsubscribeComments() {
      this.unsubscribeObservers();
      this.comments = [];
      this.taskId = null;
    }
  }
});
