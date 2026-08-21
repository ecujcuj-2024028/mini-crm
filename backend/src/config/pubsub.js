import { PubSub } from 'graphql-subscriptions';

// Instancia singleton desacoplada de PubSub para la publicación y subscripción de eventos en tiempo real
export const pubsub = new PubSub();

export const EVENTS = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  COMMENT_DELETED: 'COMMENT_DELETED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED'
};
