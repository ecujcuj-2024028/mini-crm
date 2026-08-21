import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { getPagination } from '../../utils/pagination.js';
import { formatToISO } from '../../utils/date.util.js';
import { pubsub, EVENTS } from '../../config/pubsub.js';

export const commentResolver = {
  Query: {
    // Listar comentarios activos de una tarea específica con los más recientes arriba
    comments: async (_, { taskId, includeDeactivated = false, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found.');
      }

      const where = { taskId };
      if (!includeDeactivated) {
        where.isActive = true;
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.comment.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        }),
        prisma.comment.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Consultar detalle de un comentario específico por su ID
    comment: async (_, { id }, context) => {
      requireAuth(context.user);

      const comment = await prisma.comment.findUnique({
        where: { id },
        include: { task: { include: { project: true } }, user: true }
      });

      if (!comment || !comment.isActive) {
        throw new Error('Comment not found.');
      }

      return comment;
    }
  },

  Mutation: {
    // Crear un comentario en una tarea y emitir evento COMMENT_ADDED por WebSockets con relación user poblada
    createComment: async (_, { taskId, content }, context) => {
      requireAuth(context.user);

      if (!content || !content.trim()) {
        throw new Error('Comment content cannot be empty.');
      }

      const targetTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found.');
      }

      const newComment = await prisma.comment.create({
        data: {
          content: content.trim(),
          taskId,
          userId: context.user.id,
          isActive: true
        },
        include: { user: true }
      });

      // Publicar evento en tiempo real COMMENT_ADDED
      pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: newComment });

      return newComment;
    },

    // Editar contenido de un comentario
    updateComment: async (_, { id, content }, context) => {
      requireAuth(context.user);

      if (!content || !content.trim()) {
        throw new Error('Comment content cannot be empty.');
      }

      const targetComment = await prisma.comment.findUnique({ where: { id } });
      if (!targetComment || !targetComment.isActive) {
        throw new Error('Comment not found.');
      }

      if (targetComment.content.startsWith('[SISTEMA]')) {
        throw new Error('System audit comments cannot be edited.');
      }

      if (context.user.role !== 'ADMIN' && targetComment.userId !== context.user.id) {
        throw new Error('You can only edit your own comments.');
      }

      const updatedComment = await prisma.comment.update({
        where: { id },
        data: { content: content.trim() },
        include: { user: true }
      });

      return updatedComment;
    },

    // Borrado Lógico de Comentario con transmisión WebSockets en vivo COMMENT_DELETED
    deleteComment: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetComment = await prisma.comment.findUnique({
        where: { id },
        include: { task: { include: { project: true } } }
      });

      if (!targetComment || !targetComment.isActive) {
        throw new Error('Comment not found.');
      }

      if (targetComment.content.startsWith('[SISTEMA]')) {
        throw new Error('System audit comments cannot be deleted.');
      }

      if (context.user.role !== 'ADMIN' && targetComment.userId !== context.user.id) {
        throw new Error('You can only delete your own comments.');
      }

      await prisma.comment.update({
        where: { id },
        data: { isActive: false }
      });

      // Publicar evento en tiempo real COMMENT_DELETED
      pubsub.publish(EVENTS.COMMENT_DELETED, { commentDeleted: id, taskId: targetComment.taskId });

      return true;
    },

    // Restaurar Comentario Desactivado
    restoreComment: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetComment = await prisma.comment.findUnique({
        where: { id },
        include: { task: { include: { project: true } }, user: true }
      });

      if (!targetComment) {
        throw new Error('Comment not found.');
      }

      if (targetComment.isActive) {
        throw new Error('Comment is already active.');
      }

      return prisma.comment.update({
        where: { id },
        data: { isActive: true },
        include: { user: true }
      });
    }
  },

  // Field Resolvers anidados para el objeto Comment
  Comment: {
    createdAt: (parent) => formatToISO(parent.createdAt),
    updatedAt: (parent) => formatToISO(parent.updatedAt),

    task: async (parent, _, context) => {
      if (!parent.taskId) return null;
      return context.loaders.taskLoader.load(parent.taskId);
    },

    author: async (parent, _, context) => {
      if (parent.user) return parent.user;
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    }
  },

  // Resolver anidado para commentsCount en la entidad Task
  Task: {
    commentsCount: async (parent) => {
      return prisma.comment.count({
        where: { taskId: parent.id, isActive: true }
      });
    }
  }
};
