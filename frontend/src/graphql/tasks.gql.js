import { gql } from '@apollo/client/core';

export const TASKS_PAGINATED_QUERY = gql`
  query Tasks($projectId: ID, $assignedToId: ID, $status: TaskStatus, $priority: TaskPriority, $search: String, $includeDeactivated: Boolean, $limit: Int, $offset: Int) {
    tasks(projectId: $projectId, assignedToId: $assignedToId, status: $status, priority: $priority, search: $search, includeDeactivated: $includeDeactivated, limit: $limit, offset: $offset) {
      items {
        id
        title
        description
        status
        priority
        isActive
        commentsCount
        createdAt
        project {
          id
          name
        }
        assignedTo {
          id
          name
          email
        }
      }
      totalCount
      hasMore
    }
  }
`;

export const TASK_QUERY = gql`
  query Task($id: ID!) {
    task(id: $id) {
      id
      title
      description
      status
      priority
      isActive
      commentsCount
      createdAt
      project {
        id
        name
      }
      assignedTo {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($projectId: ID!, $title: String!, $description: String, $status: TaskStatus, $priority: TaskPriority, $assignedToId: ID) {
    createTask(projectId: $projectId, title: $title, description: $description, status: $status, priority: $priority, assignedToId: $assignedToId) {
      id
      title
      description
      status
      priority
      isActive
      commentsCount
      project {
        id
        name
      }
      assignedTo {
        id
        name
        email
      }
    }
  }
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $title: String, $description: String, $status: TaskStatus, $priority: TaskPriority, $assignedToId: ID) {
    updateTask(id: $id, title: $title, description: $description, status: $status, priority: $priority, assignedToId: $assignedToId) {
      id
      title
      description
      status
      priority
      isActive
      commentsCount
      project {
        id
        name
      }
      assignedTo {
        id
        name
        email
      }
    }
  }
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const RESTORE_TASK_MUTATION = gql`
  mutation RestoreTask($id: ID!) {
    restoreTask(id: $id) {
      id
      title
      status
      isActive
    }
  }
`;

export const TASK_ASSIGNED_SUBSCRIPTION = gql`
  subscription TaskAssigned($userId: ID!) {
    taskAssigned(userId: $userId) {
      id
      title
      status
      priority
      project {
        id
        name
      }
    }
  }
`;

export const TASK_STATUS_CHANGED_SUBSCRIPTION = gql`
  subscription TaskStatusChanged($projectId: ID) {
    taskStatusChanged(projectId: $projectId) {
      id
      title
      description
      status
      priority
      isActive
      commentsCount
      createdAt
      project {
        id
        name
      }
      assignedTo {
        id
        name
        email
      }
    }
  }
`;
