import { authResolver } from './auth.resolver.js';
import { userResolver } from './user.resolver.js';

export const resolvers = {
  Query: {
    healthCheck: () => ({
      status: 'OK',
      service: 'Mini-CRM GraphQL API Backend',
      timestamp: new Date().toISOString()
    }),
    ...authResolver.Query,
    ...userResolver.Query
  },
  Mutation: {
    ...authResolver.Mutation,
    ...userResolver.Mutation
  },
  User: {
    ...userResolver.User
  }
};
