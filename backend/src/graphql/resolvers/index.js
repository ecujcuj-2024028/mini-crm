import { authResolver } from './auth.resolver.js';

export const resolvers = {
  Query: {
    healthCheck: () => ({
      status: 'OK',
      service: 'Mini-CRM GraphQL API Backend',
      timestamp: new Date().toISOString()
    }),
    ...authResolver.Query
  },
  Mutation: {
    ...authResolver.Mutation
  }
};
