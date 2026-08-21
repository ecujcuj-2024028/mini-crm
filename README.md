# Mini-CRM de Usuarios, Proyectos y Tareas

Plataforma Web Full-Stack para la gestión integral de relaciones con clientes (Mini-CRM), proyectos, tableros de tareas Kanban, comentarios en vivo y métricas de negocio. 

Desarrollada con **Vue 3, Vite, Tailwind CSS (Modo Oscuro), Pinia, Apollo Server 4, GraphQL, Prisma ORM, PostgreSQL, Docker y WebSockets (`graphql-ws`)**.

---

## Arquitectura del Sistema

El repositorio está organizado en una arquitectura desacoplada de Frontend Single Page Application (SPA) y Backend GraphQL API:

```text
mini-crm/
├── frontend/               # Cliente SPA Vue 3 + Vite + Tailwind CSS + Pinia + Apollo Client
│   ├── src/                # Vistas, componentes reutilizables, tiendas Pinia, operaciones GraphQL
│   └── README.md           # Documentación técnica detallada del Frontend
├── backend/                # API GraphQL + WebSockets + Express + Prisma ORM + PostgreSQL
│   ├── src/                # Resolvers, esquemas SDL, dataloaders anti-N+1, servicios
│   ├── prisma/             # Modelos de base de datos y scripts de seeding
│   └── README.md           # Documentación técnica detallada del Backend
├── docker-compose.yml      # Configuración de servicios Docker (PostgreSQL & Backend)
└── README.md               # Guía general del proyecto
```

---

## Características Destacadas

- **Dashboard Interactivo**:
  - Métricas de rendimiento personal e indicadores globales del CRM.
  - Filtro por rango de fechas (Time-Boxing) con calendario desplegable personalizado (`AppDatePicker`) y presets ("Todo", "Este Mes", "Este Año").
  - Gráficos de avance de proyectos y desglose por columnas Kanban.
- **Tablero Kanban en Tiempo Real**:
  - 4 columnas Kanban (`Por Hacer`, `En Progreso`, `En Revisión`, `Completado`) con Drag & Drop nativo con mouse.
  - Subscripciones WebSockets (`graphql-ws`) para actualizar el tablero al instante cuando otro usuario realiza cambios.
  - Ordenamiento y filtros por prioridad e historial independiente en cada columna.
  - Personalización de color individual por tarjeta o global.
- **Gestión de Proyectos**:
  - Creación y edición con asignación de líder/propietario, estado, rango de fechas e indicador de color personalizado.
  - Vista de detalle con métricas de tareas asociadas y progreso.
- **Administración de Usuarios y Seguridad**:
  - Control de acceso basado en roles (`ADMIN` y `USER`).
  - Creación de usuarios, edición de rol, reseteo de contraseña y deshabilitación suave con modal de confirmación.
  - Autenticación segura mediante JSON Web Tokens (JWT) y cifrado bcryptjs.
- **Modo Oscuro Global (Dark Mode)**:
  - Soporte completo en todas las pantallas, tablas, modales y componentes.
  - Toggle Switch animado en el header con icono de Sol y Luna en colores de la marca.

---

## Tecnologías Utilizadas

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | Vue 3 (Composition API), Vite 6, Tailwind CSS 3 (Dark Mode), Pinia, Vue Router 4, Apollo Client 3 |
| **Backend** | Node.js (v22), Express.js, Apollo Server 4 (GraphQL), WebSockets (`graphql-ws`), DataLoader |
| **Base de Datos & ORM** | PostgreSQL 16, Prisma ORM 5 |
| **Infraestructura** | Docker, Docker Compose, Pino Logger |

---

## Guía Rápida de Inicio

### 1. Clonar el Repositorio

```bash
git clone https://github.com/ecujcuj-2024028/mini-crm.git
cd mini-crm
```

### 2. Iniciar el Backend con Docker Compose

```bash
docker compose up -d --build
```

### 3. Migrar la Base de Datos y Poblar Datos Iniciales (Seeding)

```bash
cd backend
pnpm exec prisma db push
pnpm run prisma:seed
```

### 4. Iniciar el Frontend (Desarrollo)

```bash
cd ../frontend
pnpm install
pnpm dev
```

Accede al cliente web en: **`http://localhost:5173`**

---

## Puntos de Acceso del Sistema

- **Cliente Web Frontend**: `http://localhost:5173`
- **Servidor GraphQL HTTP**: `http://localhost:4000/graphql`
- **Subscripciones WebSockets**: `ws://localhost:4000/graphql`
- **Health Check REST**: `http://localhost:4000/health`

---

## Documentación Detallada por Módulo

- **[Documentación del Frontend (`frontend/README.md`)](file:///c:/Users/edvin/practicas/mini-crm/frontend/README.md)**: Detalle de componentes de UI, tiendas Pinia, estilos en modo oscuro y enrutamiento.
- **[Documentación del Backend (`backend/README.md`)](file:///c:/Users/edvin/practicas/mini-crm/backend/README.md)**: Esquemas GraphQL, resolvers, DataLoaders anti-N+1, suscripciones WebSockets y modelos de Prisma.
