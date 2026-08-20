import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { getPagination } from '../../utils/pagination.js';
import { formatToISO } from '../../utils/date.util.js';

export const taskResolver = {
  Query: {
    // Listar tareas con filtros de proyecto, asignado, estado, prioridad y búsqueda
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

      // Prevención IDOR: Si el usuario es USER, restringir a tareas de sus proyectos o tareas asignadas a él
      if (context.user.role !== 'ADMIN') {
        where.AND = [
          {
            OR: [
              { project: { userId: context.user.id } },
              { assignedToId: context.user.id }
            ]
          }
        ];
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.task.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' }
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
          orderBy: { createdAt: 'desc' }
        }),
        prisma.task.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Consultar detalle de tarea por ID (con verificación IDOR)
    task: async (_, { id }, context) => {
      requireAuth(context.user);

      const task = await prisma.task.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!task || !task.isActive) {
        throw new Error('Task not found or access denied.');
      }

      // Prevención IDOR: Si es USER, solo puede acceder si es el dueño del proyecto o el asignado
      if (
        context.user.role !== 'ADMIN' &&
        task.project.userId !== context.user.id &&
        task.assignedToId !== context.user.id
      ) {
        throw new Error('Task not found or access denied.');
      }

      return task;
    }
  },

  Mutation: {
    // Crear nueva tarea dentro de un proyecto (Solo dueño del proyecto o ADMIN)
    createTask: async (_, { projectId, title, description, status = 'TODO', priority = 'MEDIUM', assignedToId }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id: projectId } });
      if (!targetProject || !targetProject.isActive) {
        throw new Error('Target project not found or is inactive.');
      }

      // Prevención IDOR: Solo el dueño del proyecto o ADMIN pueden crear tareas en el proyecto
      if (context.user.role !== 'ADMIN' && targetProject.userId !== context.user.id) {
        throw new Error('Only the project owner or an Administrator can create tasks in this project.');
      }

      // Validar si el usuario asignado existe y está activo
      if (assignedToId) {
        const assignedUser = await prisma.user.findUnique({ where: { id: assignedToId } });
        if (!assignedUser || !assignedUser.isActive) {
          throw new Error('Assigned user not found or is inactive.');
        }
      }

      return prisma.task.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          status,
          priority,
          projectId,
          assignedToId: assignedToId || null,
          isActive: true
        }
      });
    },

    // Actualizar tarea (Permisos granulares: Dueño/ADMIN edita todo, Usuario Asignado solo cambia status)
    updateTask: async (_, { id, title, description, status, priority, assignedToId }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found or access denied.');
      }

      const isProjectOwnerOrAdmin =
        context.user.role === 'ADMIN' || targetTask.project.userId === context.user.id;
      const isAssignedUser = targetTask.assignedToId === context.user.id;

      if (!isProjectOwnerOrAdmin && !isAssignedUser) {
        throw new Error('Task not found or access denied.');
      }

      // Restricción Granular: Si es únicamente el Usuario Asignado, solo puede cambiar el status
      if (!isProjectOwnerOrAdmin && isAssignedUser) {
        if (title !== undefined || description !== undefined || priority !== undefined || assignedToId !== undefined) {
          throw new Error('Assigned users can only update the task status.');
        }
      }

      const data = {};
      if (status !== undefined) data.status = status;

      // Campos modificables solo por Propietario o ADMIN
      if (isProjectOwnerOrAdmin) {
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
      }

      return prisma.task.update({
        where: { id },
        data
      });
    },

    // Borrado Lógico (Soft Delete) de Tarea (Solo Propietario del Proyecto o ADMIN)
    deleteTask: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!targetTask || !targetTask.isActive) {
        throw new Error('Task not found or access denied.');
      }

      const isProjectOwnerOrAdmin =
        context.user.role === 'ADMIN' || targetTask.project.userId === context.user.id;

      if (!isProjectOwnerOrAdmin) {
        throw new Error('Only the project owner or an Administrator can delete tasks.');
      }

      await prisma.task.update({
        where: { id },
        data: { isActive: false }
      });

      return true;
    },

    // Restaurar Tarea Desactivada (Solo Propietario del Proyecto o ADMIN)
    restoreTask: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!targetTask) {
        throw new Error('Task not found.');
      }

      const isProjectOwnerOrAdmin =
        context.user.role === 'ADMIN' || targetTask.project.userId === context.user.id;

      if (!isProjectOwnerOrAdmin) {
        throw new Error('Only the project owner or an Administrator can restore tasks.');
      }

      if (targetTask.isActive) {
        throw new Error('Task is already active.');
      }

      return prisma.task.update({
        where: { id },
        data: { isActive: true }
      });
    }
  },

  // Field Resolvers anidados para el objeto Task
  Task: {
    // Formatear fechas a cadenas ISO 8601
    createdAt: (parent) => formatToISO(parent.createdAt),
    updatedAt: (parent) => formatToISO(parent.updatedAt),

    // Resolver de Proyecto mediante DataLoader (Solución a N+1)
    project: async (parent, _, context) => {
      if (!parent.projectId) return null;
      return context.loaders.projectLoader.load(parent.projectId);
    },

    // Resolver de Usuario Asignado mediante DataLoader (Solución a N+1)
    assignedTo: async (parent, _, context) => {
      if (!parent.assignedToId) return null;
      return context.loaders.userLoader.load(parent.assignedToId);
    }
  }
};
