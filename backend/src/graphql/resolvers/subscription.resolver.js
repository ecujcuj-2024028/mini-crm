import { withFilter } from 'graphql-subscriptions';
import { pubsub, EVENTS } from '../../config/pubsub.js';

export const subscriptionResolver = {
  Subscription: {
    // Subscripción a nuevas tareas asignadas (Filtrado estricto por el ID del usuario asignado)
    taskAssigned: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.TASK_ASSIGNED]),
        (payload, variables) => {
          if (!payload?.taskAssigned || !variables?.userId) return false;
          return payload.taskAssigned.assignedToId === variables.userId;
        }
      )
    },

    // Subscripción a cambios de estado o movimiento de tareas en tiempo real por proyecto
    taskStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.TASK_STATUS_CHANGED]),
        (payload, variables) => {
          if (!payload?.taskStatusChanged) return false;
          if (variables?.projectId) {
            return payload.taskStatusChanged.projectId === variables.projectId || payload.taskStatusChanged.project?.id === variables.projectId;
          }
          return true;
        }
      )
    },

    // Subscripción a nuevos comentarios publicados en una tarea específica
    commentAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.COMMENT_ADDED]),
        (payload, variables) => {
          if (!payload?.commentAdded) return false;
          if (!variables?.taskId) return true;
          return String(payload.commentAdded.taskId) === String(variables.taskId);
        }
      )
    },

    // Subscripción a eliminación de comentarios en tiempo real
    commentDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.COMMENT_DELETED]),
        (payload, variables) => {
          if (!payload?.taskId || !variables?.taskId) return false;
          return String(payload.taskId) === String(variables.taskId);
        }
      ),
      resolve: (payload) => payload.commentDeleted
    },

    // Subscripción a cambios de estado en proyectos (Filtrado opcional por projectId)
    projectStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.PROJECT_STATUS_CHANGED]),
        (payload, variables) => {
          if (!payload?.projectStatusChanged) return false;
          if (variables?.projectId) {
            return payload.projectStatusChanged.id === variables.projectId;
          }
          return true;
        }
      )
    }
  }
};
