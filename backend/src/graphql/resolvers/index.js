import { authResolver } from './auth.resolver.js';
import { userResolver } from './user.resolver.js';
import { projectResolver } from './project.resolver.js';
import { taskResolver } from './task.resolver.js';
import { commentResolver } from './comment.resolver.js';
import { dashboardResolver } from './dashboard.resolver.js';
import { subscriptionResolver } from './subscription.resolver.js';

export const resolvers = {
  Query: {
    healthCheck: () => ({
      status: 'OK',
      service: 'Mini-CRM GraphQL API Backend',
      timestamp: new Date().toISOString()
    }),
    ...authResolver.Query,
    ...userResolver.Query,
    ...projectResolver.Query,
    ...taskResolver.Query,
    ...commentResolver.Query,
    ...dashboardResolver.Query
  },
  Mutation: {
    ...authResolver.Mutation,
    ...userResolver.Mutation,
    ...projectResolver.Mutation,
    ...taskResolver.Mutation,
    ...commentResolver.Mutation
  },
  Subscription: {
    ...subscriptionResolver.Subscription,
    ...(taskResolver.Subscription || {})
  },
  User: {
    ...userResolver.User
  },
  Project: {
    ...projectResolver.Project
  },
  Task: {
    ...taskResolver.Task,
    ...commentResolver.Task
  },
  Comment: {
    ...commentResolver.Comment
  }
};
