import { prisma } from '../../config/database.js';
import { requireAuth, requireAdmin } from '../../auth/context.js';
import { hashPassword, comparePassword } from '../../utils/hash.util.js';
import { isValidEmail, isValidPassword } from '../../utils/validators.js';
import { getPagination } from '../../utils/pagination.js';
import { normalizeEmail } from '../../utils/string.util.js';

export const userResolver = {
  Query: {
    // Listar usuarios con búsqueda, filtro por rol, inclusión opcional de desactivados y paginación (Solo Admin)
    users: async (_, { search, role, includeDeactivated = false, limit = 10, offset = 0 }, context) => {
      requireAdmin(context.user);

      const where = {};

      if (!includeDeactivated) {
        where.isActive = true;
      }

      if (role) {
        where.role = role;
      }

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      const { take, skip } = getPagination({ limit, offset });

      const [items, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return {
        items,
        totalCount,
        hasMore: skip + items.length < totalCount
      };
    },

    // Consultar detalle de un usuario específico por su ID
    user: async (_, { id }, context) => {
      requireAuth(context.user);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new Error('User not found.');
      }
      return user;
    }
  },

  Mutation: {
    // Autoservicio: Actualizar perfil propio (Nombre o correo)
    updateMyProfile: async (_, { name, email }, context) => {
      requireAuth(context.user);

      const userId = context.user.id;
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });

      if (!currentUser || !currentUser.isActive) {
        throw new Error('User account disabled or not found.');
      }

      const data = {};
      if (name !== undefined) data.name = name.trim();

      if (email !== undefined) {
        const formattedEmail = normalizeEmail(email);
        if (!isValidEmail(formattedEmail)) {
          throw new Error('Invalid email format.');
        }

        if (formattedEmail !== currentUser.email) {
          const emailOccupied = await prisma.user.findFirst({
            where: { email: formattedEmail, isActive: true }
          });
          if (emailOccupied) {
            throw new Error('Email address is already in use.');
          }
          data.email = formattedEmail;
        }
      }

      return prisma.user.update({
        where: { id: userId },
        data
      });
    },

    // Autoservicio: Cambiar propia contraseña verificando la contraseña actual
    changeMyPassword: async (_, { currentPassword, newPassword }, context) => {
      requireAuth(context.user);

      const userId = context.user.id;
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });

      if (!currentUser || !currentUser.isActive) {
        throw new Error('User account disabled or not found.');
      }

      // Validar contraseña actual antes de modificar
      const validCurrentPassword = await comparePassword(currentPassword, currentUser.password);
      if (!validCurrentPassword) {
        throw new Error('Current password is incorrect.');
      }

      if (!isValidPassword(newPassword, 6)) {
        throw new Error('New password must be at least 6 characters long.');
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return true;
    },

    // Crear usuario nuevo desde panel de administración (Solo Admin)
    createUser: async (_, { name, email, password, role = 'USER' }, context) => {
      requireAdmin(context.user);

      const formattedEmail = normalizeEmail(email);

      if (!isValidEmail(formattedEmail)) {
        throw new Error('Invalid email format.');
      }

      if (!isValidPassword(password, 6)) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const existingUser = await prisma.user.findFirst({
        where: { email: formattedEmail, isActive: true }
      });

      if (existingUser) {
        throw new Error('Email address is already in use by an active user.');
      }

      const hashedPassword = await hashPassword(password);

      return prisma.user.create({
        data: {
          name: name.trim(),
          email: formattedEmail,
          password: hashedPassword,
          role
        }
      });
    },

    // Editar datos o rol de un usuario existente (Solo Admin)
    updateUser: async (_, { id, name, email, role }, context) => {
      requireAdmin(context.user);

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || !targetUser.isActive) {
        throw new Error('User not found or is deactivated.');
      }

      // Prevención de Auto-Sabotaje: Un ADMIN no puede degradar su propio rol a USER
      if (id === context.user.id && role && role !== 'ADMIN') {
        throw new Error('You cannot demote your own Administrator role.');
      }

      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (role !== undefined) data.role = role;

      if (email !== undefined) {
        const formattedEmail = normalizeEmail(email);
        if (!isValidEmail(formattedEmail)) {
          throw new Error('Invalid email format.');
        }

        if (formattedEmail !== targetUser.email) {
          const emailOccupied = await prisma.user.findFirst({
            where: { email: formattedEmail, isActive: true }
          });
          if (emailOccupied) {
            throw new Error('Email address is already in use.');
          }
          data.email = formattedEmail;
        }
      }

      return prisma.user.update({
        where: { id },
        data
      });
    },

    // Borrado Lógico (Soft Delete) y liberación de email (Solo Admin)
    deleteUser: async (_, { id }, context) => {
      requireAdmin(context.user);

      // Prevención de Auto-Sabotaje: Un ADMIN no puede borrarse a sí mismo
      if (id === context.user.id) {
        throw new Error('You cannot delete your own Administrator account.');
      }

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || !targetUser.isActive) {
        throw new Error('User not found or already deactivated.');
      }

      // Renombrar email para liberar el correo original
      const deletedEmail = `deleted_${Date.now()}_${targetUser.email}`;

      await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          email: deletedEmail
        }
      });

      return true;
    },

    // Restaurar / Reactivar una cuenta de usuario previamente desactivada (Solo Admin)
    restoreUser: async (_, { id }, context) => {
      requireAdmin(context.user);

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        throw new Error('User not found.');
      }

      if (targetUser.isActive) {
        throw new Error('User account is already active.');
      }

      // Recuperar el correo original removiendo el prefijo deleted_<timestamp>_
      const originalEmail = targetUser.email.replace(/^deleted_\d+_/, '');

      // Verificar si el correo original fue tomado por otra cuenta activa mientras estaba desactivado
      const emailOccupied = await prisma.user.findFirst({
        where: { email: originalEmail, isActive: true }
      });

      if (emailOccupied) {
        throw new Error('Cannot restore user. Original email address is currently occupied by another active user.');
      }

      return prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          email: originalEmail
        }
      });
    },

    // Restablecimiento forzado de contraseña por el Administrador (Solo Admin)
    adminResetPassword: async (_, { userId, newPassword }, context) => {
      requireAdmin(context.user);

      if (!isValidPassword(newPassword, 6)) {
        throw new Error('New password must be at least 6 characters long.');
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser || !targetUser.isActive) {
        throw new Error('User not found or is deactivated.');
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return true;
    }
  },

  // Resolver de campo para calcular el número de proyectos del usuario
  User: {
    projectsCount: async (parent) => {
      return prisma.project.count({ where: { userId: parent.id } });
    }
  }
};
