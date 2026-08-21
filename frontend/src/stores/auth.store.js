import { defineStore } from 'pinia';
import { apolloClient } from '../apollo/client';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  ME_QUERY,
  UPDATE_MY_PROFILE_MUTATION,
  CHANGE_MY_PASSWORD_MUTATION
} from '../graphql/auth.gql';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    loading: false,
    error: null,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'ADMIN'
  },

  actions: {
    // Iniciar sesión
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.mutate({
          mutation: LOGIN_MUTATION,
          variables: { email, password }
        });

        const { token, user } = data.login;
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        await apolloClient.resetStore();
        return user;
      } catch (err) {
        this.error = err.message || 'Error al iniciar sesión';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Registrar nuevo usuario
    async register(name, email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.mutate({
          mutation: REGISTER_MUTATION,
          variables: { name, email, password }
        });

        const { token, user } = data.register;
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        await apolloClient.resetStore();
        return user;
      } catch (err) {
        this.error = err.message || 'Error al registrar usuario';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Rehidratar datos del usuario autenticado (me)
    async fetchMe() {
      if (!this.token) {
        this.initialized = true;
        return null;
      }

      this.loading = true;
      try {
        const { data } = await apolloClient.query({
          query: ME_QUERY,
          fetchPolicy: 'network-only'
        });

        if (data?.me && data.me.isActive) {
          this.user = data.me;
          return data.me;
        } else {
          this.logout();
          return null;
        }
      } catch (err) {
        this.logout();
        return null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    // Actualizar perfil del usuario actual
    async updateProfile(name, email) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.mutate({
          mutation: UPDATE_MY_PROFILE_MUTATION,
          variables: { name, email }
        });

        this.user = { ...this.user, ...data.updateMyProfile };
        return this.user;
      } catch (err) {
        this.error = err.message || 'Error al actualizar el perfil';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Cambiar contraseña del usuario actual
    async changePassword(currentPassword, newPassword) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.mutate({
          mutation: CHANGE_MY_PASSWORD_MUTATION,
          variables: { currentPassword, newPassword }
        });

        return data.changeMyPassword;
      } catch (err) {
        this.error = err.message || 'Error al cambiar la contraseña';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Cerrar sesión
    logout() {
      this.token = null;
      this.user = null;
      this.error = null;
      localStorage.removeItem('token');
      apolloClient.clearStore();
    }
  }
});
