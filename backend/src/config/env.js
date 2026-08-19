import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'mini_crm_secret_jwt_key_2026_super_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Administrador CRM',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@crm.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123'
};
