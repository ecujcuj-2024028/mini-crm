import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mini_crm_secret_jwt_key_2026_super_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = '$2a$10$wN9iL6wG3P9mK1sT1X3eOuF3.vY2G5qW7K1L2M3N4O5P6Q7R8S9T0';

export const authResolver = {
  Query: {
    me: async (_, __, context) => {
      if (!context.user) return null;
      return prisma.user.findUnique({
        where: { id: context.user.id }
      });
    }
  },
  Mutation: {
    register: async (_, { name, email, password }) => {
      const formattedEmail = email.toLowerCase().trim();

      if (!EMAIL_REGEX.test(formattedEmail)) {
        throw new Error('Invalid email format.');
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: formattedEmail }
      });

      if (existingUser) {
        throw new Error('Email address is already registered.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

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
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return { token, user };
    },

    login: async (_, { email, password }) => {
      const formattedEmail = email.toLowerCase().trim();

      if (!EMAIL_REGEX.test(formattedEmail)) {
        throw new Error('Invalid email format.');
      }

      const user = await prisma.user.findUnique({
        where: { email: formattedEmail }
      });

      // Proteccion contra Timing Attacks (Simulacion de tiempo de comparacion bcrypt si el usuario no existe)
      if (!user) {
        await bcrypt.compare(password, DUMMY_HASH);
        throw new Error('Invalid credentials. Incorrect email or password.');
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid credentials. Incorrect email or password.');
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return { token, user };
    }
  }
};