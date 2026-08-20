# Mini-CRM GraphQL API Backend

Servidor backend para la plataforma de gestión de relaciones con clientes (Mini-CRM) desarrollado con Node.js, Express, Apollo Server 4, Prisma ORM, PostgreSQL, Docker y WebSockets (`graphql-ws`).

## Descripción General

El backend proporciona una interfaz de programación de aplicaciones (API) robusta basada en GraphQL y REST para la gestión de autenticación, usuarios, proyectos, tareas, comentarios, métricas de dashboard y notificaciones en tiempo real.

---

## Arquitectura y Estructura del Código

```text
backend/
├── prisma/
│   ├── schema.prisma        # Esquema de base de datos de Prisma
│   └── seed.js              # Script ejecutable de población inicial de datos
├── src/
│   ├── auth/
│   │   └── context.js       # Autenticación JWT y guards de autorización
│   ├── config/
│   │   ├── database.js      # Cliente de Prisma (Fuente única de verdad)
│   │   ├── env.js           # Cargador y validador de variables de entorno
│   │   ├── pubsub.js        # Instancia singleton de PubSub e identificadores
│   │   ├── rateLimit.js     # Middleware de restricción de tasa de peticiones
│   │   └── seeder.config.js # Configuración de credenciales iniciales
│   ├── dataloaders/
│   │   ├── project.loader.js # Carga por lotes para resolver Proyectos (Anti N+1)
│   │   ├── task.loader.js    # Carga por lotes para resolver Tareas (Anti N+1)
│   │   └── user.loader.js    # Carga por lotes para resolver Usuarios (Anti N+1)
│   ├── graphql/
│   │   ├── typeDefs.js      # Definiciones del esquema GraphQL (SDL)
│   │   └── resolvers/
│   │       ├── auth.resolver.js         # Resolvers de autenticación
│   │       ├── comment.resolver.js      # Resolvers de comentarios
│   │       ├── dashboard.resolver.js    # Resolvers de métricas y estadísticas
│   │       ├── index.js                 # Exportador consolidado de resolvers
│   │       ├── project.resolver.js      # Resolvers de proyectos
│   │       ├── subscription.resolver.js # Resolvers de subscripciones en tiempo real
│   │       ├── task.resolver.js         # Resolvers de tareas
│   │       └── user.resolver.js         # Resolvers de usuarios
│   ├── utils/
│   │   ├── date.util.js     # Formateo ISO 8601 y validaciones de rango de fechas
│   │   ├── hash.util.js     # Cifrado y comparación de contraseñas con bcrypt
│   │   ├── logger.js        # Logging estructurado asíncrono con Pino
│   │   ├── pagination.js    # Cálculo de paginación limit/offset
│   │   ├── string.util.js    # Normalización de correo y utilidades de texto
│   │   └── validators.js    # Validación de formato de correo y contraseña
│   └── server.js            # Punto de entrada y servidor HTTP/WebSocket
└── package.json
```

---

## Módulos Implementados

### 1. Autenticación y Seguridad de Acceso
- **Mutaciones**: `register`, `login`.
- **Query**: `me`.
- **Características**:
  - Emisión y verificación de tokens de acceso JWT.
  - Cifrado de contraseñas mediante bcrypt.
  - Protección contra ataques de temporización en inicios de sesión fallidos.
  - Validación de formato de correo electrónico mediante expresiones regulares.

### 2. Módulo de Gestión de Usuarios
- **Queries**: `users`, `user`.
- **Mutaciones**: `createUser`, `updateUser`, `deleteUser`, `restoreUser`, `updateMyProfile`, `changeMyPassword`, `adminResetPassword`.
- **Características**:
  - Control de acceso basado en roles (`ADMIN` y `USER`).
  - Borrado lógico (Soft Delete) liberando la dirección de correo original mediante el renombrado `deleted_<timestamp>_<email>`.
  - Protección contra auto-sabotaje (un administrador no puede eliminarse ni degradar su propio rol).
  - Paginación estándar con recuento total de registros.

### 3. Módulo de Gestión de Proyectos
- **Queries**: `myProjects`, `projects`, `project`.
- **Mutaciones**: `createProject`, `updateProject`, `deleteProject`, `restoreProject`.
- **Características**:
  - Prevención de referencias directas inseguras a objetos (IDOR): usuarios con rol `USER` únicamente acceden a sus propios proyectos.
  - Validación de rango lógico de fechas (`endDate >= startDate`).
  - Optimización de rendimiento mediante `userLoader` (DataLoader) para eliminar el problema de consultas N+1 al resolver el propietario del proyecto.
  - Formateo estandarizado de fechas en cadenas ISO 8601.

### 4. Módulo de Gestión de Tareas
- **Queries**: `tasks`, `myAssignedTasks`, `task`.
- **Mutaciones**: `createTask`, `updateTask`, `deleteTask`, `restoreTask`.
- **Características**:
  - Permisos de acceso granulares:
    - Propietario del proyecto o `ADMIN`: permiso total sobre la tarea.
    - Usuario asignado: permiso exclusivo para modificar únicamente el estado (`status`). Intento de modificar otros campos genera un rechazo de autorización.
  - Soft Delete en cascada sobre todas las tareas anidadas mediante transacciones ACID (`prisma.$transaction`) al eliminar un proyecto.
  - Optimización N+1 mediante `projectLoader` y `userLoader`.

### 5. Módulo de Comentarios en Tareas
- **Queries**: `comments`, `comment`, `Task.comments`, `Task.commentsCount`.
- **Mutaciones**: `createComment`, `updateComment`, `deleteComment`, `restoreComment`.
- **Características**:
  - Permisos de autoría: la edición del texto de un comentario está restringida exclusivamente a su autor o a un `ADMIN`.
  - Borrado lógico de comentarios.
  - Optimización N+1 mediante `taskLoader` y `userLoader`.

### 6. Módulo de Resumen de Dashboard y Estadísticas
- **Query**: `dashboardSummary(startDate: String, endDate: String)`.
- **Características**:
  - Consulta agregada optimizada utilizando agrupadrores nativos `prisma.project.groupBy` y `prisma.task.groupBy` en solo 2 consultas a la base de datos.
  - Filtrado opcional por rangos de fecha de creación (Time-boxing).
  - Separación limpia de actividad reciente en `recentProjects` y `recentTasks`.
  - Aislamiento de métricas por rol (un usuario `USER` únicamente visualiza métricas asociadas a sus proyectos y tareas).

### 7. Subscripciones GraphQL en Tiempo Real
- **Subscripciones**: `taskAssigned(userId: ID!)`, `commentAdded(taskId: ID!)`, `projectStatusChanged(projectId: ID)`.
- **Características**:
  - Protocolo WebSocket (`graphql-ws`) en el punto de acceso `ws://localhost:4000/graphql`.
  - Autenticación estricta durante el apretón de manos inicial (`connectionInit`) rechazando conexiones con token inválido con error 4403.
  - Entrega dirigida de notificaciones mediante `withFilter` para evitar la emisión indiscriminada de eventos a usuarios no destinatarios.

---

## Configuración de Variables de Entorno

Crear un archivo `.env` en la raíz del directorio `backend/` basándose en `.env.example`:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://minicrm_user:minicrm_password@localhost:5433/minicrm_db?schema=public"
JWT_SECRET=super_secret_jwt_key_crm_2026

RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=100

ADMIN_NAME="Administrador CRM"
ADMIN_EMAIL="admin@crm.com"
ADMIN_PASSWORD="admin_password_123"
```

---

## Instalación y Ejecución

### 1. Requisitos Previos
- Node.js (versión 22 o superior)
- pnpm (versión 11 o superior)
- Docker Desktop / Docker Engine y Docker Compose

### 2. Inicio del Entorno con Docker Compose

Desde la raíz del proyecto principal:

```bash
docker compose up -d --build
```

### 3. Ejecución de Migraciones de Base de Datos y Población Inicial

Para sincronizar las tablas en PostgreSQL y crear la cuenta inicial de administrador:

```bash
cd backend
pnpm exec prisma db push
pnpm run prisma:seed
```

### 4. Puntos de Acceso Disponibles

- **Servidor GraphQL HTTP**: `http://localhost:4000/graphql`
- **Servidor GraphQL WebSockets**: `ws://localhost:4000/graphql`
- **Interfaz Apollo Sandbox**: `http://localhost:4000/graphql`
- **Endpoint REST Health Check**: `http://localhost:4000/health`

---

## Medidas de Seguridad Incorporadas

1. **Límite de Profundidad en Consultas (Depth Limit)**:
   - Se aplica `graphql-depth-limit` restrictivo de máximo 6 niveles para prevenir la denegación de servicio por consultas anidadas recursivas.
2. **Restricción de Tasa de Peticiones (Rate Limiting)**:
   - Configurado con `express-rate-limit` leyendo dinámicamente las variables de ventana de tiempo y número máximo de solicitudes.
3. **Encabezados HTTP de Seguridad (Helmet)**:
   - Protección contra vulnerabilidades web comunes como XSS, clickjacking e inspección MIME.
4. **Prevención Vulnerabilidades IDOR**:
   - Verificación de propiedad en resolvers para denegar el acceso a recursos ajenos en el rol `USER`.

---
