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

      // Aplicar filtrado por rango de fecha en createdAt (Time-boxing)
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }
        projectWhere.createdAt = dateFilter;
        taskWhere.createdAt = dateFilter;
      }

      // Filtros específicos para el usuario actual (Métricas Personales)
      const myTaskWhere = {
        ...taskWhere,
        assignedToId: context.user.id
      };

      const myProjectWhere = {
        ...projectWhere,
        OR: [
          { userId: context.user.id },
          { tasks: { some: { assignedToId: context.user.id } } }
        ]
      };

      // Ejecución paralela de agregaciones nativas (prisma.groupBy y contadores)
      const [
        activeUsersCount,
        projectGroups,
        taskGroups,
        totalProjects,
        totalTasks,
        myProjectsCount,
        myTotalTasks,
        myPendingTasks,
        myCompletedTasks,
        recentProjects,
        recentTasks
      ] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
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
        prisma.project.count({ where: myProjectWhere }),
        prisma.task.count({ where: myTaskWhere }),
        prisma.task.count({
          where: {
            ...myTaskWhere,
            status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
          }
        }),
        prisma.task.count({
          where: {
            ...myTaskWhere,
            status: 'DONE'
          }
        }),
        prisma.project.findMany({
          where: projectWhere,
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: { user: true }
        }),
        prisma.task.findMany({
          where: taskWhere,
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: { project: true, assignedTo: true }
        })
      ]);

      const projectStatusMap = projectGroups.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {});

      const taskStatusMap = taskGroups.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {});

      const activeProjects = projectStatusMap['ACTIVE'] || 0;
      const completedProjects = projectStatusMap['COMPLETED'] || 0;
      const pausedProjects = projectStatusMap['PAUSED'] || 0;

      const completedTasks = taskStatusMap['DONE'] || 0;
      const pendingTasks = (taskStatusMap['TODO'] || 0) + (taskStatusMap['IN_PROGRESS'] || 0) + (taskStatusMap['REVIEW'] || 0);

      return {
        activeUsersCount,
        totalProjects,
        activeProjects,
        completedProjects,
        pausedProjects,
        totalTasks,
        pendingTasks,
        completedTasks,
        myProjectsCount,
        myTotalTasks,
        myPendingTasks,
        myCompletedTasks,
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
