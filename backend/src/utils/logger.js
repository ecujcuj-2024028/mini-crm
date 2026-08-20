import pino from 'pino';

// Instancia de Pino configurada para producción (JSON estructurado) y desarrollo (pino-pretty formateado)
const pinoInstance = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development'
  },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// Envoltura estandarizada con etiquetas de módulo y soporte para metadatos estructurados
export const logger = {
  info: (tag, message, meta = {}) => {
    pinoInstance.info({ tag, ...meta }, message);
  },
  error: (tag, message, error = null) => {
    const errorMeta = error instanceof Error
      ? { errMessage: error.message, stack: error.stack }
      : { err: error };
    pinoInstance.error({ tag, ...errorMeta }, message);
  },
  warn: (tag, message, meta = {}) => {
    pinoInstance.warn({ tag, ...meta }, message);
  }
};
