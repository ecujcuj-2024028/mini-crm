# Mini-CRM de Usuarios y Proyectos

Sistema completo de gestión de relaciones con clientes (Mini-CRM), proyectos, tareas y comentarios construido con Apollo Server 4, GraphQL, Prisma ORM, PostgreSQL, Docker y WebSockets (`graphql-ws`).

## Estructura del Repositorio

- **`backend/`**: API GraphQL, autenticación JWT, resolvers, loaders, modelos de Prisma, subscripciones en tiempo real y servicios.
- **`docker-compose.yml`**: Configuración de contenedores para la base de datos PostgreSQL y el servicio backend.

## Tecnologías Utilizadas

### Backend
- Node.js (v22)
- Express.js
- Apollo Server 4 (GraphQL)
- Prisma ORM 5
- PostgreSQL 16
- WebSockets (`graphql-ws` & `ws`)
- DataLoader
- Pino Logger
- JSON Web Token (JWT) & bcryptjs
- Docker & Docker Compose

## Guía Rápida de Inicio

### 1. Clonar el Repositorio

```bash
git clone https://github.com/ecujcuj-2024028/mini-crm.git
cd mini-crm
```

### 2. Levantar el Backend con Docker Compose

```bash
docker compose up -d --build
```

### 3. Ejecutar las Migraciones y el Seeder Inicial

```bash
cd backend
pnpm exec prisma db push
pnpm run prisma:seed
```

### 4. Puntos de Acceso

- API GraphQL HTTP: `http://localhost:4000/graphql`
- Subscripciones WebSockets: `ws://localhost:4000/graphql`
- REST Health Check: `http://localhost:4000/health`

## Documentación Detallada del Backend

Para consultar el detalle técnico completo de los esquemas GraphQL, consultas, mutaciones, subscripciones, seguridad e infraestructura, revisa la documentación del módulo backend en [backend/README.md](file:///c:/Users/edvin/practicas/mini-crm/backend/README.md).
