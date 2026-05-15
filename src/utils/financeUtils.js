/**
 * Finance Utilities for Sechsmeter
 * Centralized logic for money calculation and formatting to prevent errors.
 */

/**
 * Safely converts any value to a valid number.
 * Prevents the "string concatenation" bug (e.g., 60 + 10 = 6010).
 */
export const toNum = (value) => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'string' 
    ? parseFloat(value.replace(',', '.')) 
    : parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a numeric value as a currency string (Euro by default).
 */
export const formatCurrency = (value, locale = 'de-DE', currency = 'EUR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(toNum(value));
};

/**
 * Calculates the sum of a specific field in an array of objects.
 */
export const sumField = (items, fieldName) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + toNum(item[fieldName]), 0);
};

/**
 * Returns the current month in YYYY-MM format.
 */
export const getCurrentMonthString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Parses a month string like "2026-05" into a human-readable German format.
 */
export const formatMonthLabel = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
};
