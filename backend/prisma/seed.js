import { prisma } from '../src/config/database.js';
import { seederConfig } from '../src/config/seeder.config.js';
import { hashPassword } from '../src/utils/hash.util.js';
import { normalizeEmail } from '../src/utils/string.util.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  logger.info('Seeder', 'Initializing database seed process...');

  // Limpiar tablas existentes en orden relacional
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const name = seederConfig.admin.name;
  const email = normalizeEmail(seederConfig.admin.email);
  const rawPassword = seederConfig.admin.password;

  // Contraseña cifrada para el Administrador
  const adminPassword = await hashPassword(rawPassword);

  // Crear único usuario Administrador a partir de configuración centralizada
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  logger.info('Seeder', `Admin user created successfully from config: ID ${admin.id} | Email ${admin.email}`);
}

main()
  .catch((e) => {
    logger.error('Seeder', 'Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
