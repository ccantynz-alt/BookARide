/**
 * API URL configuration.
 *
 * DEFAULT: All /api/* calls go to same-origin Vercel serverless functions.
 * No separate backend needed — everything runs on one Vercel project.
 *
 * Set VITE_BACKEND_URL to override with a specific backend URL.
 */
const RENDER_BACKEND = 'https://bookaride-backend.onrender.com';

const getBackendUrl = () => {
  // Explicit override — use a specific backend URL
  const env = import.meta.env.VITE_BACKEND_URL;
  if (env && env !== 'undefined') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }

  // Default: same-origin (Vercel serverless functions at /api/*)
  // Partner domains, Vercel previews, and production all use same-origin
  if (typeof window !== 'undefined') {
    const origin = window.location.origin || '';
    // Localhost dev still needs the Render backend (no local serverless)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return RENDER_BACKEND;
    }
  }

  return ''; // Same-origin
};

export const RENDER_BACKEND_URL = RENDER_BACKEND;
export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
