export const typeDefs = `#graphql
  # Enums del Dominio
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

  # Tipos Principales
  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    projectsCount: Int!
    projects: [Project!]!
    assignedTasks: [Task!]!
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
    tasks(limit: Int = 50, offset: Int = 0): TaskPaginated!
    createdAt: String!
    updatedAt: String!
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

  type Comment {
    id: ID!
    content: String!
    task: Task!
    author: User!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  # Objeto de Respuesta para Autenticación
  type AuthPayload {
    token: String!
    user: User!
  }

  # Estructuras de Paginación Cursor/Offset Sanitizadas
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

  type CommentPaginated {
    items: [Comment!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  # Métricas del Módulo de Dashboard
  type DashboardSummary {
    totalProjects: Int!
    activeProjects: Int!
    completedProjects: Int!
    pausedProjects: Int!
    totalTasks: Int!
    pendingTasks: Int!
    completedTasks: Int!
    myPendingTasks: Int!
    recentActivity: [ActivityLog!]!
  }

  type ActivityLog {
    id: ID!
    type: String!
    description: String!
    createdAt: String!
    user: User
  }

  # Consultas (Queries)
  type Query {
    # Health check probe
    healthCheck: String!

    # Módulo de Autenticación & Perfil
    me: User!

    # Módulo de Gestión de Usuarios (Protegido por Rol: Solo ADMIN)
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

    # Módulo de Dashboard & Estadísticas
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

  type Subscription {
    taskAssigned(userId: ID!): Task!
    taskStatusChanged(projectId: ID): Task!
    commentAdded(taskId: ID!): Comment!
    commentDeleted(taskId: ID!): ID!
    projectStatusChanged(projectId: ID): Project!
  }
`;
