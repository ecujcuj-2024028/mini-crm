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

  enum TaskStatus {
    TODO
    IN_PROGRESS
    REVIEW
    DONE
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
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

  type Comment {
    id: ID!
    content: String!
    task: Task!
    author: User!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type CommentPaginated {
    items: [Comment!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: TaskPriority!
    isActive: Boolean!
    project: Project!
    assignedTo: User
    commentsCount: Int!
    comments(limit: Int = 10, offset: Int = 0): CommentPaginated!
    createdAt: String!
    updatedAt: String!
  }

  type ProjectStatusCount {
    status: ProjectStatus!
    count: Int!
  }

  type TaskStatusCount {
    status: TaskStatus!
    count: Int!
  }

  type DashboardSummary {
    totalProjects: Int!
    totalTasks: Int!
    projectsByStatus: [ProjectStatusCount!]!
    tasksByStatus: [TaskStatusCount!]!
    recentProjects: [Project!]!
    recentTasks: [Task!]!
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

  type TaskPaginated {
    items: [Task!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Query {
    healthCheck: HealthResponse!
    me: User

    # Módulo de Usuarios
    users(search: String, role: Role, includeDeactivated: Boolean = false, limit: Int = 10, offset: Int = 0): UserPaginated!
    user(id: ID!): User

    # Módulo de Proyectos
    myProjects(search: String, status: ProjectStatus, limit: Int = 10, offset: Int = 0): ProjectPaginated!
    projects(search: String, status: ProjectStatus, userId: ID, includeDeactivated: Boolean = false, limit: Int = 10, offset: Int = 0): ProjectPaginated!
    project(id: ID!): Project

    # Módulo de Tareas
    tasks(projectId: ID, assignedToId: ID, status: TaskStatus, priority: TaskPriority, search: String, includeDeactivated: Boolean = false, limit: Int = 10, offset: Int = 0): TaskPaginated!
    myAssignedTasks(status: TaskStatus, priority: TaskPriority, search: String, limit: Int = 10, offset: Int = 0): TaskPaginated!
    task(id: ID!): Task

    # Módulo de Comentarios
    comments(taskId: ID!, includeDeactivated: Boolean = false, limit: Int = 10, offset: Int = 0): CommentPaginated!
    comment(id: ID!): Comment

    # Módulo de Dashboard & Estadísticas (Paso 5)
    dashboardSummary(startDate: String, endDate: String): DashboardSummary!
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

    # Módulo de Proyectos
    createProject(name: String!, description: String, status: ProjectStatus, startDate: String, endDate: String, assignedUserId: ID): Project!
    updateProject(id: ID!, name: String, description: String, status: ProjectStatus, startDate: String, endDate: String, assignedUserId: ID): Project!
    deleteProject(id: ID!): Boolean!
    restoreProject(id: ID!): Project!

    # Módulo de Tareas
    createTask(projectId: ID!, title: String!, description: String, status: TaskStatus, priority: TaskPriority, assignedToId: ID): Task!
    updateTask(id: ID!, title: String, description: String, status: TaskStatus, priority: TaskPriority, assignedToId: ID): Task!
    deleteTask(id: ID!): Boolean!
    restoreTask(id: ID!): Task!

    # Módulo de Comentarios
    createComment(taskId: ID!, content: String!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
    restoreComment(id: ID!): Comment!
  }
`;
