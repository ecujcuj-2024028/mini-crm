import rateLimit from 'express-rate-limit';
import { env } from './env.js';

// Configuración de Rate Limiting dinámica según las variables del .env
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: `Too many requests from this IP, please try again after ${env.RATE_LIMIT_WINDOW_MINUTES} minutes.`
  }
});
