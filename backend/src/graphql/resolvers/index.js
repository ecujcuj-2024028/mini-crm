import { authResolver } from './auth.resolver.js';
import { userResolver } from './user.resolver.js';
import { projectResolver } from './project.resolver.js';

export const resolvers = {
  Query: {
    healthCheck: () => ({
      status: 'OK',
      service: 'Mini-CRM GraphQL API Backend',
      timestamp: new Date().toISOString()
    }),
    ...authResolver.Query,
    ...userResolver.Query,
    ...projectResolver.Query
  },
  Mutation: {
    ...authResolver.Mutation,
    ...userResolver.Mutation,
    ...projectResolver.Mutation
  },
  User: {
    ...userResolver.User
  },
  Project: {
    ...projectResolver.Project
  }
};
