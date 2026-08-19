import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('[Seeder] Initializing database seed process...');

  // Limpiar tablas existentes en orden relacional
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const name = process.env.ADMIN_NAME || 'Administrador CRM';
  const email = (process.env.ADMIN_EMAIL || 'admin@crm.com').toLowerCase().trim();
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Contraseña cifrada para el Administrador
  const adminPassword = await bcrypt.hash(rawPassword, 10);

  // Crear único usuario Administrador a partir de variables de entorno
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  console.log('[Seeder] Admin user created successfully from environment variables:');
  console.log(`   - ID: ${admin.id}`);
  console.log(`   - Name: ${admin.name}`);
  console.log(`   - Email: ${admin.email}`);
  console.log(`   - Role: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('[Seeder] Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
