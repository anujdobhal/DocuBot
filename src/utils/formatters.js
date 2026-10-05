/**
 * Format bytes into human-readable file sizes (e.g. 1.2 MB, 450 KB).
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '—';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Truncate long strings with ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Normalizes file type extension display (PDF, DOCX, TXT)
 * @param {string} typeOrExt
 * @returns {string}
 */
export function normalizeFileType(typeOrExt) {
  if (!typeOrExt) return 'UNKNOWN';
  const clean = typeOrExt.toLowerCase().replace('.', '').trim();
  if (clean.includes('pdf')) return 'PDF';
  if (clean.includes('docx') || clean.includes('word')) return 'DOCX';
  if (clean.includes('txt') || clean.includes('plain')) return 'TXT';
  return clean.toUpperCase();
}
