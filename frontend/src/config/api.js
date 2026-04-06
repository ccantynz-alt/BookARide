/**
 * API URL configuration.
 *
 * ARCHITECTURE: Everything runs on Vercel as serverless functions.
 * All /api/* calls go to same-origin Vercel serverless functions.
 * There is NO Render backend. It was deprecated.
 *
 * Override: Set VITE_BACKEND_URL in Vercel env vars to point somewhere else.
 */

const getBackendUrl = () => {
  // Explicit override via env var
  const env = import.meta.env.VITE_BACKEND_URL;
  if (env && env !== 'undefined' && env !== '') {
    return env.endsWith('/') ? env.slice(0, -1) : env;
  }

  // Default: same-origin (Vercel serverless functions in /api)
  return '';
};

export const BACKEND_URL = getBackendUrl();
export const API = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
