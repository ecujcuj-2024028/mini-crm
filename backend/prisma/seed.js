import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { hashPassword } from '../src/utils/hash.util.js';
import { normalizeEmail } from '../src/utils/string.util.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  logger.info('Seeder', 'Initializing database seed process...');

  // Limpiar tablas existentes en orden relacional
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const name = process.env.ADMIN_NAME || 'Administrador CRM';
  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@crm.com');
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Contraseña cifrada para el Administrador
  const adminPassword = await hashPassword(rawPassword);

  // Crear único usuario Administrador a partir de variables de entorno
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  logger.info('Seeder', `Admin user created successfully from environment variables: ID ${admin.id} | Email ${admin.email}`);
}

main()
  .catch((e) => {
    logger.error('Seeder', 'Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
