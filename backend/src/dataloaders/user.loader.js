import DataLoader from 'dataloader';
import { prisma } from '../config/database.js';

// DataLoader para agrupar y almacenar en caché las consultas de usuarios (Mitigación del problema N+1)
export const createUserLoader = () => {
  return new DataLoader(async (userIds) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } }
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    // Mapear los resultados manteniendo exactamente el orden de los IDs solicitados
    return userIds.map((id) => userMap.get(id) || null);
  });
};
