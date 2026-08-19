FROM node:22-alpine AS base

# Instalar OpenSSL para Prisma Engine en Alpine Linux
RUN apk add --no-cache openssl

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de dependencias y configuración pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Copiar esquema de Prisma para la generación del cliente
COPY prisma ./prisma

# Instalación de dependencias (genera automáticamente Prisma Client)
RUN pnpm install --frozen-lockfile

# Asegurar la generación del cliente usando la versión local de Prisma
RUN pnpm exec prisma generate

# Copiar el resto del código fuente del backend
COPY src ./src

EXPOSE 4000

CMD ["pnpm", "start"]
