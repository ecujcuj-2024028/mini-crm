# Etapa 1: Compilacion (Builder)
FROM node:22-alpine AS builder

WORKDIR /app

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar manifiestos de dependencias
COPY package.json ./

# Aprobar scripts de construccion para pnpm v11 e instalar dependencias
RUN pnpm approve-builds --all || true
RUN pnpm install || (pnpm approve-builds --all && pnpm install)

# Copiar codigo fuente y compilar artefactos estaticos de Vite
COPY . .
RUN pnpm run build

# Etapa 2: Servidor Nginx Produccion
FROM nginx:alpine

# Copiar archivos compilados del builder a Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuracion personalizada de Nginx para Vue Router SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
