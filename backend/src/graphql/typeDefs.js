export const typeDefs = `#graphql
  enum Role {
    ADMIN
    USER
  }

  enum ProjectStatus {
    ACTIVE
    PAUSED
    COMPLETED
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
    isActive: Boolean!
    projectsCount: Int
    createdAt: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    status: ProjectStatus!
    startDate: String
    endDate: String
    isActive: Boolean!
    owner: User!
    tasksCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type UserPaginated {
    items: [User!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type ProjectPaginated {
    items: [Project!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Query {
    healthCheck: HealthResponse!
    me: User

    # Gestión de Usuarios
    users(search: String, role: Role, includeDeactivated: Boolean = false, limit: Int = 10, offset: Int = 0): UserPaginated!
    user(id: ID!): User

    # Módulo de Proyectos (Parte 3)
    myProjects(search: String, status: ProjectStatus, limit: Int = 10, offset: Int = 0): ProjectPaginated!
    projects(search: String, status: ProjectStatus, userId: ID, includeDeactivated: Boolean = false, limit: Int = 10, offset: Int = 0): ProjectPaginated!
    project(id: ID!): Project
  }

  type Mutation {
    # Auth
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Perfil Propio (Usuario Autenticado)
    updateMyProfile(name: String, email: String): User!
    changeMyPassword(currentPassword: String!, newPassword: String!): Boolean!

    # Gestión de Usuarios (Solo Administrador)
    createUser(name: String!, email: String!, password: String!, role: Role): User!
    updateUser(id: ID!, name: String, email: String, role: Role): User!
    deleteUser(id: ID!): Boolean!
    restoreUser(id: ID!): User!
    adminResetPassword(userId: ID!, newPassword: String!): Boolean!

    # Módulo de Proyectos (Parte 3)
    createProject(name: String!, description: String, status: ProjectStatus, startDate: String, endDate: String, assignedUserId: ID): Project!
    updateProject(id: ID!, name: String, description: String, status: ProjectStatus, startDate: String, endDate: String, assignedUserId: ID): Project!
    deleteProject(id: ID!): Boolean!
    restoreProject(id: ID!): Project!
  }
`;
