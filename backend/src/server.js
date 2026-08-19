import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers/index.js';
import { getContext } from './auth/context.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Securidad y Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  // Direccion REST para verificación de salud del servicio
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'mini-crm-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Apollo GraphQL Server con Sandbox de Apollo integrado y Contexto JWT
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
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

  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`[Backend] GraphQL server started successfully on http://localhost:${PORT}/graphql`);
  console.log(`[Backend] REST Health Check endpoint available on http://localhost:${PORT}/health`);
}

startServer().catch((err) => {
  console.error('[Backend] Error starting server:', err);
});
