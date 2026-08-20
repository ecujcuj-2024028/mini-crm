import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { getPagination } from '../../utils/pagination.js';
import { formatToISO, isValidDateRange } from '../../utils/date.util.js';
import { pubsub, EVENTS } from '../../config/pubsub.js';

export const projectResolver = {
  Query: {
    // Listar proyectos activos del equipo para colaboracion en tiempo real
    myProjects: async (_, { search, status, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const where = {
        isActive: true
      };

      if (status) {
        where.status = status;
      }

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.project.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.project.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Listar proyectos generales con soporte para filtrado por usuario o estado
    projects: async (_, { search, status, userId, includeDeactivated = false, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const where = {};

      if (!includeDeactivated) {
        where.isActive = true;
      }

      if (userId) {
        where.userId = userId;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.project.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.project.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Consultar detalle de proyecto para colaboracion de equipo
    project: async (_, { id }, context) => {
      requireAuth(context.user);

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new Error('Project not found.');
      }

      return project;
    }
  },

  Mutation: {
    // Crear un nuevo proyecto asignable a cualquier miembro del equipo
    createProject: async (_, { name, description, status = 'ACTIVE', startDate, endDate, assignedUserId }, context) => {
      requireAuth(context.user);

      // Validación Lógica Temporal de Fechas (endDate >= startDate) vía date.util.js
      if (!isValidDateRange(startDate, endDate)) {
        throw new Error('Project end date cannot be earlier than the start date.');
      }

      // Determinar propietario (por defecto el usuario autenticado o la persona asignada)
      const ownerId = assignedUserId || context.user.id;

      return prisma.project.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          status,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          userId: ownerId,
          isActive: true
        }
      });
    },

    // Actualizar datos de un proyecto para trabajo colaborativo
    updateProject: async (_, { id, name, description, status, startDate, endDate, assignedUserId }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id } });
      if (!targetProject || !targetProject.isActive) {
        throw new Error('Project not found.');
      }

      const effectiveStartDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : targetProject.startDate;
      const effectiveEndDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : targetProject.endDate;

      // Validación Lógica Temporal de Fechas vía date.util.js
      if (!isValidDateRange(effectiveStartDate, effectiveEndDate)) {
        throw new Error('Project end date cannot be earlier than the start date.');
      }

      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (description !== undefined) data.description = description ? description.trim() : null;
      if (status !== undefined) data.status = status;
      if (startDate !== undefined) data.startDate = effectiveStartDate;
      if (endDate !== undefined) data.endDate = effectiveEndDate;

      if (assignedUserId) {
        data.userId = assignedUserId;
      }

      const updatedProject = await prisma.project.update({
        where: { id },
        data
      });

      // Emitir evento en tiempo real en WebSockets si cambió el estado del proyecto
      if (status !== undefined && status !== targetProject.status) {
        pubsub.publish(EVENTS.PROJECT_STATUS_CHANGED, { projectStatusChanged: updatedProject });
      }

      return updatedProject;
    },

    // Borrado Lógico en Cascada (Soft Delete) del Proyecto y sus Tareas anidadas
    deleteProject: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id } });
      if (!targetProject || !targetProject.isActive) {
        throw new Error('Project not found.');
      }

      // Transacción ACID para asegurar que el proyecto y todas sus tareas pasen a isActive: false
      await prisma.$transaction([
        prisma.task.updateMany({
          where: { projectId: id },
          data: { isActive: false }
        }),
        prisma.project.update({
          where: { id },
          data: { isActive: false }
        })
      ]);

      return true;
    },

    // Restauración en Cascada del Proyecto y sus Tareas anidadas
    restoreProject: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id } });
      if (!targetProject) {
        throw new Error('Project not found.');
      }

      if (targetProject.isActive) {
        throw new Error('Project is already active.');
      }

      // Transacción ACID para reactivar el proyecto y sus tareas asociadas
      const [tasksResult, restoredProject] = await prisma.$transaction([
        prisma.task.updateMany({
          where: { projectId: id },
          data: { isActive: true }
        }),
        prisma.project.update({
          where: { id },
          data: { isActive: true }
        })
      ]);

      return restoredProject;
    }
  },

  // Field Resolvers anidados para el objeto Project
  Project: {
    startDate: (parent) => formatToISO(parent.startDate),
    endDate: (parent) => formatToISO(parent.endDate),
    createdAt: (parent) => formatToISO(parent.createdAt),
    updatedAt: (parent) => formatToISO(parent.updatedAt),

    owner: async (parent, _, context) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },

    tasksCount: async (parent) => {
      return prisma.task.count({
        where: { projectId: parent.id, isActive: true }
      });
    }
  }
};
