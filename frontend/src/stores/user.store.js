import { defineStore } from 'pinia';
import { apolloClient } from '../apollo/client';
import {
  USERS_PAGINATED_QUERY,
  CREATE_USER_MUTATION,
  UPDATE_USER_MUTATION,
  DELETE_USER_MUTATION,
  RESTORE_USER_MUTATION,
  ADMIN_RESET_PASSWORD_MUTATION
} from '../graphql/users.gql';

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10,
    roleFilter: null,
    searchQuery: '',
    loading: false,
    error: null
  }),

  actions: {
    // Cargar lista paginada de usuarios con filtros
    async fetchUsers(page = this.page, role = this.roleFilter, search = this.searchQuery) {
      this.loading = true;
      this.error = null;
      this.page = page;

      const offset = (page - 1) * this.limit;

      try {
        const { data } = await apolloClient.query({
          query: USERS_PAGINATED_QUERY,
          variables: {
            search: search || undefined,
            role: role || undefined,
            includeDeactivated: true,
            limit: this.limit,
            offset
          },
          fetchPolicy: 'network-only'
        });

        if (data?.users) {
          this.users = data.users.items;
          this.total = data.users.totalCount;
          this.totalPages = Math.ceil(data.users.totalCount / this.limit) || 1;
        }
      } catch (err) {
        this.error = err.message || 'Error al obtener la lista de usuarios';
      } finally {
        this.loading = false;
      }
    },

    // Crear usuario (Admin)
    async createUser(input) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: CREATE_USER_MUTATION,
          variables: {
            name: input.name,
            email: input.email,
            password: input.password,
            role: input.role
          }
        });
        await this.fetchUsers(1);
      } catch (err) {
        this.error = err.message || 'Error al crear el usuario';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Actualizar usuario (Admin)
    async updateUser(id, input) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: UPDATE_USER_MUTATION,
          variables: {
            id,
            name: input.name,
            email: input.email,
            role: input.role
          }
        });
        await this.fetchUsers();
      } catch (err) {
        this.error = err.message || 'Error al actualizar el usuario';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Eliminar usuario suave (Admin)
    async deleteUser(id) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: DELETE_USER_MUTATION,
          variables: { id }
        });
        await this.fetchUsers();
      } catch (err) {
        this.error = err.message || 'Error al eliminar el usuario';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Restaurar usuario eliminado (Admin)
    async restoreUser(id) {
      this.loading = true;
      this.error = null;
      try {
        await apolloClient.mutate({
          mutation: RESTORE_USER_MUTATION,
          variables: { id }
        });
        await this.fetchUsers();
      } catch (err) {
        this.error = err.message || 'Error al restaurar el usuario';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Resetear contraseña de un usuario (Admin)
    async resetPassword(userId, newPassword) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await apolloClient.mutate({
          mutation: ADMIN_RESET_PASSWORD_MUTATION,
          variables: { userId, newPassword }
        });
        return data.adminResetPassword;
      } catch (err) {
        this.error = err.message || 'Error al restablecer la contraseña';
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
