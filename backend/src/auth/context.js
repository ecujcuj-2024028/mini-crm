import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { createUserLoader } from '../dataloaders/user.loader.js';
import { createProjectLoader } from '../dataloaders/project.loader.js';
import { createTaskLoader } from '../dataloaders/task.loader.js';

export async function getContext({ req }) {
  const authHeader = (req?.headers?.authorization || req?.headers?.Authorization || '').trim();
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader && authHeader.split('.').length === 3) {
    token = authHeader;
  }

  // Instanciar DataLoaders por cada request para aislamiento de caché y soporte N+1
  const loaders = {
    userLoader: createUserLoader(),
    projectLoader: createProjectLoader(),
    taskLoader: createTaskLoader()
  };

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return { user: null, loaders };
      }

      return { user, loaders };
    } catch (err) {
      logger.error('Auth Context', 'JWT verification failed', err);
      return { user: null, loaders };
    }
  }

  return { user: null, loaders };
}

export function requireAuth(user) {
  if (!user) {
    throw new Error('Unauthorized. You must be logged in to perform this action.');
  }
}

export function requireAdmin(user) {
  requireAuth(user);
  if (user.role !== 'ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }
}
