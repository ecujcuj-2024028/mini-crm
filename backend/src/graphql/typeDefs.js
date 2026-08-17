export const typeDefs = `#graphql
  type HealthResponse {
    status: String!
    service: String!
    timestamp: String!
  }

  type Query {
    healthCheck: HealthResponse!
  }
`;
