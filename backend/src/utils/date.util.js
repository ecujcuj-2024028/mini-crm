// Utilidades puras para el manejo, formateo y validación de fechas

export const formatToISO = (date) => {
  if (!date) return null;
  const parsedDate = date instanceof Date ? date : new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  return end >= start;
};
