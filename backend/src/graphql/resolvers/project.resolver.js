import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { getPagination } from '../../utils/pagination.js';
import { formatToISO, isValidDateRange } from '../../utils/date.util.js';

export const projectResolver = {
  Query: {
    // Listar proyectos del usuario autenticado actual
    myProjects: async (_, { search, status, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const where = {
        userId: context.user.id,
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

    // Listar proyectos generales (Con filtrado IDOR por rol: USER solo ve sus proyectos, ADMIN ve todos)
    projects: async (_, { search, status, userId, includeDeactivated = false, limit = 10, offset = 0 }, context) => {
      requireAuth(context.user);

      const where = {};

      if (!includeDeactivated) {
        where.isActive = true;
      }

      // Prevención IDOR: Si no es ADMIN, forzar la restricción al propio userId
      if (context.user.role !== 'ADMIN') {
        where.userId = context.user.id;
      } else if (userId) {
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

    // Consultar detalle de proyecto (Con control IDOR de acceso)
    project: async (_, { id }, context) => {
      requireAuth(context.user);

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new Error('Project not found or access denied.');
      }

      // Prevención IDOR: Si el usuario es USER y no es propietario del proyecto, denegar acceso
      if (context.user.role !== 'ADMIN' && project.userId !== context.user.id) {
        throw new Error('Project not found or access denied.');
      }

      return project;
    }
  },

  Mutation: {
    // Crear un nuevo proyecto
    createProject: async (_, { name, description, status = 'ACTIVE', startDate, endDate, assignedUserId }, context) => {
      requireAuth(context.user);

      // Validación Lógica Temporal de Fechas (endDate >= startDate) vía date.util.js
      if (!isValidDateRange(startDate, endDate)) {
        throw new Error('Project end date cannot be earlier than the start date.');
      }

      // Determinar propietario (Un ADMIN puede asignar el proyecto a otro usuario, USER se asigna a sí mismo)
      let ownerId = context.user.id;
      if (assignedUserId) {
        if (context.user.role !== 'ADMIN' && assignedUserId !== context.user.id) {
          throw new Error('Only Administrators can assign projects to other users.');
        }
        ownerId = assignedUserId;
      }

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

    // Actualizar datos de un proyecto existente (Protegido contra IDOR)
    updateProject: async (_, { id, name, description, status, startDate, endDate, assignedUserId }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id } });
      if (!targetProject || !targetProject.isActive) {
        throw new Error('Project not found or access denied.');
      }

      // Prevención IDOR: Si no es ADMIN, verificar que el proyecto pertenezca al usuario autenticado
      if (context.user.role !== 'ADMIN' && targetProject.userId !== context.user.id) {
        throw new Error('Project not found or access denied.');
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

      if (assignedUserId !== undefined) {
        if (context.user.role !== 'ADMIN' && assignedUserId !== context.user.id) {
          throw new Error('Only Administrators can reassign project ownership.');
        }
        data.userId = assignedUserId;
      }

      return prisma.project.update({
        where: { id },
        data
      });
    },

    // Borrado Lógico (Soft Delete) de Proyecto (Protegido contra IDOR)
    deleteProject: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id } });
      if (!targetProject || !targetProject.isActive) {
        throw new Error('Project not found or access denied.');
      }

      // Prevención IDOR: Si no es ADMIN, verificar propiedad
      if (context.user.role !== 'ADMIN' && targetProject.userId !== context.user.id) {
        throw new Error('Project not found or access denied.');
      }

      await prisma.project.update({
        where: { id },
        data: { isActive: false }
      });

      return true;
    },

    // Restaurar un proyecto desactivado (Solo Admin o propietario)
    restoreProject: async (_, { id }, context) => {
      requireAuth(context.user);

      const targetProject = await prisma.project.findUnique({ where: { id } });
      if (!targetProject) {
        throw new Error('Project not found.');
      }

      if (context.user.role !== 'ADMIN' && targetProject.userId !== context.user.id) {
        throw new Error('Project not found or access denied.');
      }

      if (targetProject.isActive) {
        throw new Error('Project is already active.');
      }

      return prisma.project.update({
        where: { id },
        data: { isActive: true }
      });
    }
  },

  // Field Resolvers anidados para el objeto Project
  Project: {
    // Formatear fechas a cadena ISO 8601 estandarizada utilizando date.util.js
    startDate: (parent) => formatToISO(parent.startDate),
    endDate: (parent) => formatToISO(parent.endDate),
    createdAt: (parent) => formatToISO(parent.createdAt),
    updatedAt: (parent) => formatToISO(parent.updatedAt),

    // Resolver de Propietario mediante DataLoader (Solución a N+1)
    owner: async (parent, _, context) => {
      if (!parent.userId) return null;
      return context.loaders.userLoader.load(parent.userId);
    },

    // Resolver de conteo de tareas anidadas en el proyecto
    tasksCount: async (parent) => {
      return prisma.task.count({
        where: { projectId: parent.id }
      });
    }
  }
};
