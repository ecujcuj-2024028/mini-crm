import DataLoader from 'dataloader';
import { prisma } from '../config/database.js';

// DataLoader para agrupar y almacenar en caché las consultas de proyectos (Mitigación del problema N+1)
export const createProjectLoader = () => {
  return new DataLoader(async (projectIds) => {
    // Consulta masiva de proyectos en un solo SELECT ... WHERE id IN (...)
    const projects = await prisma.project.findMany({
      where: { id: { in: [...projectIds] } }
    });

    const projectMap = new Map(projects.map((project) => [project.id, project]));

    // Mapear los resultados manteniendo exactamente el orden de los IDs solicitados
    return projectIds.map((id) => projectMap.get(id) || null);
  });
};
