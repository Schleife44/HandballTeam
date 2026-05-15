/**
 * Data Normalization & Validation Utilities
 * Ensures data integrity across the entire application.
 */

/**
 * Normalizes a string by trimming whitespace and removing double spaces.
 * Ideal for player names and team names.
 */
export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Formats an ISO date string or Date object into a German readable format.
 * Example: 2026-05-15 -> 15.05.2026
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--';

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return d.toLocaleDateString('de-DE', options);
};

/**
 * Generates a unique, URL-safe ID with an optional prefix.
 */
export const generateId = (prefix = 'id') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Validates if a string is a valid email address.
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Safely access nested objects or return a fallback.
 */
export const getSafe = (obj, path, fallback = null) => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return fallback;
    result = result[key];
  }
  return result !== undefined ? result : fallback;
};
