/**
 * Formats a date string or timestamp into a clean, human-readable format.
 * Examples:
 * - "Today, 11:42 AM"
 * - "Yesterday, 3:15 PM"
 * - "2 Oct 2026, 11:42 AM"
 *
 * @param {string | number | Date} dateInput
 * @returns {string}
 */
export function formatHumanDate(dateInput) {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  // Format time as "11:42 AM"
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  // Format as "2 Oct 2026, 11:42 AM"
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}, ${timeStr}`;
}

/**
 * Format a duration in seconds/ms into readable text (e.g., "12.4s" or "1m 30s")
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return '—';
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.round(seconds % 60);
  return `${mins}m ${remSecs}s`;
}
