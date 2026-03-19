import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind conflict resolution.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency.
 *
 * @param {number} amount - The amount to format.
 * @param {string} [currency='NZD'] - ISO 4217 currency code.
 * @param {string} [locale='en-NZ'] - BCP 47 locale string.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(amount, currency = 'NZD', locale = 'en-NZ') {
  if (amount == null || isNaN(amount)) return '--';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object.
 *
 * @param {string|Date} date - The date to format.
 * @param {object} [options] - Intl.DateTimeFormat options.
 * @param {string} [locale='en-NZ'] - BCP 47 locale string.
 * @returns {string} Formatted date string.
 */
export function formatDate(date, options = {}, locale = 'en-NZ') {
  if (!date) return '--';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '--';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
}

/**
 * Format a number with locale-aware grouping.
 *
 * @param {number} value - The number to format.
 * @param {object} [options] - Intl.NumberFormat options.
 * @param {string} [locale='en-NZ'] - BCP 47 locale string.
 * @returns {string} Formatted number string.
 */
export function formatNumber(value, options = {}, locale = 'en-NZ') {
  if (value == null || isNaN(value)) return '--';

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}
