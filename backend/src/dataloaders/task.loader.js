import DataLoader from 'dataloader';
import { prisma } from '../config/database.js';

// DataLoader para agrupar y almacenar en caché las consultas de tareas (Mitigación N+1)
export const createTaskLoader = () => {
  return new DataLoader(async (taskIds) => {
    const tasks = await prisma.task.findMany({
      where: { id: { in: [...taskIds] } }
    });

    const taskMap = new Map(tasks.map((task) => [task.id, task]));

    return taskIds.map((id) => taskMap.get(id) || null);
  });
};
