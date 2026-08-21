import { withFilter } from 'graphql-subscriptions';
import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { getPagination } from '../../utils/pagination.js';
import { formatToISO } from '../../utils/date.util.js';
import { pubsub, EVENTS } from '../../config/pubsub.js';

export const taskResolver = {
  Query: {
    // Listar tareas activas del equipo con filtros de proyecto, asignado, estado, prioridad y búsqueda
    tasks: async (_, { projectId, assignedToId, status, priority, search, includeDeactivated = false, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const where = {};

      if (!includeDeactivated) {
        where.isActive = true;
      }

      if (projectId) {
        where.projectId = projectId;
      }

      if (assignedToId) {
        where.assignedToId = assignedToId;
      }

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.task.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { project: true, assignedTo: true }
        }),
        prisma.task.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Listar tareas asignadas al usuario autenticado actual
    myAssignedTasks: async (_, { status, priority, search, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const where = {
        assignedToId: context.user.id,
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.task.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { project: true, assignedTo: true }
        }),
        prisma.task.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Consultar detalle de tarea por ID para el equipo
    task: async (_, { id }, context) => {
      requireAuth(context.user);

      const task = await prisma.task.findUnique({
        where: { id },
        include: { project: true, assignedTo: true }
      });

      if (!task || !task.isActive) {
        throw new Error('Task not found.');
      }

      return task;
    }
  },

  Mutation: {
    // Crear nueva tarea dentro de un proyecto para el equipo
    createTask: async (_, { projectId, title, description, status = 'TODO', priority = 'MEDIUM', assignedToId }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id: projectId } });
      if (!targetProject || !targetProject.isActive) {
        throw new Error('Target project not found or is inactive.');
      }

      // Validar si el usuario asignado existe y está activo
      if (assignedToId) {
        const assignedUser = await prisma.user.findUnique({ where: { id: assignedToId } });
        if (!assignedUser || !assignedUser.isActive) {
          throw new Error('Assigned user not found or is inactive.');
        }
      }

      const newTask = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          status,
          priority,
          projectId,
          assignedToId: assignedToId || null,
          isActive: true
        },
        include: { project: true, assignedTo: true }
      });

      // Publicar evento en tiempo real WebSockets TASK_STATUS_CHANGED
      pubsub.publish(EVENTS.TASK_STATUS_CHANGED, { taskStatusChanged: newTask });

      // Publicar evento en tiempo real TASK_ASSIGNED si la tarea fue asignada
      if (newTask.assignedToId) {
        pubsub.publish(EVENTS.TASK_ASSIGNED, { taskAssigned: newTask });
      }

      return newTask;
    },

    // Actualizar tarea / Mover de columna Kanban con generacion de comentario automatico del sistema
    updateTask: async (_, { id, title, description, status, priority, assignedToId }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true, assignedTo: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found.');
      }

      const data = {};
      if (status !== undefined) data.status = status;
      if (title !== undefined) data.title = title.trim();
      if (description !== undefined) data.description = description ? description.trim() : null;
      if (priority !== undefined) data.priority = priority;

      if (assignedToId !== undefined) {
        if (assignedToId) {
          const assignedUser = await prisma.user.findUnique({ where: { id: assignedToId } });
          if (!assignedUser || !assignedUser.isActive) {
            throw new Error('Assigned user not found or is inactive.');
          }
        }
        data.assignedToId = assignedToId || null;
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data,
        include: { project: true, assignedTo: true }
      });

      // Publicar evento en tiempo real WebSockets TASK_STATUS_CHANGED para mover la tarjeta en vivo en todos los navegadores conectados
      pubsub.publish(EVENTS.TASK_STATUS_CHANGED, { taskStatusChanged: updatedTask });

      // Si se cambio el estado (columna Kanban), generar comentario de auditoria automatico del sistema
      if (status !== undefined && status !== targetTask.status) {
        const statusMap = {
          TODO: 'Por Hacer',
          IN_PROGRESS: 'En Progreso',
          REVIEW: 'En Revisión',
          DONE: 'Completado'
        };

        const newStatusLabel = statusMap[status] || status;
        const userName = context.user?.name || 'Un usuario';
        const systemContent = `[SISTEMA] ${userName} movió la tarea a "${newStatusLabel}"`;

        const systemComment = await prisma.comment.create({
          data: {
            content: systemContent,
            taskId: id,
            userId: context.user.id,
            isActive: true
          },
          include: { user: true }
        });

        // Transmitir comentario automatico en tiempo real via WebSockets
        pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: systemComment });
      }

      // Publicar evento en tiempo real si cambio el asignado
      if (assignedToId !== undefined && updatedTask.assignedToId) {
        pubsub.publish(EVENTS.TASK_ASSIGNED, { taskAssigned: updatedTask });
      }

      return updatedTask;
    },

    // Borrado Lógico (Soft Delete) de Tarea
    deleteTask: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true, assignedTo: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found.');
      }

      const deletedTask = await prisma.task.update({
        where: { id },
        data: { isActive: false },
        include: { project: true, assignedTo: true }
      });

      pubsub.publish(EVENTS.TASK_STATUS_CHANGED, { taskStatusChanged: deletedTask });

      return true;
    },

    // Restaurar Tarea Desactivada
    restoreTask: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true, assignedTo: true }
      });

      if (!targetTask) {
        throw new Error('Task not found.');
      }

      if (targetTask.isActive) {
        throw new Error('Task is already active.');
      }

      const restoredTask = await prisma.task.update({
        where: { id },
        data: { isActive: true },
        include: { project: true, assignedTo: true }
      });

      pubsub.publish(EVENTS.TASK_STATUS_CHANGED, { taskStatusChanged: restoredTask });

      return restoredTask;
    }
  },

  // Suscripciones WebSockets en Tiempo Real para Tareas
  Subscription: {
    taskStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.TASK_STATUS_CHANGED]),
        (payload, variables) => {
          if (!variables || !variables.projectId) return true;
          return payload.taskStatusChanged?.projectId === variables.projectId || payload.taskStatusChanged?.project?.id === variables.projectId;
        }
      )
    }
  },

  // Field Resolvers anidados para el objeto Task
  Task: {
    createdAt: (parent) => formatToISO(parent.createdAt),
    updatedAt: (parent) => formatToISO(parent.updatedAt),

    project: async (parent, _, context) => {
      if (parent.project) return parent.project;
      if (!parent.projectId) return null;
      return context.loaders.projectLoader.load(parent.projectId);
    },

    assignedTo: async (parent, _, context) => {
      if (parent.assignedTo) return parent.assignedTo;
      if (!parent.assignedToId) return null;
      return context.loaders.userLoader.load(parent.assignedToId);
    }
  }
};
