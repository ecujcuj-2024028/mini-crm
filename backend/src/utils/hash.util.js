import bcrypt from 'bcryptjs';

// Envoltura desacoplada de la librería bcryptjs para hashing y comparación de contraseñas

export const hashPassword = async (password, saltRounds = 10) => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
