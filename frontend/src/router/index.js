import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import AppLayout from '../components/layout/AppLayout.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { guestOnly: true }
  },
  // Rutas Autenticadas Envueltas en el Shell AppLayout
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/DashboardView.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/UsersListView.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/profile/ProfileView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de Navegacion para proteccion de rutas autenticadas y restricciones por rol
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Hidratar la sesion si el store aun no ha sido inicializado
  if (!authStore.initialized && authStore.token) {
    await authStore.fetchMe();
  }

  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'Dashboard' });
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    return next({ name: 'Dashboard' });
  }

  next();
});

export default router;
