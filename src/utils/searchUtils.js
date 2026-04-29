/**
 * Robust search normalization for Sechsmeter.
 * Handles German umlauts and other variations to ensure names are found 
 * even if typed slightly differently (e.g., Telgenbüscher vs Telgenbuescher).
 */

/**
 * Normalizes a string for comparison.
 * - Converts to lowercase
 * - Normalizes Unicode (NFD)
 * - Replaces German umlauts (ü -> ue, etc.)
 * - Removes non-alphanumeric characters (optional, but good for robustness)
 * - Trims whitespace
 * 
 * @param {string} str The string to normalize
 * @returns {string} The normalized string
 */
export function normalizeSearchString(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .trim()
    // Handle German specific replacements first
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // Fallback for other accents using normalization
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if a haystack contains a needle using normalized comparison.
 * 
 * @param {string} haystack The string to search in
 * @param {string} needle The search term
 * @returns {boolean} True if found
 */
export function fuzzyMatch(haystack, needle) {
  if (!needle) return true;
  const normalizedHaystack = normalizeSearchString(haystack);
  const normalizedNeedle = normalizeSearchString(needle);
  return normalizedHaystack.includes(normalizedNeedle);
}
