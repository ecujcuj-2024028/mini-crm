// Funciones de validación de formato reutilizables

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export const isValidPassword = (password, minLength = 6) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
};
