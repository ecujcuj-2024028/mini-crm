import { gql } from '@apollo/client/core';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        isActive
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        isActive
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      role
      isActive
      projectsCount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($name: String, $email: String) {
    updateMyProfile(name: $name, email: $email) {
      id
      name
      email
      role
      isActive
    }
  }
`;

export const CHANGE_MY_PASSWORD_MUTATION = gql`
  mutation ChangeMyPassword($currentPassword: String!, $newPassword: String!) {
    changeMyPassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;
