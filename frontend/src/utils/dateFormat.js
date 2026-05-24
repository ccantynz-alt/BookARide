/**
 * Shared date formatting utilities for the admin dashboard.
 *
 * All admin components MUST use these helpers — never implement
 * formatDate locally. This keeps the UI consistent and makes it
 * easy to change the format project-wide in one place.
 *
 * Canonical format: DD/MM/YYYY (New Zealand standard)
 */

/**
 * Format a YYYY-MM-DD date string as DD/MM/YYYY.
 * Handles nulls gracefully, returns 'N/A' for empty values.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  // Accept both "YYYY-MM-DD" and ISO strings like "2026-04-06T00:00:00Z"
  const datePart = String(dateStr).split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return datePart;
};

/**
 * Format a date string with the day of week prepended.
 * Example: "Mon 06/04/2026"
 */
export const formatDateWithDay = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const datePart = String(dateStr).split('T')[0];
    const d = new Date(datePart + 'T00:00:00');
    const dow = d.toLocaleDateString('en-NZ', { weekday: 'short' });
    return `${dow} ${formatDate(dateStr)}`;
  } catch {
    return formatDate(dateStr);
  }
};

/**
 * Get the full day of week name for a date string.
 * Example: "Monday"
 */
export const getDayOfWeek = (dateStr) => {
  if (!dateStr) return '';
  try {
    const datePart = String(dateStr).split('T')[0];
    const d = new Date(datePart + 'T00:00:00');
    return d.toLocaleDateString('en-NZ', { weekday: 'long' });
  } catch {
    return '';
  }
};

/**
 * Get the short day of week name for a date string.
 * Example: "Mon"
 */
export const getShortDayOfWeek = (dateStr) => {
  if (!dateStr) return '';
  try {
    const datePart = String(dateStr).split('T')[0];
    const d = new Date(datePart + 'T00:00:00');
    return d.toLocaleDateString('en-NZ', { weekday: 'short' });
  } catch {
    return '';
  }
};

/**
 * Format a full timestamp (ISO string or Date) as DD/MM/YYYY HH:MM.
 * Used for fields like createdAt, deletedAt, archivedAt.
 */
export const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Format just the date part of a timestamp as DD/MM/YYYY.
 * Used for fields like archivedAt, deletedAt that should show date only.
 */
export const formatTimestampDate = (value) => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Get today's date in YYYY-MM-DD format (NZ timezone).
 * Used for date pickers with min={today}.
 */
export const todayNZ = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Check if a YYYY-MM-DD date string is today.
 */
export const isToday = (dateStr) => {
  if (!dateStr) return false;
  return String(dateStr).split('T')[0] === todayNZ();
};

/**
 * Check if a YYYY-MM-DD date string is tomorrow.
 */
export const isTomorrow = (dateStr) => {
  if (!dateStr) return false;
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return String(dateStr).split('T')[0] === `${y}-${m}-${d}`;
};
