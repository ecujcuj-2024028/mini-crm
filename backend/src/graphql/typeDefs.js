export const typeDefs = `#graphql
  enum Role {
    ADMIN
    USER
  }

  type HealthResponse {
    status: String!
    service: String!
    timestamp: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    healthCheck: HealthResponse!
    me: User
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
  }
`;
