import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient as createWsClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP Link a la API GraphQL
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql'
});

// Middleware de Autenticación (Adjunta el token JWT desde localStorage)
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

// WebSocket Link para Subscripciones en Tiempo Real
const wsLink = new GraphQLWsLink(
  createWsClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: () => {
      const token = localStorage.getItem('token');
      return {
        authorization: token ? `Bearer ${token}` : ''
      };
    }
  })
);

// Enrutamiento split: Subscripciones por WebSockets, Queries y Mutations por HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Instancia singleton de ApolloClient
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
