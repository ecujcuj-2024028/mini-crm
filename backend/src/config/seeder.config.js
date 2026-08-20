import { env } from './env.js';

export const seederConfig = {
  admin: {
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: 'ADMIN'
  }
};
