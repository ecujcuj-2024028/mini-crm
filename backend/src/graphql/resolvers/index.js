export const resolvers = {
  Query: {
    healthCheck: () => ({
      status: 'OK',
      service: 'Mini-CRM GraphQL API Backend',
      timestamp: new Date().toISOString()
    })
  }
};
