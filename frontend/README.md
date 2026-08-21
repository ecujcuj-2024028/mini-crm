# Mini-CRM Frontend - Vue 3 + Vite + Tailwind CSS + GraphQL

Aplicación Web de Página Única (SPA) para la plataforma **Mini-CRM**, desarrollada con Vue 3 (Composition API), Vite, Tailwind CSS con Soporte Completo para Modo Oscuro, Pinia Store, Vue Router y Apollo Client GraphQL con Subscripciones WebSockets en Tiempo Real.

---

## Características Principales

- **Panel de Control (Dashboard)**: Métricas globales y personales en tiempo real, tasas de finalización de tareas/proyectos, desgloses Kanban y filtro por rango de fechas (Time-Boxing) con atajos rápidos ("Todo", "Este Mes", "Este Año").
- **Tablero Kanban Interactivo (`TasksView.vue`)**:
  - Drag & Drop nativo con mouse y táctil para mover tareas entre columnas (`Por Hacer`, `En Progreso`, `En Revisión`, `Completado`).
  - Actualizaciones en tiempo real mediante WebSockets (`graphql-ws`).
  - Filtros y ordenamiento independiente por cada columna.
  - Personalización de color por tarjeta individual o global por prioridad/estado.
- **Gestión de Proyectos (`ProjectsListView.vue` & `ProjectDetailView.vue`)**:
  - Métricas de progreso personalizadas, líder/propietario asignado, badges de estado y selector de paleta de colores individual por tarjeta.
  - Vista de detalle con conteo de tareas ligadas y rendimiento.
- **Administración de Usuarios (`UsersListView.vue`)**:
  - Exclusivo para administradores (`ADMIN`).
  - Creación, edición de rol, reseteo de contraseña y deshabilitación/restauración con confirmación modal.
- **Perfil de Usuario (`ProfileView.vue`)**:
  - Edición de información personal y cambio de contraseña seguro (botón primario reactivo al completar formulario).
- **Soporte Completo de Modo Oscuro (`dark` mode)**:
  - Paleta de colores nocturna personalizada (`#0F171C`, `#1A2830`, `#121E24`, `#2E3F49`, `#F3F6F7`).
  - Toggle Switch animado en el header con estética Sol y Luna en color marca `#5C7E8F`.
- **Componentes Reutilizables de UI**:
  - `AppDatePicker`: Calendario desplegable personalizado (Popover) con soporte para apertura superior e inferior (`dropDirection="up" | "down"`).
  - `AppModal`, `AppConfirmModal`, `AppInput`, `AppButton`, `AppPagination`, `AppBadge`.

---

## Tecnologías Utilizadas

- **Framework**: Vue 3 (Composition API `<script setup>`)
- **Gestión de Estado**: Pinia
- **Enrutamiento**: Vue Router 4
- **Estilos & UI**: Tailwind CSS 3 (Class-Based Dark Mode)
- **Cliente GraphQL**: Apollo Client 3 (`@apollo/client`, `@vue/apollo-composable`, `graphql-ws`)
- **Iconografía**: Iconos SVG nativos y Lucide Vue Next
- **Bundler & Dev Server**: Vite 6

---

## Arquitectura del Proyecto

```text
frontend/
├── src/
│   ├── apollo/
│   │   └── client.js             # Configuración de enlaces Apollo (HTTP Link + WebSocket Link)
│   ├── assets/                   # Estilos globales y recursos
│   ├── components/
│   │   ├── common/               # Componentes UI compartidos (Button, Input, Modal, DatePicker, Pagination)
│   │   ├── layout/               # AppLayout, AppHeader (con Toggle Switch), AppSidebar
│   │   ├── projects/             # ProjectCard, ProjectModal
│   │   ├── tasks/                # TaskCard, TaskModal, TaskDetailModal (Comentarios en vivo)
│   │   └── users/                # UserModal, ResetPasswordModal
│   ├── graphql/                  # Operaciones GraphQL (.gql) para Auth, Usuarios, Proyectos, Tareas y Comentarios
│   ├── router/                   # Rutas y guardias de navegación de autenticación
│   ├── stores/                   # Tiendas Pinia (Auth, Theme, Dashboard, User, Project, Task, Comment, Toast)
│   ├── views/                    # Vistas principales de la aplicación
│   │   ├── auth/                 # LoginView, RegisterView
│   │   ├── dashboard/            # DashboardView
│   │   ├── profile/              # ProfileView
│   │   ├── projects/             # ProjectsListView, ProjectDetailView
│   │   ├── tasks/                # TasksView (Tablero Kanban)
│   │   └── users/                # UsersListView
│   ├── App.vue                   # Componente raíz con inicialización de tema
│   ├── main.js                   # Punto de entrada de Vue 3
│   └── style.css                 # Importaciones base de Tailwind CSS y reglas globales
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Configuración e Instalación

### 1. Requisitos Previos

- Node.js (v18+)
- `pnpm` (o `npm` / `yarn`)
- Servidor backend corriendo en `http://localhost:4000/graphql` y `ws://localhost:4000/graphql`

### 2. Instalación de Dependencias

```bash
cd frontend
pnpm install
```

### 3. Servidor de Desarrollo

```bash
pnpm dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 4. Compilación para Producción

```bash
pnpm build
```

Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

---

## Paleta de Colores de la Marca (Light / Dark)

| Elemento | Modo Claro (Light) | Modo Oscuro (Dark) |
| :--- | :--- | :--- |
| **Fondo Principal** | `#F3F6F7` | `#0F171C` |
| **Tarjetas / Contenedores** | `white` | `#1A2830` |
| **Header / Inputs / Filas** | `#F3F6F7` | `#121E24` |
| **Bordes & Separadores** | `#E4EAED` / `#C7C7C7` | `#2E3F49` |
| **Texto Primario** | `#263840` | `#F3F6F7` |
| **Texto Secundario** | `#6E6E6E` | `#A2B3BC` |
| **Acento Primario / Marca**| `#5C7E8F` | `#5C7E8F` / `#8CA7B3` |
