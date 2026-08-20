import { gql } from '@apollo/client/core';

export const MY_PROJECTS_QUERY = gql`
  query MyProjects($search: String, $status: ProjectStatus, $limit: Int, $offset: Int) {
    myProjects(search: $search, status: $status, limit: $limit, offset: $offset) {
      items {
        id
        name
        description
        status
        startDate
        endDate
        isActive
        tasksCount
        createdAt
        owner {
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

export const PROJECTS_QUERY = gql`
  query Projects($search: String, $status: ProjectStatus, $userId: ID, $includeDeactivated: Boolean, $limit: Int, $offset: Int) {
    projects(search: $search, status: $status, userId: $userId, includeDeactivated: $includeDeactivated, limit: $limit, offset: $offset) {
      items {
        id
        name
        description
        status
        startDate
        endDate
        isActive
        tasksCount
        createdAt
        owner {
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

export const PROJECT_QUERY = gql`
  query Project($id: ID!) {
    project(id: $id) {
      id
      name
      description
      status
      startDate
      endDate
      isActive
      tasksCount
      createdAt
      owner {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($name: String!, $description: String, $status: ProjectStatus, $startDate: String, $endDate: String, $assignedUserId: ID) {
    createProject(name: $name, description: $description, status: $status, startDate: $startDate, endDate: $endDate, assignedUserId: $assignedUserId) {
      id
      name
      description
      status
      startDate
      endDate
      isActive
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($id: ID!, $name: String, $description: String, $status: ProjectStatus, $startDate: String, $endDate: String, $assignedUserId: ID) {
    updateProject(id: $id, name: $name, description: $description, status: $status, startDate: $startDate, endDate: $endDate, assignedUserId: $assignedUserId) {
      id
      name
      description
      status
      startDate
      endDate
      isActive
    }
  }
`;

export const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const RESTORE_PROJECT_MUTATION = gql`
  mutation RestoreProject($id: ID!) {
    restoreProject(id: $id) {
      id
      name
      description
      status
      isActive
    }
  }
`;
