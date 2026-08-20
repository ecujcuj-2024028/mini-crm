import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { getPagination } from '../../utils/pagination.js';
import { formatToISO } from '../../utils/date.util.js';
import { pubsub, EVENTS } from '../../config/pubsub.js';

export const commentResolver = {
  Query: {
    // Listar comentarios de una tarea (Con verificación de permisos IDOR)
    comments: async (_, { taskId, includeDeactivated = false, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found or access denied.');
      }

      // Prevención IDOR: Si es USER, debe ser dueño del proyecto o el asignado a la tarea
      if (
        context.user.role !== 'ADMIN' &&
        targetTask.project.userId !== context.user.id &&
        targetTask.assignedToId !== context.user.id
      ) {
        throw new Error('Task not found or access denied.');
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
          orderBy: { createdAt: 'desc' }
        }),
        prisma.comment.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Consultar detalle de un comentario por ID
    comment: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetComment = await prisma.comment.findUnique({
        where: { id },
        include: { task: { include: { project: true } } }
      });

      if (!targetComment || !targetComment.isActive) {
        throw new Error('Comment not found or access denied.');
      }

      const { task } = targetComment;
      if (
        context.user.role !== 'ADMIN' &&
        task.project.userId !== context.user.id &&
        task.assignedToId !== context.user.id &&
        targetComment.userId !== context.user.id
      ) {
        throw new Error('Comment not found or access denied.');
      }

      return targetComment;
    }
  },

  Mutation: {
    // Crear un comentario en una tarea y emitir evento COMMENT_ADDED
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
        throw new Error('Task not found or access denied.');
      }

      // Prevención IDOR: Solo pueden comentar involucrados (Dueño del proyecto, Asignado o ADMIN)
      if (
        context.user.role !== 'ADMIN' &&
        targetTask.project.userId !== context.user.id &&
        targetTask.assignedToId !== context.user.id
      ) {
        throw new Error('Only project owners, assigned users, or Administrators can comment on this task.');
      }

      const newComment = await prisma.comment.create({
        data: {
          content: content.trim(),
          taskId,
          userId: context.user.id,
          isActive: true
        }
      });

      // Publicar evento en tiempo real COMMENT_ADDED
      pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: newComment });

      return newComment;
    },

    // Editar contenido de un comentario (Solo el autor del comentario o ADMIN)
    updateComment: async (_, { id, content }, context) => {
      requireAuth(context.user);

      if (!content || !content.trim()) {
        throw new Error('Comment content cannot be empty.');
      }

      const targetComment = await prisma.comment.findUnique({ where: { id } });
      if (!targetComment || !targetComment.isActive) {
        throw new Error('Comment not found or access denied.');
      }

      // Permisos Granulares: Solo el autor del comentario o ADMIN pueden editar el texto
      if (context.user.role !== 'ADMIN' && targetComment.userId !== context.user.id) {
        throw new Error('You can only edit your own comments.');
      }

      return prisma.comment.update({
        where: { id },
        data: { content: content.trim() }
      });
    },

    // Borrado Lógico (Soft Delete) de Comentario
    deleteComment: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetComment = await prisma.comment.findUnique({
        where: { id },
        include: { task: { include: { project: true } } }
      });

      if (!targetComment || !targetComment.isActive) {
        throw new Error('Comment not found or access denied.');
      }

      const isAuthor = targetComment.userId === context.user.id;
      const isProjectOwner = targetComment.task.project.userId === context.user.id;
      const isAdmin = context.user.role === 'ADMIN';

      if (!isAuthor && !isProjectOwner && !isAdmin) {
        throw new Error('Only the author, project owner, or an Administrator can delete this comment.');
      }

      await prisma.comment.update({
        where: { id },
        data: { isActive: false }
      });

      return true;
    },

    // Restaurar un comentario desactivado
    restoreComment: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetComment = await prisma.comment.findUnique({
        where: { id },
        include: { task: { include: { project: true } } }
      });

      if (!targetComment) {
        throw new Error('Comment not found.');
      }

      const isAuthor = targetComment.userId === context.user.id;
      const isProjectOwner = targetComment.task.project.userId === context.user.id;
      const isAdmin = context.user.role === 'ADMIN';

      if (!isAuthor && !isProjectOwner && !isAdmin) {
        throw new Error('Only the author, project owner, or an Administrator can restore this comment.');
      }

      if (targetComment.isActive) {
        throw new Error('Comment is already active.');
      }

      return prisma.comment.update({
        where: { id },
        data: { isActive: true }
      });
    }
  },

  // Field Resolvers anidados para Comment y Task
  Comment: {
    createdAt: (parent) => formatToISO(parent.createdAt),
    updatedAt: (parent) => formatToISO(parent.updatedAt),

    author: async (parent, _, context) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },

    task: async (parent, _, context) => {
      if (!parent.taskId) return null;
      return context.loaders.taskLoader.load(parent.taskId);
    }
  },

  Task: {
    commentsCount: async (parent) => {
      return prisma.comment.count({
        where: { taskId: parent.id, isActive: true }
      });
    },

    comments: async (parent, { limit = 10, offset = 0 }) => {
      const where = { taskId: parent.id, isActive: true };
      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.comment.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.comment.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    }
  }
};
