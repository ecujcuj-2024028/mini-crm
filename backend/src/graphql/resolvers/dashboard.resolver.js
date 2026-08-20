import { prisma } from '../../config/database.js';
import { requireAuth } from '../../auth/context.js';
import { isValidDateRange } from '../../utils/date.util.js';

export const dashboardResolver = {
  Query: {
    // Consulta agregada de Dashboard & Estadísticas con groupBy de alto rendimiento y filtrado por fecha
    dashboardSummary: async (_, { startDate, endDate }, context) => {
      requireAuth(context.user);

      // Validación Lógica Temporal de Rangos de Fecha
      if (startDate || endDate) {
        if (!isValidDateRange(startDate, endDate)) {
          throw new Error('Dashboard end date cannot be earlier than the start date.');
        }
      }

      // Construcción de filtros base respetando el Soft Delete (isActive: true)
      const projectWhere = { isActive: true };
      const taskWhere = { isActive: true };

      // Prevención IDOR y Aislamiento por Rol: ADMIN ve métricas globales del CRM, USER ve solo sus proyectos/tareas
      if (context.user.role !== 'ADMIN') {
        projectWhere.userId = context.user.id;
        taskWhere.OR = [
          { project: { userId: context.user.id } },
          { assignedToId: context.user.id }
        ];
      }

      // Aplicar filtrado por rango de fecha en createdAt (Time-boxing)
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        projectWhere.createdAt = dateFilter;
        taskWhere.createdAt = dateFilter;
      }

      // Ejecución paralela de agregaciones nativas (prisma.groupBy) en solo 2 consultas SQL grupales + contadores + recientes
      const [
        projectGroups,
        taskGroups,
        totalProjects,
        totalTasks,
        recentProjects,
        recentTasks
      ] = await Promise.all([
        prisma.project.groupBy({
          by: ['status'],
          _count: { status: true },
          where: projectWhere
        }),
        prisma.task.groupBy({
          by: ['status'],
          _count: { status: true },
          where: taskWhere
        }),
        prisma.project.count({ where: projectWhere }),
        prisma.task.count({ where: taskWhere }),
        prisma.project.findMany({
          where: projectWhere,
          take: 5,
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.task.findMany({
          where: taskWhere,
          take: 5,
          orderBy: { updatedAt: 'desc' }
        })
      ]);

      return {
        totalProjects,
        totalTasks,
        projectsByStatus: projectGroups.map((group) => ({
          status: group.status,
          count: group._count.status
        })),
        tasksByStatus: taskGroups.map((group) => ({
          status: group.status,
          count: group._count.status
        })),
        recentProjects,
        recentTasks
      };
    }
  }
};
