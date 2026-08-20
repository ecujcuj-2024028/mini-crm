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

    // Subscripción a nuevos comentarios publicados en una tarea específica
    commentAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.COMMENT_ADDED]),
        (payload, variables) => {
          if (!payload?.commentAdded || !variables?.taskId) return false;
          return payload.commentAdded.taskId === variables.taskId;
        }
      )
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
