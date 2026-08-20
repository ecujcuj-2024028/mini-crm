import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import depthLimit from 'graphql-depth-limit';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { apiLimiter } from './config/rateLimit.js';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers/index.js';
import { getContext } from './auth/context.js';
import { logger } from './utils/logger.js';
import { createUserLoader } from './dataloaders/user.loader.js';
import { createProjectLoader } from './dataloaders/project.loader.js';
import { createTaskLoader } from './dataloaders/task.loader.js';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Crear esquema ejecutable compartido entre HTTP y WebSockets
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Crear servidor WebSocketServer para WebSockets en la ruta /graphql
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });

  // Autenticación estricta en el Handshake WebSocket (connectionInit)
  const serverCleanup = useServer(
    {
      schema,
      onConnect: async (ctx) => {
        const connectionParams = ctx.connectionParams || {};
        let authHeader = connectionParams.authorization || connectionParams.Authorization || connectionParams.token || '';

        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          authHeader = authHeader.substring(7).trim();
        }

        if (!authHeader) {
          logger.warn('WebSocket Auth', 'WebSocket connection rejected: Missing authorization token');
          return false; // Rechazar la conexión WebSocket inmediatamente
        }

        try {
          const decoded = jwt.verify(authHeader, env.JWT_SECRET);
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, role: true, isActive: true }
          });

          if (!user || !user.isActive) {
            logger.warn('WebSocket Auth', `WebSocket connection rejected: User ${decoded.id} not found or inactive`);
            return false;
          }

          // Guardar usuario autenticado en ctx.extra para el contexto de subscripción
          ctx.extra.user = user;
          return true;
        } catch (err) {
          logger.error('WebSocket Auth', 'WebSocket connection rejected: Invalid JWT token', err);
          return false;
        }
      },
      context: (ctx) => {
        // Retornar el objeto de contexto (usuario y DataLoaders frescos por solicitud) a los resolvers de subscripciones
        return {
          user: ctx.extra.user,
          loaders: {
            userLoader: createUserLoader(),
            projectLoader: createProjectLoader(),
            taskLoader: createTaskLoader()
          }
        };
      }
    },
    wsServer
  );

  // Middleware de Seguridad e integración HTTP
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  // Rate Limiting centralizado
  app.use('/graphql', apiLimiter);

  // Endpoint REST de Health Check directo
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'mini-crm-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Servidor Apollo GraphQL con validación de Límite de Profundidad (Depth Limit 6)
  const server = new ApolloServer({
    schema,
    validationRules: [depthLimit(6)],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      },
      ApolloServerPluginLandingPageLocalDefault({ embed: true })
    ]
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => await getContext({ req })
    })
  );

  await new Promise((resolve) => httpServer.listen({ port: env.PORT }, resolve));
  logger.info('Backend', `GraphQL HTTP server started on http://localhost:${env.PORT}/graphql`);
  logger.info('Backend', `GraphQL WebSocket server started on ws://localhost:${env.PORT}/graphql`);
  logger.info('Backend', `REST Health Check endpoint available on http://localhost:${env.PORT}/health`);
}

startServer().catch((err) => {
  logger.error('Backend', 'Error starting server:', err);
});
