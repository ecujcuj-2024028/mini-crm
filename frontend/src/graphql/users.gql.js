import { gql } from '@apollo/client/core';

export const USERS_PAGINATED_QUERY = gql`
  query Users($search: String, $role: Role, $includeDeactivated: Boolean, $limit: Int, $offset: Int) {
    users(search: $search, role: $role, includeDeactivated: $includeDeactivated, limit: $limit, offset: $offset) {
      items {
        id
        name
        email
        role
        isActive
        projectsCount
        createdAt
      }
      totalCount
      hasMore
    }
  }
`;

export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
      isActive
      projectsCount
      createdAt
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($name: String!, $email: String!, $password: String!, $role: Role) {
    createUser(name: $name, email: $email, password: $password, role: $role) {
      id
      name
      email
      role
      isActive
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $name: String, $email: String, $role: Role) {
    updateUser(id: $id, name: $name, email: $email, role: $role) {
      id
      name
      email
      role
      isActive
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const RESTORE_USER_MUTATION = gql`
  mutation RestoreUser($id: ID!) {
    restoreUser(id: $id) {
      id
      name
      email
      role
      isActive
    }
  }
`;

export const ADMIN_RESET_PASSWORD_MUTATION = gql`
  mutation AdminResetPassword($userId: ID!, $newPassword: String!) {
    adminResetPassword(userId: $userId, newPassword: $newPassword)
  }
`;
