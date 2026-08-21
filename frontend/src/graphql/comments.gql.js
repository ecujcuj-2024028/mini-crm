import { gql } from '@apollo/client/core';

export const COMMENTS_QUERY = gql`
  query Comments($taskId: ID!, $includeDeactivated: Boolean, $limit: Int, $offset: Int) {
    comments(taskId: $taskId, includeDeactivated: $includeDeactivated, limit: $limit, offset: $offset) {
      items {
        id
        content
        isActive
        createdAt
        author {
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

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($taskId: ID!, $content: String!) {
    createComment(taskId: $taskId, content: $content) {
      id
      content
      isActive
      createdAt
      author {
        id
        name
        email
      }
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription CommentAdded($taskId: ID!) {
    commentAdded(taskId: $taskId) {
      id
      content
      isActive
      createdAt
      author {
        id
        name
        email
      }
    }
  }
`;

export const COMMENT_DELETED_SUBSCRIPTION = gql`
  subscription CommentDeleted($taskId: ID!) {
    commentDeleted(taskId: $taskId)
  }
`;
