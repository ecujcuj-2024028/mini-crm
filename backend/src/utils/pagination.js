// Helper reutilizable para el cálculo de paginación en Prisma (take / skip)

export const getPagination = ({ limit = 10, offset = 0 } = {}) => {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const safeOffset = Math.max(0, Number(offset) || 0);

  return {
    take: safeLimit,
    skip: safeOffset
  };
};
