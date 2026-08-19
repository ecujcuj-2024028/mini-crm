import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

export async function getContext({ req }) {
  const authHeader = (req?.headers?.authorization || req?.headers?.Authorization || '').trim();
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader && authHeader.split('.').length === 3) {
    token = authHeader;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return { user: null };
      }

      return { user };
    } catch (err) {
      logger.error('Auth Context', 'JWT verification failed', err);
      return { user: null };
    }
  }
  return { user: null };
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
