import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Middleware de Seguridad e integración
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  // Endpoint REST de Health Check directo
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'mini-crm-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Servidor Apollo GraphQL usando typeDefs y resolvers de src/graphql
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({ req })
    })
  );

  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(` -------------------------------------------------------------------------`);
  console.log(` [Backend] Backend is running at http://localhost:${PORT}/graphql`);
  console.log(` [Backend] Endpoint REST Health Check is available at http://localhost:${PORT}/health`);
  console.log(` -------------------------------------------------------------------------`);
}

startServer().catch((err) => {
  console.error('❌ Error al iniciar el servidor backend:', err);
});
