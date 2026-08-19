// Utilidades de manipulación y formateo de cadenas de texto

export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

export const capitalizeFirstLetter = (string) => {
  if (!string || typeof string !== 'string') return '';
  const trimmed = string.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const generateSlug = (title) => {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
};
