import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { hashPassword, comparePassword } from '../../utils/hash.util.js';
import { isValidEmail, isValidPassword } from '../../utils/validators.js';
import { normalizeEmail } from '../../utils/string.util.js';

const DUMMY_HASH = '$2a$10$wN9iL6wG3P9mK1sT1X3eOuF3.vY2G5qW7K1L2M3N4O5P6Q7R8S9T0';

export const authResolver = {
  Query: {
    // Obtener perfil del usuario autenticado actual
    me: async (_, __, context) => {
      if (!context.user) return null;
      return prisma.user.findUnique({
        where: { id: context.user.id }
      });
    }
  },
  Mutation: {
    // Registro público de nuevos usuarios
    register: async (_, { name, email, password }) => {
      const formattedEmail = normalizeEmail(email);

      if (!isValidEmail(formattedEmail)) {
        throw new Error('Invalid email format.');
      }

      if (!isValidPassword(password, 6)) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: formattedEmail }
      });

      if (existingUser) {
        throw new Error('Email address is already registered.');
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: formattedEmail,
          password: hashedPassword,
          role: 'USER'
        }
      });

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return { token, user };
    },

    // Inicio de sesión de usuarios con protección contra Timing Attacks
    login: async (_, { email, password }) => {
      const formattedEmail = normalizeEmail(email);

      if (!isValidEmail(formattedEmail)) {
        throw new Error('Invalid email format.');
      }

      const user = await prisma.user.findUnique({
        where: { email: formattedEmail }
      });

      // Protección contra Timing Attacks si el usuario no existe
      if (!user) {
        await comparePassword(password, DUMMY_HASH);
        throw new Error('Invalid credentials. Incorrect email or password.');
      }

      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid credentials. Incorrect email or password.');
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return { token, user };
    }
  }
};