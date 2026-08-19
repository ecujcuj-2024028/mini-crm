import rateLimit from 'express-rate-limit';

// Configuración centralizada de Rate Limiting (Máximo 100 peticiones cada 15 minutos por IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
